const WebSocket = require("ws");
const Entities = require("./Entities.js");

const Network = require("./Network/Network.js");
const PacketIds = require("./Network/PacketIds.json");

const Party = require("./Party.js");
const deePool = require("deepool");

const RAPIER = require("@dimforge/rapier2d-compat");
const HandleRpc = require("./Network/HandleRpc.js");

class Server {
  constructor(serverInfo) {
    /*
     *
     * Variables required for game logic
     *
     */

    // An incremental key to keep track of game logic ticks
    this.tick = 0;

    // An object that contains tick callbacks that must be run
    // Keys of this object will be a tick that a callback must be executed on, and the value will be an
    // array of functions to be executed
    this.tickCallbacks = {};

    // An object that contains all of the server properties
    this.serverProperties = {
      mapSize: {
        width: 24000,
        height: 24000,
      },
      maxPlayerCount: 32,
      maxPlayerPartyLimit: 4,
      tickRate: 50,
      minimumBuildDistanceFromWall: 4,
      maxFactoryBuildDistance: 18,
      minFactoryToFactoryDistance: 18 * 2 + 20, // maxFactoryBuildDistance doubled
      maxPlayerBuildDistance: 16,
      maxPlayerSpellCastDistance: 40,
      treeCount: 400,
      stoneCount: 400,
      neutralSpawnCount: 0,
    };

    // An object that contains entities as its values and the entities' uid as its keys
    this.entities = {};

    this.changedEntityProperties = {};
    this.entitiesWithChangedProps = new Set();

    // An array whose even items are entity uids and odd items are props to be cleared
    // hits and lastPlayerDamages should only be sent once
    this.propsToBeCleared = [];

    // We set this boolean to disable the prop checker proxy.
    // If we set a prop, send it to a client, then clear it, the server will send the cleared prop
    // so we avoid that by bypassing the proxy
    this.clearingProps = false;

    // When placing buildings, two buildings can be placed in the same place if processed in the same tick
    // to prevent this from happening, we have to call World.updateSceneQueries()
    // but this is really slow, so instead we keep track of buildings placed in each tick
    // to check if they overlap
    this.tentativeBuildingPositions = {};

    // Maps RAPIER collider handles to entity object references
    this.colliderHandleEntityMap = {};

    // Data containing information about entities must be stored in order to
    // make the tick data lighter. This is to ensure that the server doesn't
    // repetitively send the same data to the client.

    // The keys of this object are player uids, and the values are the
    // entity data that the player knows, also being an object. This
    // nested object's keys are entity's uids and the values are the
    // entity's data that is known.
    this.cachedEntityUpdateData = {};

    // An object that contains the connected sockets, whose keys are their respective player's uids
    this.connectedSockets = {};
    this.playerRpcs = [];

    // A number that increments to create a new uid for an entity, to be able to tell them apart
    this.entitiesCount = 0;
    this.availableUids = [];

    // An object that contains parties as its values and the parties' id as its keys
    this.parties = {};

    // A number that increments to create a new party id, to be able to tell them apart
    this.partyIds = 0;
    // Object containing information for the day/night ticker
    this.cycleData = {
      isDay: false,
      cycleStartTick: 0,
      cycleEndTick: 0,
      nightLength: 45000,
      dayLength: 45000,
    };

    this.serverInfo = serverInfo;
    this.gameVersion = "1.2.2-tauri";
    this.gameMode = serverInfo.gameMode;

    this.debuggingInfo = {
      highestUid: 0,
      longestFrameTime: 0,
      population: 0,
    };

    // Mandatory physics engine initialisation
    RAPIER.init().then(async () => {
      // Initialise a websocket server on the port provided
      this.wsServer = new WebSocket.Server({ port: this.serverInfo.port });

      WebSocket.prototype.oldSend = WebSocket.prototype.send;

      WebSocket.prototype.send = function (data) {
        try {
          WebSocket.prototype.oldSend.apply(this, [data]);
        } catch (err) {
          this.debugLog("Error sending message with data:", data);
        }
      };

      /*
       *
       * Adding handlers for the server
       *
       */

      // The server has started listening
      this.wsServer.on("listening", () => {
        this.debugLog(
          `[INFO] Server has started listening on port ${this.serverInfo.port}. \nGame mode: ${this.gameMode}.`,
        );
      });

      // End this server thread when the server encounters an issue
      this.wsServer.on("error", (e) => {
        this.debugLog(
          `[ERROR] Server on port ${this.serverInfo.port} has encountered an issue and will exit.`,
        );
        process.exit();
      });

      this.connectAttempts = {};

      // Socket handler for server
      this.wsServer.on("connection", (socket, request) => {
        try {
          socket.on("error", (err) => {
            socket.close();
            return;
          });

          socket.binaryType = "arraybuffer";

          socket.sendMessage = (opcode, data) => {
            socket.send(Network.encode(opcode, data));
          };

          socket.on("message", (message) => {
            if (socket.readyState == 2 || socket.readyState == 3) return;
            try {
              Network.decode(socket, this, message);
            } catch (e) {
              this.debugLog(
                `[WARNING] ${socket.uid} had an issue with sending a message.\n${e.stack}`,
              );
            }
          });

          socket.on("close", () => {
            let name = "$$NO UID$$";
            if (socket.uid !== undefined) {
              delete this.connectedSockets[socket.uid];

              const playerEntity = this.entities[socket.uid];
              name = playerEntity.name;

              playerEntity.socketDestroyed = true;
              this.parties[playerEntity.partyId].removeMember(this, playerEntity);
            }

            const population = Object.keys(this.connectedSockets).length;

            this.debugLog(
              `[POPULATION-UPDATE] ${name} (${socket.ipAddress}) has left the server (server population: ${population}/${this.serverProperties.maxPlayerCount}).`,
            );

            this.debuggingInfo.population = population;
          });

          // If the socket doesn't have a uid, they aren't playing the game
          setTimeout(() => {
            if (socket.readyState == socket.OPEN && socket.uid == undefined) {
              socket.close();
              this.debugLog(
                `[INFO] (${socket.ipAddress}) has timed out of the enter world request.`,
              );
            }
          }, 15000);
        } catch (err) {
          this.debugLog(`[INFO] Error with socket:\n${err}`);
          socket.close();
        }
      });

      this.toggleDayNightCycle();
      this.sendPartyData();
      this.sendLeaderboard();

      // Initialise the physics world, gravity being disabled
      this.world = new RAPIER.World({ x: 0, y: 0 });

      // These are the collision groups:
      /*
        0: Resources
        1: Players, zombies, NPC's, etc.
        2: Buildings
        3: Projectiles

        0 can collide with 1 and 3
        1 can collide with 0, 1, 2 and 3
        2 can collide with 1 and 3
        3 can collide with 0, 1 and 2

        https://rapier.rs/docs/user_guides/javascript/colliders#collision-groups-and-solver-groups
      */

      // A number to convert between pixels and world. 48 pixels is the width of one world grid square
      this.world.PixelToWorld = 48;
      this.eventQueue = new RAPIER.EventQueue(true);

      // Definition to allow `this` usage within the object below
      const _this = this;

      this.physicsHooks = {
        filterContactPair(colliderHandle1, colliderHandle2) {
          const entity1 = _this.colliderHandleEntityMap[colliderHandle1];
          const entity2 = _this.colliderHandleEntityMap[colliderHandle2];

          if (entity1.model == "SpikeTrap" || entity2.model == "SpikeTrap")
            return RAPIER.SolverFlags.EMPTY;

          if (entity1.model == "Player" && entity1.canWalkThroughBuildings == true) {
            if (
              entity2.entityClass == "Building" &&
              entity2.partyId == entity1.partyId &&
              entity2.model !== "Factory"
            )
              return RAPIER.SolverFlags.EMPTY;
          } else if (
            entity2.model == "Player" &&
            entity2.canWalkThroughBuildings == true
          ) {
            if (
              entity1.entityClass == "Building" &&
              entity1.partyId == entity2.partyId &&
              entity1.model !== "Factory"
            )
              return RAPIER.SolverFlags.EMPTY;
          }

          if (
            ((entity1.model === "Player" && entity2.model === "Door") ||
              (entity1.model === "Door" && entity2.model === "Player")) &&
            entity1.partyId === entity2.partyId
          )
            return RAPIER.SolverFlags.EMPTY;

          return RAPIER.SolverFlags.COMPUTE_IMPULSE;
        },
      };

      // Creating world walls
      {
        const top = RAPIER.ColliderDesc.cuboid(
          this.serverProperties.mapSize.width / this.world.PixelToWorld,
          8,
        ).setTranslation(
          this.serverProperties.mapSize.width / this.world.PixelToWorld / 2,
          -8,
        );
        this.world.createCollider(top);

        const left = RAPIER.ColliderDesc.cuboid(
          8,
          this.serverProperties.mapSize.height / this.world.PixelToWorld,
        ).setTranslation(
          -8,
          this.serverProperties.mapSize.height / this.world.PixelToWorld / 2,
        );
        this.world.createCollider(left);

        const right = RAPIER.ColliderDesc.cuboid(
          8,
          this.serverProperties.mapSize.height / this.world.PixelToWorld,
        ).setTranslation(
          this.serverProperties.mapSize.width / this.world.PixelToWorld + 8,
          this.serverProperties.mapSize.height / this.world.PixelToWorld / 2,
        );
        this.world.createCollider(right);

        const bottom = RAPIER.ColliderDesc.cuboid(
          this.serverProperties.mapSize.width / this.world.PixelToWorld,
          8,
        ).setTranslation(
          this.serverProperties.mapSize.width / this.world.PixelToWorld / 2,
          this.serverProperties.mapSize.height / this.world.PixelToWorld + 8,
        );
        this.world.createCollider(bottom);
      }

      this.proxyDataHandler = {
        set(target, key, value) {
          if (
            target.uid > 0 &&
            _this.clearingProps == false &&
            key in Network.neededInfo
          ) {
            _this.changedEntityProperties[target.uid][key] = true;
            _this.entitiesWithChangedProps.add(target.uid);
          }

          target[key] = value;

          return true;
        },
      };

      // Pooling entities to save garbage collection time
      this.pooledEntities = {
        // Zombie: { countToPool: 5000 },
        // RocketProjectile: { countToPool: 500 },
        // CannonProjectile: { countToPool: 500 },
        // ArrowProjectile: { countToPool: 500 },
        // MageProjectile: { countToPool: 500 }
      };

      for (const model in this.pooledEntities) {
        this.pooledEntities[model].entities = deePool.create(() => {
          return this.createEntity(model, {}, true);
        });

        this.pooledEntities[model].entities.grow(this.pooledEntities[model].countToPool);
      }

      const generateWeightedPosition = () => {
        const x = Math.round(Math.random() * this.serverProperties.mapSize.width);
        const y = Math.round(Math.random() * this.serverProperties.mapSize.height);

        const centerX = this.serverProperties.mapSize.width / 2;
        const centerY = this.serverProperties.mapSize.height / 2;

        if (
          Math.abs(x - centerX) < this.serverProperties.mapSize.width / 8 &&
          Math.abs(y - centerY) < this.serverProperties.mapSize.height / 8
        ) {
          if (Math.random() < 0.1) return { x, y };
          return generateWeightedPosition();
        } else return { x, y };
      };
      // Create the resources
      for (let i = 0; i < this.serverProperties["treeCount"]; i++) {
        this.createEntity("Resource", {
          aimingYaw: (Math.random() * 360) | 0,
          model: `Tree${Math.random() > 0.5 ? "2" : "1"}`,
          position: generateWeightedPosition(),
        });
      }

      for (let i = 0; i < this.serverProperties["stoneCount"]; i++) {
        this.createEntity("Resource", {
          aimingYaw: (Math.random() * 360) | 0,
          model: `Stone${Math.random() > 0.5 ? "2" : "1"}`,
          position: generateWeightedPosition(),
        });
      }

      this.frameTimes = [];
      this.averageFrameTime = 0;
      this.lastLongTickSent = 0;
      this.lastTickRan = process.hrtime.bigint();
      this.tickEnded = process.hrtime.bigint();
      this.loggingTickDuration = false;

      this.runTicks();
    });
  }

