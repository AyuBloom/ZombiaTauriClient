const PacketIds = require("./Network/PacketIds.json");
const BuildingInfo = require("./Info/BuildingInfo");
const pathfinding = require("./pathfinding/index.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const Util = require("./Util.js");

const {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} = require("obscenity");

const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

class Party {
  constructor(server, leaderEntity) {
    this.id = ++server.partyIds;
    this.members = {};
    this.memberUids = new Set();
    this.name = `Party-${this.id}`;
    this.isOpen = false;
    this.memberCount = 0;
    this.memberLimit = server.serverProperties.maxPlayerPartyLimit;
    this.leaderUid = null;
    this.key = "";

    // Resources are shared across a party in Scarcity mode
    this.resources = {
      gold: 0,
      stone: 0,
      wood: 0,
    };

    if (server.gameMode == "scarcity") {
      this.resetResourcesCount();
    }

    // Cache party members for the leaderboard, in case they disconnect
    this.partyMemberCache = {};

    this.spells = {
      Timeout: {
        cooldownActive: false,
        cooldownExpiringTick: 0,
        cooldownIconExpiringTick: 0,
      },
      Rapidfire: {
        cooldownActive: false,
        cooldownExpiringTick: 0,
        cooldownIconExpiringTick: 0,
      },
    };

    this.primaryBuilding = null;
    this.allBuildings = {
      buildings: {},
      types: {},
    };

    // Zombie spawn radial distribution
    this.radialDistribution = [];
    this.lastBuildingUpdate = 0;

    const buildingInfo = BuildingInfo.getBuilding(server, "*");
    for (let i in buildingInfo) {
      this.allBuildings.types[i] = {
        owned: [],
        limit: buildingInfo[i].limitPerMember,
        limitPerMember: buildingInfo[i].limitPerMember,
        limitStatic: buildingInfo[i].limitStatic,
      };
    }

    this.updatePartyKey(server);

    if (leaderEntity !== null) this.addMember(server, leaderEntity);

    this.pathVisualisers = [];
  }

  resetResourcesCount() {
    this.resources = {
      gold: 800000,
      stone: 50000,
      wood: 50000,
    };
  }

  updatePartyKey(server) {
    this.first = false;

    const key = this.generatePartyKey(server);

    this.key = key;

    this.memberUids.forEach((memberUid) => {
      server.connectedSockets[memberUid].sendMessage(PacketIds["PACKET_RPC"], {
        name: "PartyKey",
        response: {
          partyKey: this.key,
        },
      });
    });
  }

  generatePartyKey(server) {
    const keyLength = 20;
    let key = "";
    const availableCharacters = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";

    for (let i = 0; i < keyLength; i++) {
      key += availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
    }

    if (obscenityMatcher.hasMatch(key)) {
      return this.generatePartyKey(server);
    }

    // No two parties can have the same key (it's unbelievably unlikely but necessary)
    const partyFoundWithKey =
      Object.values(server.parties).find((e) => e.key === key) !== undefined;
    if (partyFoundWithKey == true) return this.generatePartyKey(server);

    return key;
  }

  addMember(server, playerEntity) {
    if (playerEntity.partyId === this.id) return true;
    if (this.memberCount >= this.memberLimit && !playerEntity.developerMode) return false;

    this.memberCount++;
    this.members[playerEntity.uid] = playerEntity;
    this.memberUids.add(playerEntity.uid);

    playerEntity.partyId = this.id;
    playerEntity.canSell = false;
    playerEntity.canPlace = true;

    if (server.gameMode == "scarcity") {
      playerEntity.wood = this.resources.wood;
      playerEntity.stone = this.resources.stone;
      playerEntity.gold = this.resources.gold;
    }

    server.connectedSockets[playerEntity.uid].sendMessage(PacketIds["PACKET_RPC"], {
      name: "PartyKey",
      response: {
        partyKey: this.key,
      },
    });

    let buildingsToSend = Object.values(this.allBuildings.buildings).map((building) => {
      return {
        dead: building.dead,
        tier: building.tier,
        type: building.model,
        uid: building.uid,
        x: building.getPosition(server).x * server.world.PixelToWorld,
        y: building.getPosition(server).y * server.world.PixelToWorld,
        yaw: building.yaw,
      };
    });

    if (buildingsToSend.length > 0) {
      server.connectedSockets[playerEntity.uid].sendMessage(PacketIds["PACKET_RPC"], {
        name: "PartyBuilding",
        response: buildingsToSend,
      });
    }

    this.update(server);
    this.sendMemberList(server);

    // If the player is joining a party with any active spells, let them know
    for (let name in this.spells) {
      if (this.spells[name].cooldownActive == false) continue;
      server.connectedSockets[playerEntity.uid].sendMessage(PacketIds["PACKET_RPC"], {
        name: "CastSpellResponse",
        response: {
          name: name,
          iconCooldown:
            (this.spells[name].cooldownIconExpiringTick - server.tick) *
            server.serverProperties.tickRate,
          cooldown:
            (this.spells[name].cooldownExpiringTick - server.tick) *
            server.serverProperties.tickRate,
        },
      });
    }
    return true;
  }

  removeMember(server, playerEntity) {
    if (playerEntity.partyId !== this.id) return true;

    if (server.connectedSockets[playerEntity.uid] !== undefined) {
      let buildingsToSend = [];
      for (let i in this.allBuildings.buildings) {
        const building = this.allBuildings.buildings[i];
        buildingsToSend.push({
          dead: true,
          tier: building.tier,
          type: building.model,
          uid: building.uid,
          x: building.getPosition(server).x * server.world.PixelToWorld,
          y: building.getPosition(server).y * server.world.PixelToWorld,
          yaw: building.yaw,
        });
      }

      if (buildingsToSend.length > 0) {
        server.connectedSockets[playerEntity.uid].sendMessage(PacketIds["PACKET_RPC"], {
          name: "PartyBuilding",
          response: buildingsToSend,
        });
      }

      // If any spell is active, tell the player it is no longer active as they are in a new party
      for (let name in this.spells) {
        if (this.spells[name].cooldownActive == false) continue;
        server.connectedSockets[playerEntity.uid].sendMessage(PacketIds["PACKET_RPC"], {
          name: "ClearActiveSpell",
          response: {
            name: name,
          },
        });
      }
    }

    this.memberCount--;
    delete this.members[playerEntity.uid];
    this.memberUids.delete(playerEntity.uid);
    playerEntity.partyId = 0;

    // If the player left the server, add them to the cache
    if (
      server.connectedSockets[playerEntity.uid] == undefined ||
      [2, 3].includes(server.connectedSockets[playerEntity.uid].readyState)
    ) {
      // Limit the number of players in the cache
      // Sort by the time added to the cache, delete the oldest
      if (Object.keys(this.partyMemberCache).length >= this.memberLimit) {
        const oldestMemberCached = Object.values(this.partyMemberCache).sort(
          (a, b) => a.timeAddedToCache - b.timeAddedToCache,
        )[0]?.uid;
        if (oldestMemberCached) delete this.partyMemberCache[oldestMemberCached];
      }

      const playerUid = playerEntity.uid;
      this.partyMemberCache[playerUid] = {
        uid: playerEntity.uid,
        score: playerEntity.score,
        wave: playerEntity.wave,
        name: playerEntity.name,
        ipAddress: playerEntity.ipAddress,
        wood: playerEntity.wood,
        stone: playerEntity.stone,
        gold: playerEntity.gold,
        tokens: playerEntity.tokens,
        timeAddedToCache: server.tick,
      };

      // Delete the player from the cache after a minute
      server.waitTicks(60000 / server.serverProperties.tickRate, () => {
        delete this.partyMemberCache[playerUid];
      });
    }

    this.update(server);
    this.sendMemberList(server);

    return true;
  }

  sendMemberList(server) {
    for (let uid in this.members) {
      const members = [];

      this.memberUids.forEach((memberUid) => {
        members.push({
          canPlace: this.members[memberUid].canPlace,
          canSell: this.members[memberUid].canSell,
          name: this.members[memberUid].name,
          uid: parseInt(memberUid),
          isLeader: memberUid == this.leaderUid,
        });
      });

      server.connectedSockets[uid].sendMessage(PacketIds["PACKET_RPC"], {
        name: "PartyMembersUpdated",
        response: members,
      });
    }
  }

  updateBuilding(server, buildings) {
    for (const building of buildings) {
      if (building.dead === true) {
        if (building.model === "Factory") this.primaryBuilding = null;
        delete this.allBuildings.buildings[building.uid];
        this.allBuildings.types[building.model].owned.splice(
          this.allBuildings.types[building.model].owned.indexOf(building.uid),
          1,
        );

        if (!["Factory"].includes(building.model))
          this.updateBuildingPathfinding(server, building);
      } else {
        if (this.primaryBuilding == null) {
          if (building.model == "Factory") {
            this.primaryBuilding = building.uid;
            this.initialisePathfinding(server, building);
          }
        }

        if (
          this.primaryBuilding !== null &&
          building.uid !== this.primaryBuilding &&
          this.allBuildings.buildings[building.uid] == undefined
        ) {
          this.updateBuildingPathfinding(server, building);
        }

        this.allBuildings.buildings[building.uid] = building;
        if (this.allBuildings.types[building.model].owned.indexOf(building.uid) < 0)
          this.allBuildings.types[building.model].owned.push(building.uid);
        building.partyId = this.id;
      }
    }

    let buildingsToSend = buildings.map((building) => {
      return {
        dead: building.dead,
        tier: building.tier,
        type: building.model,
        uid: building.uid,
        x: building.getPosition(server).x * server.world.PixelToWorld,
        y: building.getPosition(server).y * server.world.PixelToWorld,
        yaw: building.yaw,
      };
    });

    for (let i in this.members) {
      server.connectedSockets[i].sendMessage(PacketIds["PACKET_RPC"], {
        name: "PartyBuilding",
        response: buildingsToSend,
      });
    }

    this.updateBuildingDistribution(server);
  }

  clearCachedPaths(server) {
    let currentTick = server.tick;

    // Path will only be updated 3 seconds after the last building update
    server.waitTicks(3000 / server.serverProperties.tickRate, () => {
      if (
        currentTick - this.lastBuildingUpdate >=
        3000 / server.serverProperties.tickRate
      ) {
        this.cachedPaths = {};
        this.lastBuildingUpdate = currentTick;
      }
    });
  }

  updateBuildingPathfinding(server, building) {
    for (const visualiser of this.pathVisualisers) {
      server.removeEntity(visualiser.uid);
    }
    this.pathVisualisers = [];

    if (server.entities[this.primaryBuilding] == undefined) return;

    // Zombies should path through spike traps & Harvesters
    if (["Factory", "Harvester", "SpikeTrap"].includes(building.model)) return;

    // Clear the cached paths so that the zombies can navigate around the new building
    this.clearCachedPaths(server);

    let cells = new Set();

    let radius = building.radius / server.world.PixelToWorld;
    let width = building.width / server.world.PixelToWorld;
    let height = building.height / server.world.PixelToWorld;

    if (building.yaw == 90 || building.yaw == 270) {
      width = building.height / server.world.PixelToWorld;
      height = building.width / server.world.PixelToWorld;
    }

    const buildingPosition = building.getPosition(server);
    let topLeftCellX;
    let topLeftCellY;
    let bottomRightCellX;
    let bottomRightCellY;

    if (!isNaN(radius)) {
      topLeftCellX = Math.floor(buildingPosition.x - radius);
      topLeftCellY = Math.floor(buildingPosition.y - radius);
      bottomRightCellX = Math.ceil(buildingPosition.x + radius);
      bottomRightCellY = Math.ceil(buildingPosition.y + radius);

      for (let x = topLeftCellX; x <= bottomRightCellX; x++) {
        for (let y = topLeftCellY; y <= bottomRightCellY; y++) {
          const cell = this.pathfindingGrid.nodes[Math.floor(x)]?.[Math.floor(y)];
          if (cell == undefined) continue;

          const closestX = Math.max(cell.x, Math.min(resourcePosition.x, cell.x + 1));
          const closestY = Math.max(cell.y, Math.min(resourcePosition.y, cell.y + 1));

          const distance = Math.sqrt(
            (closestX - resourcePosition.x) ** 2 + (closestY - resourcePosition.y) ** 2,
          );

          // A set is used here to prevent weights being added to the same cell twice
          if (distance <= radius) cells.add({ x: cell.x, y: cell.y });
        }
      }
    } else if (!isNaN(width) && !isNaN(height)) {
      const left = buildingPosition.x - width / 2;
      const top = buildingPosition.y - height / 2;
      const right = buildingPosition.x + width / 2;
      const bottom = buildingPosition.y + height / 2;

      const startX = Math.floor(left);
      const startY = Math.floor(top);
      const endX = Math.ceil(right);
      const endY = Math.ceil(bottom);

      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          const cell = this.pathfindingGrid.nodes[Math.floor(x)]?.[Math.floor(y)];
          if (cell == undefined) continue;

          const xOverlap = Math.min(right, cell.x + 1) - Math.max(left, cell.x);
          const yOverlap = Math.min(bottom, cell.y + 1) - Math.max(top, cell.y);

          if (xOverlap > 0 && yOverlap > 0) cells.add({ x: cell.x, y: cell.y });
        }
      }
    }

    cells.forEach((cell) => {
      this.pathfindingGrid.setWalkableAt(cell.x, cell.y, !!building.dead);
    });

    this.checkPrimaryIsBlocked(server);
  }

  checkPrimaryIsBlocked(server) {
    // Check 4 points around the Factory to determine if the Factory is blocked or not
    // If the Factory is blocked, there's no need to waste performance on pathfinding

    const primaryBuilding = server.entities[this.primaryBuilding];
    const primaryPosition = {
      x: Math.floor(primaryBuilding.getPosition(server).x),
      y: Math.floor(primaryBuilding.getPosition(server).y),
    };
    const primaryBuildRange = server.serverProperties.maxFactoryBuildDistance;

    const leftNode =
      this.pathfindingGrid.nodes[primaryPosition.x - (primaryBuildRange + 1)]?.[
        primaryPosition.y
      ];
    if (leftNode !== undefined) {
      const pathToNode = pathfinding.AStarFinder(
        this,
        primaryPosition,
        { x: leftNode.x, y: leftNode.y },
        true,
      );
      if (pathToNode.length > 0) {
        this.primaryBuildingBlocked = false;
        return;
      }
    }

    const rightNode =
      this.pathfindingGrid.nodes[primaryPosition.x + (primaryBuildRange + 1)]?.[
        primaryPosition.y
      ];
    if (rightNode !== undefined) {
      const pathToNode = pathfinding.AStarFinder(
        this,
        primaryPosition,
        { x: rightNode.x, y: rightNode.y },
        true,
      );
      if (pathToNode.length > 0) {
        this.primaryBuildingBlocked = false;
        return;
      }
    }

    const topNode =
      this.pathfindingGrid.nodes[primaryPosition.x]?.[
        primaryPosition.y - (primaryBuildRange + 1)
      ];
    if (topNode !== undefined) {
      const pathToNode = pathfinding.AStarFinder(
        this,
        primaryPosition,
        { x: topNode.x, y: topNode.y },
        true,
      );
      if (pathToNode.length > 0) {
        this.primaryBuildingBlocked = false;
        return;
      }
    }

    const bottomNode =
      this.pathfindingGrid.nodes[primaryPosition.x]?.[
        primaryPosition.y + (primaryBuildRange + 1)
      ];
    if (bottomNode !== undefined) {
      const pathToNode = pathfinding.AStarFinder(
        this,
        primaryPosition,
        { x: bottomNode.x, y: bottomNode.y },
        true,
      );
      if (pathToNode.length > 0) {
        this.primaryBuildingBlocked = false;
        return;
      }
    }

    this.primaryBuildingBlocked = true;
  }

  updateBuildingDistribution(server) {
    // TODO: this should definitely be optimised
    // let timestamp = process.hrtime.bigint();
    // Zombie spawn radial distribution
    const numSectors = 360;
    const sectorWeights = new Array(numSectors).fill(0);
    const sectorAngle = (2 * Math.PI) / numSectors;

    // Iterate through buildings and assign them to sectors
    const primaryBuildingEntity = server.entities[this.primaryBuilding];

    let buildingCount = 0;
    for (const buildingUid in this.allBuildings.buildings) {
      const building = this.allBuildings.buildings[buildingUid];

      if (["Factory", "Harvester", "SpikeTrap"].includes(building.model)) continue;

      const angleToBuilding = Math.atan2(
        building.getPosition(server).y - primaryBuildingEntity.getPosition(server).y,
        building.getPosition(server).x - primaryBuildingEntity.getPosition(server).x,
      );
      const normalizedAngle =
        angleToBuilding >= 0 ? angleToBuilding : angleToBuilding + 2 * Math.PI;
      const sectorIndex = Math.floor(normalizedAngle / sectorAngle);
      sectorWeights[sectorIndex]++;

      buildingCount++;
    }

    if (buildingCount <= 0) buildingCount = 1;

    // Calculate distribution as percentages
    this.radialDistribution = sectorWeights.map((weight) => weight / buildingCount);
    // console.log(`Time taken to update building distribution: ${parseInt(process.hrtime.bigint() - timestamp) / 1e6}ms`);
  }

  update(server) {
    if (this.memberCount <= 0) {
      if (this.primaryBuilding !== null) {
        server.entities[this.primaryBuilding].die(server);
      }

      delete server.parties[this.id];
      return;
    }
    this.leaderUid = this.memberUids.keys().next().value;
    this.members[this.leaderUid].canSell = true;
    this.members[this.leaderUid].canPlace = true;

    for (let i in this.allBuildings.types) {
      const type = this.allBuildings.types[i];
      type.limit = type.limitPerMember * (type.limitStatic ? 1 : this.memberCount);
    }
  }

  initialisePathfinding(server, building) {
    const distanceFromPrimary = server.serverProperties.maxFactoryBuildDistance;

    this.cachedPaths = {};
    this.primaryBuildingBlocked = false;
    this.pathfindingGrid = new pathfinding.Grid(
      server,
      distanceFromPrimary * 3,
      distanceFromPrimary * 3,
      building.getPosition(server),
    );

    // Find resources within range and mark cells as occupied
    const shape = new RAPIER.Cuboid(
      this.pathfindingGrid.width / 2,
      this.pathfindingGrid.height / 2,
    );
    const shapePos = new RAPIER.Vector2(
      building.getPosition(server).x,
      building.getPosition(server).y,
    );
    let cells = new Set();
    server.world.intersectionsWithShape(
      shapePos,
      0,
      shape,
      (collider) => {
        const entity = server.entities[collider._parent?.userData?.uid];
        if (entity !== undefined && entity.entityClass == "Resource") {
          const radius = entity.radius / server.world.PixelToWorld;
          const resourcePosition = entity.getPosition(server);
          const topLeftCellX = Math.floor(resourcePosition.x - radius);
          const topLeftCellY = Math.floor(resourcePosition.y - radius);
          const bottomRightCellX = Math.ceil(resourcePosition.x + radius);
          const bottomRightCellY = Math.ceil(resourcePosition.y + radius);

          for (let x = topLeftCellX; x <= bottomRightCellX; x++) {
            for (let y = topLeftCellY; y <= bottomRightCellY; y++) {
              const cell = this.pathfindingGrid.nodes[Math.floor(x)]?.[Math.floor(y)];
              if (cell == undefined) continue;

              const closestX = Math.max(cell.x, Math.min(resourcePosition.x, cell.x + 1));
              const closestY = Math.max(cell.y, Math.min(resourcePosition.y, cell.y + 1));

              const distance = Math.sqrt(
                (closestX - resourcePosition.x) ** 2 +
                  (closestY - resourcePosition.y) ** 2,
              );

              // A set is used here to prevent weights being added to the same cell twice
              if (distance <= radius) cells.add({ x: cell.x, y: cell.y });
            }
          }
        }
      },
      undefined,
      0x00080007,
    );

    cells.forEach((cell) => {
      // Resources can't be walked through
      this.pathfindingGrid.setWalkableAt(cell.x, cell.y, false);
    });
  }

  findPath(startingPosition2, targetPosition, server) {
    this.lastPathSearchedTick = server.tick;

    let startingPosition = {
      x: Math.floor(startingPosition2.x),
      y: Math.floor(startingPosition2.y),
    };

    if (this.cachedPaths[startingPosition.x]?.[startingPosition.y] !== undefined) {
      return this.cachedPaths[startingPosition.x][startingPosition.y];
    }

    if (
      Math.abs(startingPosition.x - targetPosition.x) > 24 ||
      Math.abs(startingPosition.y - targetPosition.y) > 24 ||
      this.primaryBuildingBlocked == true
    ) {
      this.cachedPaths[startingPosition.x] ||= {};
      this.cachedPaths[startingPosition.x][startingPosition.y] = [
        targetPosition.x,
        targetPosition.y,
      ];
      return this.cachedPaths[startingPosition.x][startingPosition.y];
    }

    let path = pathfinding.AStarFinder(this, startingPosition, targetPosition);

    if (path.length > 0) path = pathfinding.Util.smoothenPath(this.pathfindingGrid, path);

    // If the length is 0, a path wasn't found, so we return the target position
    // If the path length is 4, then the path only contains the starting and target positions, so we return the target position
    if (path.length <= 4) {
      this.cachedPaths[startingPosition.x] ||= {};
      this.cachedPaths[startingPosition.x][startingPosition.y] = [
        targetPosition.x,
        targetPosition.y,
      ];

      // const visualiser = server.createEntity("Visualiser", {
      //     position: { x: startingPosition.x * 48, y: startingPosition.y * 48 },
      //     yaw: Util.angleTo(startingPosition, targetPosition)
      // })

      // this.pathVisualisers.push(visualiser);

      return this.cachedPaths[startingPosition.x][startingPosition.y];
    }

    /* If the path length is greater than 4, we want to go through each pair
     * and set their cached value to the next pair.
     * Ex: [1, 2, 3, 4, 5, 6, 7, 8]
     * Gets split into ([1, 2] -> [3, 4]), ([3, 4] -> [5, 6]), ([5, 6] -> [7, 8])
     */
    for (let i = 0; i < path.length - 2; i += 2) {
      this.cachedPaths[path[i]] ||= {};
      if (this.cachedPaths[path[i]][path[i + 1]] !== undefined) continue;

      this.cachedPaths[path[i]][path[i + 1]] = [path[i + 2], path[i + 3]];

      // const visualiser = server.createEntity("Visualiser", {
      //     position: { x: path[i] * 48, y: path[i + 1] * 48},
      //     yaw: Util.angleTo({ x: path[i], y: path[i + 1]}, { x: path[i + 2], y: path[i + 3]})
      // })

      // this.pathVisualisers.push(visualiser);
    }

    // this.cachedPaths[path[0]] ||= {};
    // this.cachedPaths[path[0]][path[1]] = [path[2], path[3]];

    // console.log(JSON.stringify(this.cachedPaths));

    return this.cachedPaths[path[0]][path[1]];
  }

  findRandomPathIfNecessary(server) {
    if (this.lastPathSearchedTick == server.tick || this.primaryBuilding == null) return;

    // console.log(`no path found in tick ${server.tick}!`);
  }
}

module.exports = Party;
