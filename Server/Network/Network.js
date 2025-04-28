const lodash = require("lodash");

const ByteBuffer = require("bytebuffer");

const Util = require("../Util.js");
const PacketIds = require("./PacketIds.json");
const HandleRpc = require("./HandleRpc.js");

const ToolInfo = require("../Info/ToolInfo.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const SpellInfo = require("../Info/SpellInfo.js");
const EntityInfo = require("../Info/EntityInfo.js");
const WaveData = require("../Info/WaveData.json");
const modelProps = require("./modelProps.js");
const { model } = require("mongoose");

const pooledByteBufferCount = 1;

const byteBufferPool = {};
const unusedByteBuffers = [];

for (let i = 0; i < pooledByteBufferCount; i++) {
  byteBufferPool[i] = new ByteBuffer(100, true);
  unusedByteBuffers.push(i);
}

const grabPooledByteBuffer = () => {
  const id = unusedByteBuffers.shift();
  return { id, buffer: byteBufferPool[id] };
};

const returnPooledByteBuffer = (id) => {
  unusedByteBuffers.push(id);
  const byteBuffer = byteBufferPool[id];
  byteBuffer.fill(0);
  byteBuffer.compact();
  byteBuffer.offset = 0;
  byteBuffer.limit = 100;
};

class Network {
  static neededInfo = {
    aimingYaw: "Uint16",
    aggroEnabled: "Boolean",
    currentHarvestStage: "Uint8",
    dead: "Boolean",
    droneCount: "Uint8",
    entityClass: "String",
    experience: "Uint16",
    firingTick: "Uint32",
    hatName: "String",
    health: "Uint16",
    hits: "ArrayUint32",
    targetBeams: "ArrayUint32",
    lastPlayerDamages: "ArrayUint32",
    lastPetDamage: "Uint16",
    lastPetDamageTarget: "Uint16",
    lastPetDamageTick: "Uint32",
    lastDamagedTick: "Uint32",
    maxHealth: "Uint16",
    gold: "Uint32",
    model: "String",
    name: "String",
    partyId: "Uint32",
    petUid: "Uint64",
    position: "Vector2",
    shortPosition: "Uint16",
    spellType: "String",
    radius: "Uint16",
    resourceAmount: "Uint8",
    resourcePickupType: "Uint8",
    resourceType: "String",
    score: "Uint32",
    stone: "Uint32",
    targetResourceUid: "Uint16",
    tier: "Uint16",
    tokens: "Uint32",
    warmingUp: "Boolean",
    wave: "Uint32",
    weaponName: "String",
    weaponTier: "Uint16",
    wood: "Uint32",
    yaw: "Varint32",
    zombieShieldHealth: "Float",
    zombieShieldMaxHealth: "Float",
    colour: "ZombieColour",
    scale: "Uint8",
    invulnerable: "Boolean",
  };

  static neededInfoObj = {
    aimingYaw: 0,
    aggroEnabled: 1,
    currentHarvestStage: 2,
    dead: 3,
    droneCount: 4,
    entityClass: 5,
    experience: 6,
    firingTick: 7,
    hatName: 8,
    health: 9,
    hits: 10,
    targetBeams: 11,
    lastPlayerDamages: 12,
    lastPetDamage: 13,
    lastPetDamageTarget: 14,
    lastPetDamageTick: 15,
    lastDamagedTick: 16,
    maxHealth: 17,
    gold: 18,
    model: 19,
    name: 20,
    partyId: 21,
    petUid: 22,
    position: 23,
    shortPosition: 24,
    spellType: 25,
    radius: 26,
    resourceAmount: 27,
    resourcePickupType: 28,
    resourceType: 29,
    score: 30,
    stone: 31,
    targetResourceUid: 32,
    tier: 33,
    tokens: 34,
    warmingUp: 35,
    wave: 36,
    weaponName: 37,
    weaponTier: 38,
    wood: 39,
    yaw: 40,
    zombieShieldHealth: 41,
    zombieShieldMaxHealth: 42,
    colour: 43,
    scale: 44,
    invulnerable: 45,
  };

  static neededInfoArray = Object.keys(Network.neededInfo);

  // isArray means that the data is an array, and each value holds the other pieces of data
  static serverRpcIndexMap = {
    PartyKey: {
      partyKey: "String",
    },
    PartyBuilding: {
      isArray: true,
      dead: "Boolean",
      tier: "Uint16",
      type: "String",
      uid: "Uint32",
      x: "Uint32",
      y: "Uint32",
      yaw: "Uint16",
    },
    PartyRequest: {
      name: "String",
      uid: "Uint32",
    },
    PartyRequestCancelled: {
      uid: "Uint32",
    },
    PartyRequestMet: {},
    PartyMembersUpdated: {
      isArray: true,
      canPlace: "Boolean",
      canSell: "Boolean",
      name: "String",
      uid: "Uint32",
      isLeader: "Boolean",
    },
    UpdateParty: {
      isArray: true,
      isOpen: "Boolean",
      partyId: "Uint32",
      partyName: "String",
      memberCount: "Uint8",
      memberLimit: "Uint8",
    },
    UpdateLeaderboard: {
      isArray: true,
      uid: "Uint32",
      name: "String",
      score: "Uint64",
      wave: "Uint64",
      rank: "Uint8",
    },
    UpdateDayNightCycle: {
      nightLength: "Uint32",
      dayLength: "Uint32",
    },
    Respawned: {},
    SetTool: {
      isArray: true,
      toolName: "String",
      toolTier: "Uint8",
    },
    Dead: {
      reason: "String",
      wave: "Uint64",
      score: "Uint64",
      partyScore: "Uint64",
    },
    ToolInfo: {
      json: "String",
    },
    BuildingInfo: {
      json: "String",
    },
    SpellInfo: {
      json: "String",
    },
    CastSpellResponse: {
      name: "String",
      cooldown: "Uint32",
      iconCooldown: "Uint32",
    },
    ClearActiveSpell: {
      name: "String",
    },
    EntityData: {
      json: "String",
    },
    ModelProps: {
      json: "String",
    },
    Failure: {
      failure: "String",
    },
    ReceiveChatMessage: {
      channel: "String",
      name: "String",
      message: "String",
    },
  };

  static clientRpcIndexMap = {
    OutOfSync: {},
    RandomisePartyKey: {},
    CancelPartyRequest: {},
    TogglePartyVisibility: {},
    Respawn: {},
    TogglePrimaryAggro: {},
    LeaveParty: {},
    UpgradeBuilding: {
      uids: "ArrayUint32",
    },
    SellBuilding: {
      uids: "ArrayUint32",
    },
    UpdateHarvesterTarget: {
      harvesterUid: "Uint16",
      targetUid: "Uint16",
    },
    BuyHarvesterDrone: {
      harvesterUid: "Uint16",
    },
    SendChatMessage: {
      message: "String",
      channel: "String",
    },
    SetPartyName: {
      partyName: "String",
    },
    JoinParty: {
      partyId: "Uint32",
    },
    KickMember: {
      uid: "Uint32",
    },
    TogglePartyPermission: {
      permission: "String",
      uid: "Uint32",
    },
    PartyRequest: {
      name: "String",
      uid: "Uint32",
    },
    PartyRequestResponse: {
      accepted: "Boolean",
      uid: "Uint32",
    },
    PlaceBuilding: {
      x: "Uint16",
      y: "Uint16",
      type: "String",
      yaw: "Uint16",
    },
    BuyTool: {
      toolName: "String",
    },
    EquipTool: {
      toolName: "String",
    },
    CastSpell: {
      spellName: "String",
      x: "Uint32",
      y: "Uint32",
    },
    Admin: {
      password: "String",
    },
    AdminCommand: {
      type: "String",
      uid: "Uint32",
      reason: "String",
      x: "Uint32",
      y: "Uint32",
    },
  };

  static inputPacketTemplate = {
    x: "Uint16",
    y: "Uint16",
    mouseMoved: "Uint16",
    mouseDown: "Boolean",
    space: "Boolean",
    up: "Boolean",
    down: "Boolean",
    left: "Boolean",
    right: "Boolean",
  };

  static decode(socket, server, data) {
    // if (!lodash.isArrayBuffer(data)) return socket.close();

    const buffer = ByteBuffer.wrap(data);
    data = null;

    buffer.littleEndian = true;
    const opcode = buffer.readUint8();

    // If a socket without a player tries to send a message that isn't the enter world message, close the socket
    if (socket.uid == undefined && opcode !== PacketIds["PACKET_ENTER_WORLD"])
      return socket.close();

    let decoded = { opcode };

    switch (opcode) {
      case PacketIds["PACKET_ENTER_WORLD"]:
        decoded = Network.decodeEnterWorld(buffer);
        Network.handleEnterWorld(socket, server, decoded);
        break;
      case PacketIds["PACKET_INPUT"]:
        decoded = Network.decodeInput(buffer);
        Network.handleInput(socket, server, decoded);
        break;
      case PacketIds["PACKET_RPC"]:
        decoded = Network.decodeRpc(buffer);
        Network.handleRpc(socket, server, decoded);
        break;
      case PacketIds["PACKET_PING"]:
        decoded = Network.decodePing(buffer);
        Network.handlePing(socket, server, decoded);
        break;
    }
  }

  static decodeEnterWorld(buffer) {
    return {
      name: buffer.readVString(),
      partyKey: buffer.readVString(),
    };
  }

  static decodeInput(buffer) {
    const inputResult = {};
    const inputCount = buffer.readUint8();

    for (let i = 0; i < inputCount; i++) {
      const inputType = Object.keys(Network.inputPacketTemplate)[buffer.readUint8()];
      let res;
      switch (Network.inputPacketTemplate[inputType]) {
        case "Uint16":
          res = buffer.readUint16();
          break;
        case "Boolean":
          res = !!buffer.readUint8();
          break;
      }

      inputResult[inputType] = res;
    }

    return inputResult;
  }

  static decodeRpc(buffer) {
    const rpcName = Object.keys(Network.clientRpcIndexMap)[buffer.readUint8()];
    const rpc = Network.clientRpcIndexMap[rpcName];

    const rpcResult = {
      response: {
        name: rpcName,
      },
    };

    for (let prop in rpc) {
      const rpcValueType = rpc[prop];
      let res;

      switch (rpcValueType) {
        case "Uint32":
          res = buffer.readUint32();
          break;
        case "Int32":
          res = buffer.readInt32();
          break;
        case "Float":
          res = buffer.readFloat();
          break;
        case "String":
          res = buffer.readVString();
          break;
        case "Vector2":
          res = {
            x: buffer.readInt32() * 100,
            y: buffer.readInt32() * 100,
          };
          break;
        case "ArrayVector2":
          {
            const length = buffer.readInt32();
            res = [];
            for (let i = 0; i < length; i++) {
              res.push(buffer.readInt32() * 100);
            }
          }
          break;
        case "ArrayUint32":
          {
            const length = buffer.readInt32();
            res = [];
            for (let i = 0; i < length; i++) {
              res.push(buffer.readInt32());
            }
          }
          break;
        case "Uint16":
          res = buffer.readUint16();
          break;
        case "Uint8":
          res = buffer.readUint8();
          break;
        case "Int16":
          res = buffer.readInt16();
          break;
        case "Int8":
          res = buffer.readInt8();
          break;
        case "Uint64":
          res = buffer.readUint64();
          break;
        case "Int64":
          res = buffer.readInt64();
          break;
        case "Double":
          res = buffer.readDouble();
          break;
        case "Boolean":
          res = !!buffer.readUint8();
          break;
        default:
          console.log(`Unsupported attribute type: ${attributeType}`);
      }

      rpcResult.response[prop] = res;
    }

    return rpcResult;
  }

  static decodePing(buffer) {
    return {};
  }

  static encode(opcode, data, server) {
    const pooledBuffer = grabPooledByteBuffer();
    const buffer = pooledBuffer.buffer;

    buffer.writeUint8(opcode);
    switch (opcode) {
      case PacketIds["PACKET_ENTER_WORLD"]:
        Network.encodeEnterWorld(buffer, data);
        break;
      case PacketIds["PACKET_ENTITY_UPDATE"]:
        Network.encodeEntityUpdate(buffer, data, server);
        break;
      case PacketIds["PACKET_RPC"]:
        Network.encodeRpc(buffer, data);
        break;
      case PacketIds["PACKET_PING"]:
        Network.encodePing(buffer, data);
        break;
    }
    buffer.flip();
    buffer.compact();
    const bufferToSend = buffer.toArrayBuffer(false);
    returnPooledByteBuffer(pooledBuffer.id);
    return bufferToSend;
  }

  static encodeEnterWorld(buffer, data) {
    buffer.writeUint8(+data.allowed);
    if (data.allowed == true) {
      buffer.writeVString(data.name);
      buffer.writeUint16(data.uid);
      buffer.writeUint16(data.tickRate);
      buffer.writeUint32(data.tick);
      buffer.writeUint16(data.x);
      buffer.writeUint16(data.y);
      buffer.writeUint8(data.minimumBuildDistanceFromWall);
      buffer.writeUint8(data.maxFactoryBuildDistance);
      buffer.writeUint8(data.maxPlayerBuildDistance);
      buffer.writeUint8(data.maxPlayerPartyLimit);
    } else {
      buffer.writeVString(data.reason);
    }
  }

  static encodeEntityUpdate(buffer, playerUid, server) {
    // TODO: nearly there
    const playerEntity = server.entities[playerUid];

    // let processTimeStart = process.hrtime.bigint();
    // console.log(`\nTime spent: ${parseInt(process.hrtime.bigint() - processTimeStart) / 1e6}ms`);

    const currentTickKnownUids = playerEntity.currentlyKnownEntityUids;
    const lastTickKnownUids = playerEntity.previouslyKnownEntityUids;
    const brandNewUids = playerEntity.brandNewEntityUids;

    buffer.writeUint8(playerEntity.outOfSync ? 1 : 0);

    if (playerEntity.outOfSync == true) {
      buffer.writeUint32(server.tick);
      playerEntity.outOfSync = false;
    }

    const removedEntities = [];

    for (const uidStr of lastTickKnownUids) {
      const uid = parseInt(uidStr);

      if (!currentTickKnownUids.includes(uid)) removedEntities.push(uid);
    }

    buffer.writeVarint32(removedEntities.length);

    for (const uidStr of removedEntities) {
      const uid = parseInt(uidStr);

      buffer.writeUint16(uid);
    }

    buffer.writeVarint32(brandNewUids.length);

    let byteArr = [];
    let dataUpdateFlag = 0;
    let oldUids = [];
    let idx = 0;

    for (let i = 0; i < currentTickKnownUids.length; i++) {
      const knownEntityUid = currentTickKnownUids[i];

      if (brandNewUids.includes(knownEntityUid)) {
        const entity = server.entities[knownEntityUid];
        buffer.writeUint16(knownEntityUid);

        // Write the number of properties the entity has
        // If the number of changed props is the same as the number of possible props,
        // the client will read each value as the next possible prop:
        // ["model", "ArrowTower", "uid", "5", "entityClass", "Building"] --> ["ArrowTower", "5", "Building"]

        const modelProp = modelProps[entity.model];

        buffer.writeUint8(modelProp.index);

        if (knownEntityUid == playerUid) {
          // Special case for player to hide private info from other players (including resources)
          for (const prop of modelProp.privateProps) {
            Network.encodeEntityAttributes(playerUid, buffer, prop, entity, server);
          }
        } else {
          for (const prop of modelProp.props || modelProp.publicProps) {
            Network.encodeEntityAttributes(playerUid, buffer, prop, entity, server);
          }
        }

        if (i == currentTickKnownUids.length - 1) {
          byteArr.push(dataUpdateFlag);
          break;
        } else {
          continue;
        }
      }

      oldUids.push(knownEntityUid);

      if (server.entitiesWithChangedProps.has(knownEntityUid)) {
        dataUpdateFlag = dataUpdateFlag & ~(1 << idx);
      } else {
        dataUpdateFlag = dataUpdateFlag | (1 << idx);
      }

      if (idx >= 7 || i == currentTickKnownUids.length - 1) {
        byteArr.push(dataUpdateFlag);
        idx = 0;
        dataUpdateFlag = 0;
      } else {
        idx++;
      }
    }

    if (byteArr.length <= 0) byteArr.push(dataUpdateFlag);

    buffer.writeVarint32(byteArr.length);

    for (const byte of byteArr) {
      buffer.writeUint8(byte);
    }

    for (const oldUid of oldUids) {
      if (server.entitiesWithChangedProps.has(oldUid) == false) continue;
      const entity = server.entities[oldUid];

      let propsToSend;

      if (entity.model == "Player") {
        propsToSend = [];

        for (let prop in server.changedEntityProperties[oldUid]) {
          if (
            entity.uid !== playerEntity.uid &&
            !modelProps["Player"].publicProps.includes(prop)
          )
            continue;

          propsToSend.push(prop);
        }
      } else {
        propsToSend = Object.keys(server.changedEntityProperties[oldUid]);
      }

      buffer.writeUint8(propsToSend.length);

      for (const prop of propsToSend) {
        Network.encodeEntityAttributes(playerUid, buffer, prop, entity, server, true);
      }
    }

    buffer.writeUint16(Math.min(65535, Math.floor(server.averageFrameTime * 100)));
  }

  static combineSignedNumbersToUint16(signedNumber1, signedNumber2) {
    const unsignedNumber1 = signedNumber1 + 128;
    const unsignedNumber2 = signedNumber2 + 128;

    return (unsignedNumber1 << 8) | unsignedNumber2;
  }

  static encodeEntityAttributes(
    playerUid,
    buffer,
    prop,
    entity,
    server,
    needToEncodeAttributePosition = false,
  ) {
    let attributeValue;

    if (prop == "position") {
      const pos = entity.getPosition(server);
      const currentPosition = { x: Math.round(pos.x * 48), y: Math.round(pos.y * 48) };

      if (server.entities[playerUid].previouslyKnownEntityUids.includes(entity.uid)) {
        const lastPosition = {
          x: Math.round(entity.lastPosition.x * 48),
          y: Math.round(entity.lastPosition.y * 48),
        };

        // If the position distance is less than the max value of 8 signed bits, combine the position into a single uint16
        const xDiff = currentPosition.x - lastPosition.x;
        const yDiff = currentPosition.y - lastPosition.y;

        if (xDiff > 127 || xDiff < -128 || yDiff > 127 || yDiff < -128) {
          attributeValue = currentPosition;
        } else {
          prop = "shortPosition";

          attributeValue = Network.combineSignedNumbersToUint16(xDiff, yDiff);
        }
      } else {
        attributeValue = currentPosition;
      }
    } else if (prop == "lastPlayerDamages" || prop == "hits") {
      // Clear these arrays every tick - they're only needed once
      attributeValue = Object.assign([], entity[prop]);

      server.propsToBeCleared.push(entity.uid, prop);
    } else {
      attributeValue = entity[prop];
    }

    if (needToEncodeAttributePosition == true)
      buffer.writeUint8(Network.neededInfoObj[prop]);

    let attributeType = Network.neededInfo[prop];

    try {
      switch (attributeType) {
        case "Boolean":
          buffer.writeUint8(+attributeValue);
          break;
        case "Uint32":
          buffer.writeUint32(Math.floor(attributeValue));
          break;
        case "Int32":
          buffer.writeInt32(attributeValue);
          break;
        case "Float":
          buffer.writeFloat(attributeValue);
          break;
        case "String":
          buffer.writeVString(attributeValue);
          break;
        case "ZombieColour":
          // a special case to convert the colour of a zombie into a colour to decrease the size of the entity update byte size
          buffer.writeUint8(Object.keys(WaveData).indexOf(attributeValue));
          break;
        case "Vector2":
          buffer.writeUint16(Math.floor(attributeValue.x));
          buffer.writeUint16(Math.floor(attributeValue.y));
          break;
        case "ArrayVector2":
          buffer.writeInt32(attributeValue.length);
          for (let i = 0; i < attributeValue.length; i++) {
            buffer.writeInt32(attributeValue[i].x * 100);
            buffer.writeInt32(attributeValue[i].y * 100);
          }
          break;
        case "ArrayUint32":
          buffer.writeUint16(attributeValue.length);
          for (let i = 0; i < attributeValue.length; i++) {
            buffer.writeUint32(parseInt(attributeValue[i]));
          }
          break;
        case "Uint16":
          buffer.writeUint16(Math.floor(attributeValue));
          break;
        case "Uint8":
          buffer.writeUint8(attributeValue);
          break;
        case "Int16":
          buffer.writeInt16(attributeValue);
          break;
        case "Int8":
          buffer.writeInt8(attributeValue);
          break;
        case "Uint64":
          buffer.writeUint64(attributeValue);
          break;
        case "Int64":
          buffer.writeInt64(attributeValue);
          break;
        case "Double":
          buffer.writeDouble(attributeValue);
          break;
        case "Varint32":
          buffer.writeVarint32(Math.floor(attributeValue));
          break;
        default:
          console.log(`Unsupported attribute type: ${attributeType}`);
          break;
      }
    } catch (err) {
      console.log(prop);
      console.log(entity);
      console.trace();
      throw new Error(err);
    }

    attributeValue = null;
  }

  static encodePing(buffer, data) {}

  static encodeRpc(buffer, data) {
    const rpc = Network.serverRpcIndexMap[data.name];

    buffer.writeUint8(Object.keys(Network.serverRpcIndexMap).indexOf(data.name));

    if (rpc.isArray === true) {
      try {
        buffer.writeUint16(data.response.length);
        for (let arrayEntry of data.response) {
          for (let prop in rpc) {
            if (prop == "isArray") continue;

            const rpcType = rpc[prop];
            const rpcValue = arrayEntry[prop];

            switch (rpcType) {
              case "Uint8":
                buffer.writeUint8(rpcValue);
                break;
              case "Uint16":
                buffer.writeUint16(rpcValue);
                break;
              case "Uint32":
                buffer.writeUint32(rpcValue);
                break;
              case "Uint64":
                buffer.writeUint64(rpcValue);
                break;
              case "String":
                buffer.writeVString(rpcValue);
                break;
              case "Boolean":
                buffer.writeUint8(+rpcValue);
                break;
              default:
                console.log(`Unknown RPC type: ${JSON.stringify(rpc)} ${rpcType}`);
                break;
            }
          }
        }
      } catch (e) {
        console.log(data);
      }
    } else {
      for (let prop in rpc) {
        if (prop == "isArray") continue;

        const rpcType = rpc[prop];
        const rpcValue = data.response[prop];

        switch (rpcType) {
          case "Uint8":
            buffer.writeUint8(rpcValue);
            break;
          case "Uint16":
            buffer.writeUint16(rpcValue);
            break;
          case "Uint32":
            buffer.writeUint32(rpcValue);
            break;
          case "Uint64":
            buffer.writeUint64(rpcValue);
            break;
          case "String":
            buffer.writeVString(rpcValue);
            break;
          case "Boolean":
            buffer.writeUint8(+rpcValue);
            break;
          default:
            console.log(`Unknown RPC type: ${JSON.stringify(rpc)} ${rpcType}`);
            break;
        }
      }
    }
  }

  static handleEnterWorld(socket, server, data) {
    if (socket.uid !== undefined) {
      server.debugLog(
        `[WARNING] ${socket.uid} attempted to join the server whilst being connected.`,
      );
      socket.close();
      return;
    }

    // A password specifically for joining full servers and bypassing IP limits
    const fullServerPassword = "9W2yb52r8CXqIbQs";

    let totalConnections = 0;
    // This object is only defined when a connection with the website server has been established
    // if the connection is not opened, we just use the local numbers
    if (server.globalIpCounts !== undefined) {
      if (server.globalIpCounts[socket.ipAddress] !== undefined) {
        totalConnections = server.globalIpCounts[socket.ipAddress];
      }
    } else {
      Object.values(server.connectedSockets).forEach((connectedSocket) => {
        if (connectedSocket.ipAddress == socket.ipAddress) totalConnections++;
      });
    }

    if (totalConnections >= 5 && !data.name.includes(fullServerPassword)) {
      socket.sendMessage(PacketIds["PACKET_ENTER_WORLD"], {
        allowed: false,
        reason: "MaxIpLimit",
      });
      socket.close();
      return;
    }

    if (
      Object.keys(server.connectedSockets).length >=
        server.serverProperties.maxPlayerCount &&
      !data.name.includes(fullServerPassword)
    ) {
      socket.sendMessage(PacketIds["PACKET_ENTER_WORLD"], {
        allowed: false,
        reason: "MaxPlayerCount",
      });
      return socket.close();
    }

    // Remove the full server password from the name if present
    if (data.name.includes(fullServerPassword))
      data.name = data.name.replaceAll(fullServerPassword, "");

    data.name = data.name
      .trim()
      .substring(0, 16)
      .replace(/<(?:.|\n)*?>/gm, "");
    if (data.name.length < 1) data.name = "Player";

    const playerEntity = server.createEntity("Player", {
      name: data.name,
      position: Util.randomMapPosition(server.serverProperties.mapSize),
    });

    playerEntity.ipAddress = socket.ipAddress;
    playerEntity.lastNetworkPing = server.tick;
    socket.uid = playerEntity.uid;
    server.connectedSockets[socket.uid] = socket;

    const population = Object.keys(server.connectedSockets).length;

    server.debugLog(
      `[POPULATION-UPDATE] ${socket.ipAddress} has joined the world with the name ${playerEntity.name} (server population: ${population}/${server.serverProperties.maxPlayerCount}).`,
    );

    server.debuggingInfo.population = population;

    socket.sendMessage(PacketIds["PACKET_ENTER_WORLD"], {
      allowed: true,
      name: playerEntity.name,
      uid: playerEntity.uid,
      tickRate: server.serverProperties.tickRate,
      tick: server.tick,
      x: server.serverProperties.mapSize.width,
      y: server.serverProperties.mapSize.height,
      minimumBuildDistanceFromWall: server.serverProperties.minimumBuildDistanceFromWall,
      maxFactoryBuildDistance: server.serverProperties.maxFactoryBuildDistance,
      maxPlayerBuildDistance: server.serverProperties.maxPlayerBuildDistance,
      maxPlayerPartyLimit: server.serverProperties.maxPlayerPartyLimit,
    });

    socket.sendMessage(PacketIds["PACKET_RPC"], {
      name: "ToolInfo",
      response: {
        json: JSON.stringify(ToolInfo.getTool("*")),
      },
    });

    socket.sendMessage(PacketIds["PACKET_RPC"], {
      name: "SetTool",
      response: playerEntity.tools,
    });

    socket.sendMessage(PacketIds["PACKET_RPC"], {
      name: "BuildingInfo",
      response: {
        json: JSON.stringify(BuildingInfo.getBuilding(server, "*Players")),
      },
    });

    socket.sendMessage(PacketIds["PACKET_RPC"], {
      name: "SpellInfo",
      response: {
        json: JSON.stringify(SpellInfo.getSpell("*")),
      },
    });

    // Attempt to join the party with the party key provided, if there is one
    const partyFoundWithKey = Object.values(server.parties).find(
      (e) => e.key === data.partyKey,
    );
    if (partyFoundWithKey == undefined) {
      server.createParty(playerEntity);
    } else {
      if (partyFoundWithKey.addMember(server, playerEntity) === false) {
        server.createParty(playerEntity);
      }
    }

    let entityData = {};
    {
      // Grab only the entity data that the client requires, including the buildings as their heights and widths are required
      const buildingInfo = BuildingInfo.getBuilding(server, "*");
      for (let i in buildingInfo) {
        const info = buildingInfo[i];
        entityData[i] = { gridWidth: info.gridWidth, gridHeight: info.gridHeight };
      }

      // TODO: optimise this whole section
      const entityInfo = EntityInfo.getEntity("*");
      for (let i in entityInfo) {
        const info = entityInfo[i];
        entityData[i] = {
          gridWidth:
            info.gridWidth || Math.round(info.radius / (server.world.PixelToWorld / 2)),
          gridHeight:
            info.gridHeight || Math.round(info.radius / (server.world.PixelToWorld / 2)),
        };
      }
    }

    socket.sendMessage(PacketIds["PACKET_RPC"], {
      name: "EntityData",
      response: {
        json: JSON.stringify(entityData),
      },
    });

    socket.sendMessage(PacketIds["PACKET_RPC"], {
      name: "UpdateDayNightCycle",
      response: {
        nightLength: server.cycleData.nightLength / server.serverProperties.tickRate,
        dayLength: server.cycleData.dayLength / server.serverProperties.tickRate,
      },
    });

    socket.sendMessage(PacketIds["PACKET_RPC"], {
      name: "ModelProps",
      response: {
        json: JSON.stringify(modelProps),
      },
    });

    if (server.websiteWsServer.readyState == 1) {
      server.websiteWsServer?._send({
        type: "PlayerCountUpdated",
        playerInfo: [{ isIncreasing: true, ipAddress: socket.ipAddress }],
      });
    }
  }

  static handlePing(socket, server, data) {
    if (server.entities[socket.uid] !== undefined) {
      server.entities[socket.uid].lastNetworkPing = server.tick;
      socket.sendMessage(PacketIds["PACKET_PING"]);
    }
  }

  static handleInput(socket, server, data) {
    const playerEntity = server.entities[socket.uid];
    {
      const directions = ["up", "right", "down", "left"];

      for (const dir of directions) {
        if (data[dir] !== undefined) {
          if (data[dir] === false) playerEntity.inputs.movement[dir] = false;
          else if (data[dir] === true) {
            playerEntity.inputs.movement[dir] = true;
            playerEntity.inputs.movement[
              directions[(directions.indexOf(dir) + 2) % directions.length]
            ] = false;
          }
        }
      }

      if (playerEntity.inputs.movement.up && playerEntity.inputs.movement.right) {
        playerEntity.yaw = 45;
      } else if (
        playerEntity.inputs.movement.down &&
        playerEntity.inputs.movement.right
      ) {
        playerEntity.yaw = 135;
      } else if (playerEntity.inputs.movement.up && playerEntity.inputs.movement.left) {
        playerEntity.yaw = 315;
      } else if (playerEntity.inputs.movement.down && playerEntity.inputs.movement.left) {
        playerEntity.yaw = 225;
      } else if (
        playerEntity.inputs.movement.up &&
        !(playerEntity.inputs.movement.left || playerEntity.inputs.movement.right)
      ) {
        playerEntity.yaw = 0;
      } else if (
        playerEntity.inputs.movement.right &&
        !(playerEntity.inputs.movement.up || playerEntity.inputs.movement.down)
      ) {
        playerEntity.yaw = 90;
      } else if (
        playerEntity.inputs.movement.down &&
        !(playerEntity.inputs.movement.left || playerEntity.inputs.movement.right)
      ) {
        playerEntity.yaw = 180;
      } else if (
        playerEntity.inputs.movement.left &&
        !(playerEntity.inputs.movement.up || playerEntity.inputs.movement.down)
      ) {
        playerEntity.yaw = 270;
      }
    }

    if (typeof data.mouseDown === "boolean") {
      playerEntity.inputs.mouseDown = data.mouseDown;
    }

    {
      if (typeof data.space === "boolean") {
        if (data.space === true) {
          if (playerEntity.inputs.mouseDown === false) {
            playerEntity.inputs.mouseDown = true;
            playerEntity.inputs.falseSpaceReading = false;
          }
        } else if (data.space === false) {
          if (playerEntity.inputs.falseSpaceReading)
            playerEntity.inputs.mouseDown = false;
          else playerEntity.inputs.falseSpaceReading = true;
        }
      }
    }

    if (
      typeof data.mouseMoved === "number" &&
      data.mouseMoved >= 0 &&
      data.mouseMoved <= 359
    ) {
      playerEntity.inputs.aimingYaw = data.mouseMoved;
    }

    if (data.x !== undefined) playerEntity.inputs.mousePosition.x = data.x;
    if (data.y !== undefined) playerEntity.inputs.mousePosition.y = data.y;
  }

  static handleRpc(socket, server, data) {
    if (
      server.entities[socket.uid].dead === true &&
      !["Respawn", "Admin", "OutOfSync"].includes(data.response.name)
    )
      return;

    if (HandleRpc[data.response.name] !== undefined)
      server.playerRpcs.push(data.response.name, socket.uid, data.response);
  }
}

module.exports = Network;