  createEntity(model, props = {}, entityToBePooled = false) {
    if (Entities[model] === undefined)
      return this.debugLog(`[ERROR] Type ${model} cannot be found in known entities.`);

    // Ensure that the position does not exit the map boundaries
    if (props.position !== undefined) {
      props.position = {
        x: Math.round(
          Math.max(0, Math.min(this.serverProperties.mapSize.width, props.position.x)),
        ),
        y: Math.round(
          Math.max(0, Math.min(this.serverProperties.mapSize.height, props.position.y)),
        ),
      };
    }

    let entity;
    // If this entity is being appended to a pool
    if (entityToBePooled === true) {
      entity = new Proxy(new Entities[model](this, props), this.proxyDataHandler);
    } else if (entityToBePooled === false) {
      // If the entity has been pooled, use the pooled entity already created
      if (this.pooledEntities[model] !== undefined) {
        entity = this.pooledEntities[model].entities.use();

        Object.assign(entity, props);
      }
      // If not, create a new one
      else {
        entity = new Proxy(new Entities[model](this, props), this.proxyDataHandler);
      }

      // If the entity isn't being pooled, it should be added to the world immediately
      entity.addToWorld(this);

      this.colliderHandleEntityMap[entity.physicsObject.collider(0).handle] = entity;

      // Adding to this.changedEntityProperties is in Entity.js addToWorld

      this.entities[entity.uid] = entity;
    }

    return entity;
  }

  removeEntity(uid) {
    if (this.entities[uid] == undefined) return;

    let entity = this.entities[uid];

    // If the entity is a player, it should delete the cached entity update data
    delete this.cachedEntityUpdateData[uid];

    delete this.colliderHandleEntityMap[entity.physicsObject.collider(0).handle];

    // Remove the entity's physics body and its colliders
    this.world.removeRigidBody(entity.physicsObject);

    // Remove the entity from the server
    delete this.entities[uid];

    // If the entity is from a pool, recycle it
    if (this.pooledEntities[entity.model] !== undefined) {
      entity.uid = 0;
      delete entity.cachedPosition;
      entity.lastPosition.x = 0;
      entity.lastPosition.y = 0;
      entity.physicsObject = undefined;
      entity.dead = false;
      this.pooledEntities[entity.model].entities.recycle(entity);
    } else {
      // If it isn't from a pool, set it to null to help the garbage collector
      entity = null;
    }

    delete this.changedEntityProperties[uid];

    // Reuse uids to keep numbers low
    // The physics simulation will not allow uids to be reused immediately so we wait until the next tick update
    this.waitTicks(2, () => {
      this.availableUids.push(uid);
    });
  }

  createParty(leaderUid) {
    // Create a new party, directly creating the leader and passing through a new party id
    const newParty = new Party(this, leaderUid);
    this.parties[newParty.id] = newParty;
    return newParty;
  }

  sendPartyData() {
    for (let uid in this.connectedSockets) {
      this.connectedSockets[uid].sendMessage(PacketIds["PACKET_RPC"], {
        name: "UpdateParty",
        response: this.getPartyData(uid),
      });
    }
    this.waitTicks(1000 / this.serverProperties.tickRate, this.sendPartyData.bind(this));
  }

  getPartyData(uid) {
    const isDev = this.entities[uid].developerMode == true;
    let parties = [];
    for (let id in this.parties) {
      const party = this.parties[id];
      if (party.id === this.entities[uid].partyId || party.isOpen === true || isDev) {
        parties.push({
          isOpen: party.isOpen,
          partyName: party.name,
          partyId: party.id,
          memberCount: party.memberCount,
          memberLimit: party.memberLimit,
        });
      }
    }
    return parties;
  }

  sendLeaderboard() {
    // Global leaderboard
    let leaderboard = [];
    for (let uid in this.connectedSockets) {
      const playerEntity = this.entities[uid];
      if (playerEntity !== undefined && playerEntity.ghostMode !== true) {
        leaderboard.push({
          uid: parseInt(uid),
          name: playerEntity.name,
          score: playerEntity.score,
          wave: playerEntity.wave,
          rank: 0,
        });
      }
    }

    leaderboard.sort((a, b) => b.wave - a.wave);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.map((player, i) => (player.rank = i + 1));

    // Each player has a leaderboard customised for them to ensure they can always see their own score
    for (let uid in this.connectedSockets) {
      let tempLeaderboard = leaderboard;
      tempLeaderboard = tempLeaderboard.slice(0, 10);
      if (tempLeaderboard.find((e) => e.uid == uid) === undefined) {
        tempLeaderboard.push({
          uid: parseInt(uid),
          name: this.entities[uid].name,
          score: this.entities[uid].score,
          wave: this.entities[uid].wave,
          rank: leaderboard.indexOf(leaderboard.find((e) => e.uid == uid)) + 1,
        });
      }

      this.connectedSockets[uid].sendMessage(PacketIds["PACKET_RPC"], {
        name: "UpdateLeaderboard",
        response: tempLeaderboard,
      });
    }

    this.waitTicks(
      3000 / this.serverProperties.tickRate,
      this.sendLeaderboard.bind(this),
    );
  }

  toggleDayNightCycle() {
    this.cycleData.cycleStartTick = this.tick;
    this.cycleData.cycleEndTick =
      this.tick +
      this.cycleData[`${this.cycleData.isDay ? "day" : "night"}Length`] /
        this.serverProperties.tickRate;

    if (this.cycleData.isDay === true) {
      this.cycleData.isDay = false;

      // Loop through the parties in the server, and then call the startWave function on the primary building
      for (let party of Object.values(this.parties))
        this.entities[party.primaryBuilding]?.startWave(this);

      this.waitTicks(
        this.cycleData.nightLength / this.serverProperties.tickRate,
        this.toggleDayNightCycle.bind(this),
      );
    } else if (this.cycleData.isDay === false) {
      this.cycleData.isDay = true;

      // Loop through the parties in the server, and then call the endWave function on the primary building
      for (let party of Object.values(this.parties))
        this.entities[party.primaryBuilding]?.endWave(this);

      this.waitTicks(
        this.cycleData.dayLength / this.serverProperties.tickRate,
        this.toggleDayNightCycle.bind(this),
      );
    }
  }

  runTicks() {
    const now = process.hrtime.bigint();
    if ((now - this.lastTickRan) / 1000000n >= this.serverProperties.tickRate) {
      // console.log(`Running tick ${parseInt(now - this.lastTickRan) / 1e6}ms after the last one was run`);
      this.onTick();
      this.lastTickRan = now;
    }
    setImmediate(this.runTicks.bind(this));
  }

  onTick() {
    if (this.tick == 0)
      this.debugLog(
        `\n[INFO] Server has been initialised${this.serverInfo?.port ? ` on port ${this.serverInfo.port}` : ""}.\nGame mode: ${this.gameMode}.\n`,
      );
    // if (this.tickStarted) console.log(`Time since last tick started: ${parseInt(process.hrtime.bigint() - this.tickStarted) / 1e6}ms`)
    this.tick++;

    let tickDebugText = "";

    let tickStart = process.hrtime.bigint();
    let processTimeStart;
    this.tickStarted = tickStart;

    // Reset tentative building positions
    this.tentativeBuildingPositions = {};

    processTimeStart = process.hrtime.bigint();
    for (let uid in this.connectedSockets) {
      const socket = this.connectedSockets[uid];

      // If the player doesn't send a ping in enough time, kick them
      // if (this.tick - this.entities[uid].lastNetworkPing > 30000 / this.serverProperties.tickRate) {
      //     socket.close();
      //     continue;
      // }

      if (this.cachedEntityUpdateData[uid]) socket.send(this.cachedEntityUpdateData[uid]);
    }
    tickDebugText += `Sending entity updates: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    this.changedEntityProperties = {};
    for (let uid in this.entities) {
      this.changedEntityProperties[uid] = {};
    }
    this.entitiesWithChangedProps.clear();
    tickDebugText += `Clearing entity changed properties: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    this.world.step(this.eventQueue, this.physicsHooks);
    tickDebugText += `Stepping the physics world: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    try {
      this.eventQueue.drainCollisionEvents(
        (colliderHandle1, colliderHandle2, intersecting) => {
          const entity1 = this.colliderHandleEntityMap[colliderHandle1];
          const entity2 = this.colliderHandleEntityMap[colliderHandle2];
          if (intersecting === true) {
            entity1.onCollision?.(entity2, this);
            entity2.onCollision?.(entity1, this);
          }
        },
      );
    } catch (err) {
      console.error(err);
    }
    tickDebugText += `Draining intersection events: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    for (let i in this.tickCallbacks) {
      if (i <= this.tick) {
        for (const callback of this.tickCallbacks[i]) callback();
        delete this.tickCallbacks[i];
      }
    }
    tickDebugText += `Executing tick callbacks: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    this.world.forEachActiveRigidBody((body) => {
      const uid = body.userData.uid;

      this.entities[uid].lastPosition.x = this.entities[uid].cachedPosition.x;
      this.entities[uid].lastPosition.y = this.entities[uid].cachedPosition.y;

      this.changedEntityProperties[uid]["position"] = true;
      this.entitiesWithChangedProps.add(uid);

      this.entities[uid].cachedPosition = body.translation();
    });
    tickDebugText += `Marking active bodies' positions as changed: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();

    for (let i in this.entities) {
      this.entities[i].update?.(this);
      // tickDebugText += (`Updating entity type ${this.entities[i]?.model}: ${parseInt(process.hrtime.bigint() - tickStart) / 1e6}ms\n`);
    }

    tickDebugText += `Updating entities: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();

    for (let id in this.parties) {
      this.parties[id].findRandomPathIfNecessary(this);
    }

    tickDebugText += `Updating paths on inactive parties: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    // let processTimeStart = process.hrtime.bigint();
    // server.totalDebuggingTime += parseInt(process.hrtime.bigint() - processTimeStart) / 1e6;

    // this.totalDebuggingTime = 0;
    // console.log(`\nTime spent: ${this.totalDebuggingTime}ms`);

    processTimeStart = process.hrtime.bigint();
    for (let i = 0; i < this.playerRpcs.length; i += 3) {
      try {
        if (
          this.connectedSockets[this.playerRpcs[i + 1]] !== undefined &&
          this.connectedSockets[this.playerRpcs[i + 1]].readyState == 1
        )
          HandleRpc[this.playerRpcs[i]](
            this.connectedSockets[this.playerRpcs[i + 1]],
            this,
            this.playerRpcs[i + 2],
          );
      } catch (err) {
        this.debugLog(err);
        // console.log(err);
      }
    }
    this.playerRpcs = [];
    tickDebugText += `Processing player RPC inputs: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    for (let uidStr in this.connectedSockets) {
      let uid = parseInt(uidStr);
      // Clear message count limiter
      this.connectedSockets[uid].messageCount = 0;

      this.entities[uid].currentlyKnownEntityUids.length = 0;

      if (this.entities[uid].outOfSync == true) {
        this.entities[uid].previouslyKnownEntityUids.length = 0;
      }

      this.updateKnownEntities(uid);

      this.cachedEntityUpdateData[uid] = Network.encode(
        PacketIds["PACKET_ENTITY_UPDATE"],
        uid,
        this,
      );

      this.entities[uid].previouslyKnownEntityUids.length = 0;
      for (const uid2 of this.entities[uid].currentlyKnownEntityUids) {
        this.entities[uid].previouslyKnownEntityUids.push(parseInt(uid2));
      }
    }
    tickDebugText += `Calculating entity updates for next tick: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    this.clearingProps = true;
    for (let i = 0; i < this.propsToBeCleared.length; i += 2) {
      const entityUid = this.propsToBeCleared[i];
      const prop = this.propsToBeCleared[i + 1];

      if (this.entities[entityUid] !== undefined) {
        // This shouldn't be hard coded as an array but it's only used for hits and lastPlayerDamages
        // which are only arrays, so it should be ok.
        this.entities[entityUid][prop] = [];
      }
    }
    this.propsToBeCleared.length = 0;
    this.clearingProps = false;
    tickDebugText += `Clearing entity props: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    // Sort the re-usable uid array to return the lowest uid first
    this.availableUids.sort((a, b) => a - b);
    tickDebugText += `Recycling and sorting uids: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    processTimeStart = process.hrtime.bigint();
    global.gc(true);
    tickDebugText += `Collecting garbage: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms\n`;

    const frameTime = parseInt(process.hrtime.bigint() - tickStart) / 1e6;
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 1000 / this.serverProperties.tickRate)
      this.frameTimes.shift();

    let sum = 0;
    for (const frameTime of this.frameTimes) sum += frameTime;
    this.averageFrameTime = sum / this.frameTimes.length;

    this.debuggingInfo.longestFrameTime = Math.max(
      this.debuggingInfo.longestFrameTime,
      frameTime,
    );

    tickDebugText += `Finalised tick: ${parseInt(process.hrtime.bigint() - tickStart) / 1e6}ms`;

    // if (frameTime > this.serverProperties.tickRate && this.tick - this.lastLongTickSent > 5000 / this.serverProperties.tickRate) {
    //     sendDiscordWebhook(`Experiencing long tick with ${Object.keys(this.entities).length} entities in the world:\n${tickDebugText}`);
    //     this.lastLongTickSent = this.tick;
    // }
    // console.log(`Tick duration: ${frameTime}ms`);

    if (this.loggingTickDuration == true)
      this.debugLog(
        `\n\n\n[INFO] ${Object.keys(this.entities).length} entities in the world:\n${tickDebugText}`,
      );
    // console.log(`\n\n\n${Object.keys(this.entities).length} entities in the world:\n${tickDebugText}`);

    this.tickEnded = process.hrtime.bigint();

    // setTimeout(this.onTick.bind(this), Math.floor(this.serverProperties.tickRate - frameTime));
  }

  updateKnownEntities(playerUid) {
    // This has to scan for the entities that are within the vision range
    // If an entity is within the vision range, push the uid to an array that belongs to the player.
    // The network will loop through the known uids and directly encode to the ArrayBuffer any new data
    const playerEntity = this.entities[playerUid];

    playerEntity.brandNewEntityUids.length = 0;

    // if (playerEntity.developerMode == true) {
    //     for (let uidStr in this.entities) {
    //         const uid = parseInt(uidStr);

    //         if (!playerEntity.previouslyKnownEntityUids.includes(uid)) playerEntity.brandNewEntityUids.push(uid);
    //         playerEntity.currentlyKnownEntityUids.push(uid);

    //         if (this.entities[uid].model == "ResourcePickup") this.entities[uid].playersInRange.push(playerUid);
    //     }
    //     return;
    // }

    // Scan nearby area for entities within vision range
    const shapePos = playerEntity.getPosition(this);

    let sightRange = playerEntity.sightRange;

    if (playerEntity.developerMode == true) {
      sightRange = new RAPIER.Cuboid(
        ((playerEntity.zoomLevel || 1) * 1920) / this.world.PixelToWorld,
        ((playerEntity.zoomLevel || 1) * 1080) / this.world.PixelToWorld,
      );
    }

    this.world.intersectionsWithShape(shapePos, 0, sightRange, (collider) => {
      // The collider may not belong to an entity
      let uid = collider._parent?.userData?.uid;
      if (this.entities[uid] !== undefined) {
        if (this.entities[uid].ghostMode !== true && uid !== playerUid) {
          if (!playerEntity.previouslyKnownEntityUids.includes(uid))
            playerEntity.brandNewEntityUids.push(uid);
          playerEntity.currentlyKnownEntityUids.push(uid);

          if (
            this.entities[uid].model == "ResourcePickup" &&
            playerEntity.ghostMode !== true
          )
            this.entities[uid].playersInRange.push(playerUid);
        }
      }
    });

    // Ensure party members always appear on the map
    this.parties[playerEntity?.partyId]?.memberUids.forEach((memberUid) => {
      if (!playerEntity.currentlyKnownEntityUids.includes(memberUid)) {
        if (!playerEntity.previouslyKnownEntityUids.includes(memberUid))
          playerEntity.brandNewEntityUids.push(memberUid);
        playerEntity.currentlyKnownEntityUids.push(memberUid);
      }
    });

    playerEntity.currentlyKnownEntityUids.sort((a, b) => a - b);
  }

  waitTicks(ticks, callback) {
    this.tickCallbacks[this.tick + ticks] ||= [];
    this.tickCallbacks[this.tick + ticks].push(callback);
  }

  debugLog(log) {
    return new Promise((res, rej) => {
      const date = new Date();
      const debugText = `[${date.getUTCFullYear()}-${("0" + (date.getUTCMonth() + 1)).slice(-2)}-${("0" + date.getUTCDate()).slice(-2)} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}.${date.getUTCMilliseconds()}] ${log}\n`;

      /*
      fs.appendFile("./logs.txt", debugText, (err) => {
        res();
        if (err) return console.log(err);
      });
      */

      // console.log(debugText);
    });
  }
}

/*
const getCustomFlag = (flag) => {
  const customFlag = process.argv.find((arg) => arg.startsWith(`--${flag}=`));
  return customFlag ? customFlag.split("=")[1] : undefined;
};
*/

/*
let servers = [];
for (let i in ["standard", "scarcity"]) {
  servers[i] = new Server({
    port: 8000 + i,
    gameMode,
  });
}
*/

console.log(process.argv[2], process.argv[3]);
let server = new Server({
  port: parseInt(process.argv[2]),
  gameMode: process.argv[3],
});

/*
exec("cloud-init query region", (error, countryOut, stderr) => {
  if (error || stderr || countryOut.length == 0) countryOut = "Local";

  exec("cloud-init query local-hostname", (error, cityOut, stderr) => {
    // If an error has been returned then the server is not hosted on a vultr server.
    if (error || stderr || cityOut.length == 0) cityOut = "Local";
    else {
      cityOut = cityOut.split("--")[0].replaceAll("-", " ").trim();
    }

    countryOut = countryOut.replace("\n", "").trim();
    cityOut = cityOut.split("\n")[0].trim();

    switch (countryOut) {
      case "de":
        countryOut = "Germany";
        break;
      case "au":
        countryOut = "Australia";
        break;
      case "us":
        countryOut = "US";
        break;
      case "sg":
        countryOut = "Singapore";
        break;
      case "mx":
        countryOut = "Mexico";
        break;
      case "eu-central":
        countryOut = "Germany";
        cityOut = "Frankfurt";
        break;
      case "us-lax":
        countryOut = "US";
        cityOut = "Los Angeles";
        break;
    }

    let port = 80;
    if (cityOut == "Local") port = 8000;

    server = new Server({
      port: getCustomFlag("port") || 8000,
      gameMode: getCustomFlag("game-mode") || "standard",
    });
  });
});
*/

process.on("uncaughtException", async (err) => {
  const errorMessage = err.stack || err.toString();

  // for (let i in servers) {
  await server.debugLog(`[ERROR] Uncaught Exception: \n\`\`\`${errorMessage}\`\`\``);
  // }

  onShutdown();
});

const onShutdown = async () => {
  try {
    /*
    console.log("Shutdown detected. Cleaning up server before shutdown.");

    // Always send the leaderboard as soon as the server goes down to ensure no records are lost in vain
    console.log("Sending all bases to leaderboard database...");
    for (let id in server.parties) {
      await server.entities[
        server.parties[id].primaryBuilding
      ]?.sendLeaderboardToDatabase(server);
    }
    */

    await server.debugLog(
      `[VITAL-SIGNS] Game server has been shutdown.\nDebugging info:\n${JSON.stringify(server.debuggingInfo)}`,
    );
  } catch (err) {}

  process.exit(0);
};

process.on("SIGINT", onShutdown);
