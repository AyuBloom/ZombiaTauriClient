import ByteBuffer from "bytebuffer";

export default class {
  constructor(game) {
    this.game = game;

    this.currentTickNumber = 0;
    this.knownEntities = {};

    this.inSync = true;
    this.outOfSync = false;

    this.packetArr = [];
    this.packetCountLimit = 200;
    this.modelProps = {
      ArrowProjectile: {
        name: "ArrowProjectile",
        index: 0,
        props: ["position", "yaw"],
        entityClass: "Projectile",
      },
      CannonProjectile: {
        name: "CannonProjectile",
        index: 1,
        props: ["position", "yaw"],
        entityClass: "Projectile",
      },
      DynamiteProjectile: {
        name: "DynamiteProjectile",
        index: 2,
        props: ["position", "tier", "yaw"],
        entityClass: "Projectile",
      },
      MageProjectile: {
        name: "MageProjectile",
        index: 3,
        props: ["position", "yaw"],
        entityClass: "Projectile",
      },
      RocketProjectile: {
        name: "RocketProjectile",
        index: 4,
        props: ["position", "tier", "yaw"],
        entityClass: "Projectile",
      },
      ArrowTower: {
        name: "ArrowTower",
        index: 5,
        props: [
          "aimingYaw",
          "firingTick",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "position",
          "tier",
        ],
        entityClass: "Building",
      },
      CannonTower: {
        name: "CannonTower",
        index: 6,
        props: [
          "aimingYaw",
          "firingTick",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "position",
          "tier",
        ],
        entityClass: "Building",
      },
      LightningTower: {
        name: "LightningTower",
        index: 7,
        props: [
          "firingTick",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "position",
          "targetBeams",
          "tier",
        ],
        entityClass: "Building",
      },
      MageTower: {
        name: "MageTower",
        index: 8,
        props: [
          "aimingYaw",
          "firingTick",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "position",
          "tier",
        ],
        entityClass: "Building",
      },
      RocketTower: {
        name: "RocketTower",
        index: 9,
        props: [
          "aimingYaw",
          "firingTick",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "position",
          "tier",
        ],
        entityClass: "Building",
      },
      SawTower: {
        name: "SawTower",
        index: 10,
        props: [
          "firingTick",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "position",
          "tier",
          "yaw",
        ],
        entityClass: "Building",
      },
      Wall: {
        name: "Wall",
        index: 11,
        props: ["health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building",
      },
      LargeWall: {
        name: "LargeWall",
        index: 12,
        props: ["health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building",
      },
      Door: {
        name: "Door",
        index: 13,
        props: ["health", "lastDamagedTick", "maxHealth", "partyId", "position", "tier"],
        entityClass: "Building",
      },
      SpikeTrap: {
        name: "SpikeTrap",
        index: 14,
        props: ["lastDamagedTick", "partyId", "position", "tier"],
        entityClass: "Building",
      },
      Drill: {
        name: "Drill",
        index: 15,
        props: ["health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building",
      },
      Harvester: {
        name: "Harvester",
        index: 16,
        props: [
          "droneCount",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "position",
          "targetResourceUid",
          "tier",
          "yaw",
        ],
        entityClass: "Building",
      },
      HarvesterDrone: {
        name: "HarvesterDrone",
        index: 17,
        props: [
          "currentHarvestStage",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "position",
          "tier",
          "yaw",
        ],
        entityClass: "Npc",
      },
      ResourcePickup: {
        name: "ResourcePickup",
        index: 18,
        props: ["position", "resourceAmount", "resourcePickupType"],
        entityClass: "ResourcePickup",
      },
      Factory: {
        name: "Factory",
        index: 19,
        props: [
          "aggroEnabled",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "partyId",
          "position",
          "tier",
          "warmingUp",
        ],
        entityClass: "Building",
      },
      Player: {
        name: "Player",
        index: 20,
        privateProps: [
          "aimingYaw",
          "dead",
          "firingTick",
          "invulnerable",
          "gold",
          "health",
          "lastDamagedTick",
          "lastPlayerDamages",
          "maxHealth",
          "name",
          "partyId",
          "position",
          "stone",
          "tokens",
          "wave",
          "weaponName",
          "weaponTier",
          "wood",
          "zombieShieldHealth",
          "zombieShieldMaxHealth",
        ],
        publicProps: [
          "aimingYaw",
          "dead",
          "firingTick",
          "invulnerable",
          "health",
          "lastDamagedTick",
          "maxHealth",
          "name",
          "position",
          "weaponName",
          "weaponTier",
          "zombieShieldHealth",
          "zombieShieldMaxHealth",
        ],
        entityClass: "Player",
      },
      Tree1: {
        name: "Tree1",
        index: 21,
        props: ["aimingYaw", "hits", "position", "radius", "resourceType"],
        entityClass: "Resource",
      },
      Tree2: {
        name: "Tree2",
        index: 22,
        props: ["aimingYaw", "hits", "position", "radius", "resourceType"],
        entityClass: "Resource",
      },
      Stone1: {
        name: "Stone1",
        index: 23,
        props: ["aimingYaw", "hits", "position", "radius", "resourceType"],
        entityClass: "Resource",
      },
      Stone2: {
        name: "Stone2",
        index: 24,
        props: ["aimingYaw", "hits", "position", "radius", "resourceType"],
        entityClass: "Resource",
      },
      Zombie: {
        name: "Zombie",
        index: 25,
        props: ["colour", "maxHealth", "position", "tier", "yaw"],
        entityClass: "Zombie",
      },
      SpellIndicator: {
        name: "SpellIndicator",
        index: 26,
        props: ["position", "radius", "spellType"],
        entityClass: "Spell",
      },
      Visualiser: {
        name: "Visualiser",
        index: 27,
        props: ["position", "yaw"],
        entityClass: "Visualiser",
      },
    };
    this.propTypes = {
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
    this.propTypesArr = Object.keys(this.propTypes);
  }
  setSync(sync, totalSync = false) {
    if (sync != this.inSync) {
      this.inSync = sync;
      if (this.inSync) this.sync(totalSync);
    }
  }
  sync(outOfSync = false) {
    if (1 == this.game.network.connected) {
      if (this.packetArr.length >= this.packetCountLimit || outOfSync) {
        console.log("Tab was hidden for too long. Reporting as desynced.");
        this.packetArr.length = 0;
        this.knownEntities = {};

        this.game.renderer.onServerDesync();
        this.game.renderer.world.onServerDesync();
        this.game.renderer.replicator.onServerDesync();

        this.outOfSync = true;
        this.game.network.sendRpc({
          name: "OutOfSync",
        });
        return;
      }
      if (this.outOfSync) return;
      console.log(`Resyncing socket! Decoding ${this.packetArr.length} packets...`);
      while (this.packetArr.length > 0) {
        this.game.network.handleEntityUpdate(this.decode(this.packetArr[0]));
        this.packetArr.shift();
      }
    }
  }
  encode(t, e) {
    const r = new ByteBuffer(100, true);
    r.writeUint8(t);
    switch (t) {
      case 4:
        this.encodeEnterWorld(r, e);
        break;
      case 3:
        this.encodeInput(r, e);
        break;
      case 9:
        this.encodeRpc(r, e);
        break;
      case 7:
        // sometimes the tab visibility doesnt return a callback on onvisibilitychange, so we would prefer to check every ping also.
        this.setSync("visible" == document.visibilityState);
        break;
    }
    r.flip();
    r.compact();
    return r.toArrayBuffer(false);
  }
  encodeEnterWorld(t, e) {
    t.writeVString(e.name);
    t.writeVString(e.partyKey);
  }
  encodeInput(t, e) {
    const i = {
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
    t.writeUint8(Object.keys(e).length);
    for (let s in e)
      switch ((t.writeUint8(Object.keys(i).indexOf(s)), i[s])) {
        case "Uint16":
          t.writeUint16(e[s]);
          break;
        case "Boolean":
          t.writeUint8(+e[s]);
          break;
        default:
          throw new Error(`Unsupported input attribute type: ${s}`);
      }
  }
  encodeRpc(t, e) {
    const i = {
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
    t.writeUint8(Object.keys(i).indexOf(e.response.name));
    const s = i[e.response.name];
    for (let i in s) {
      const n = s[i],
        r = e.response[i];
      switch (n) {
        case "Uint32":
          t.writeUint32(r);
          break;
        case "Int32":
          t.writeInt32(r);
          break;
        case "Float":
          t.writeFloat(r);
          break;
        case "String":
          t.writeVString(r);
          break;
        case "Vector2":
          (t.writeVarint32(Math.floor(100 * r.x)),
            t.writeVarint32(Math.floor(100 * r.y)));
          break;
        case "ArrayVector2":
          t.writeInt32(r.length);
          for (let e = 0; e < r.length; e++)
            (t.writeInt32(100 * r[e].x), t.writeInt32(100 * r[e].y));
          break;
        case "ArrayUint32":
          t.writeInt32(r.length);
          for (let e = 0; e < r.length; e++) t.writeInt32(r[e]);
          break;
        case "Uint16":
          t.writeUint16(r);
          break;
        case "Uint8":
          t.writeUint8(r);
          break;
        case "Int16":
          t.writeInt16(r);
          break;
        case "Int8":
          t.writeInt8(r);
          break;
        case "Uint64":
          t.writeUint64(r);
          break;
        case "Int64":
          t.writeInt64(r);
          break;
        case "Double":
          t.writeDouble(r);
          break;
        case "Boolean":
          t.writeUint8(+r);
          break;
        default:
          throw new Error(`Unsupported rpc type: ${attributeType}`);
      }
    }
  }
  decode(t) {
    let e = ByteBuffer.wrap(t);
    e.littleEndian = true;
    const i = e.readUint8();
    if (0 == i && !this.inSync) {
      this.packetArr.length < this.packetCountLimit && this.packetArr.push(t);
      e = null;
      return {};
    }
    let s;
    switch (i) {
      case 4:
        s = this.decodeEnterWorld(e);
        break;
      case 0:
        s = this.decodeEntityUpdate(e);
        if (1 == s.unsynced) return {};
        break;
      case 9:
        s = this.decodeRpc(e);
        break;
      case 7:
        s = this.decodePing(e);
    }
    return ((s.opcode = i), s);
  }
  decodeEnterWorld(t) {
    return t.readUint8()
      ? {
          allowed: true,
          name: t.readVString(),
          uid: t.readUint16(),
          tickRate: t.readUint16(),
          startingTick: t.readUint32(),
          x: t.readUint16(),
          y: t.readUint16(),
          minimumBuildDistanceFromWall: t.readUint8(),
          maxFactoryBuildDistance: t.readUint8(),
          maxPlayerBuildDistance: t.readUint8(),
          maxPlayerPartyLimit: t.readUint8(),
        }
      : {
          allowed: false,
          reason: t.readVString(),
        };
  }
  decodeEntityUpdate(t) {
    let e = ++this.currentTickNumber;
    const i = !!t.readUint8();
    if (1 == i)
      ((e = t.readUint32()),
        (this.currentTickNumber = e),
        (this.outOfSync = false),
        console.log("Server has resynced, decoding as normal"));
    else if (0 == i && 1 == this.outOfSync)
      return {
        unsynced: true,
      };
    const s = t.readVarint32();
    for (let e = 0; e < s; e++) {
      let e = t.readUint16();
      delete this.knownEntities[e];
    }
    const n = t.readVarint32(),
      r = {};
    for (let e = 0; e < n; e++) {
      const e = t.readUint16(),
        i = Object.values(this.modelProps)[t.readUint8()];
      if (
        ((r[e] = {
          uid: e,
          model: i.name,
          entityClass: i.entityClass,
        }),
        e == this.game.renderer.world.localPlayer)
      )
        for (const s of i.privateProps) {
          const i = this.propTypes[s];
          this.decodeEntityAttributes(r, e, t, s, i);
        }
      else
        for (const s of i.props || i.publicProps) {
          const i = this.propTypes[s];
          this.decodeEntityAttributes(r, e, t, s, i);
        }
    }
    let a = [],
      o = t.readVarint32(),
      h = Object.keys(this.knownEntities);
    for (let e = 0; e < o; e++) {
      let i = t.readUint8();
      for (let t = 0; t < 8; t++) {
        let s = 1 & i;
        ((i >>= 1),
          0 === s && void 0 !== h[8 * e + t]
            ? a.push(parseInt(h[8 * e + t]))
            : 1 === s && (r[parseInt(h[8 * e + t])] = !0));
      }
    }
    a.sort((t, e) => t - e);
    for (const e of a) {
      r[e] = {};
      const i = t.readUint8();
      for (let s = 0; s < i; s++) {
        const i = this.propTypesArr[t.readUint8()],
          s = this.propTypes[i];
        this.decodeEntityAttributes(r, e, t, i, s);
      }
    }
    const l = t.readUint16() / 100;
    return (
      (this.knownEntities = r),
      {
        tick: e,
        entities: r,
        averageServerFrameTime: l,
        byteSize: t.capacity(),
      }
    );
  }
  splitUint16(t) {
    return {
      firstValue: (t >> 8) & 255,
      secondValue: 255 & t,
    };
  }
  decodeEntityAttributes(t, e, i, s, n) {
    if ("shortPosition" == s) {
      const s = i.readUint16(),
        n = this.splitUint16(s);
      return void (t[e].shortPosition = {
        x: n.firstValue - 128,
        y: n.secondValue - 128,
      });
    }
    let r = ["Grey", "Green", "Blue", "Red"];
    switch (n) {
      case "Boolean":
        t[e][s] = !!i.readUint8();
        break;
      case "Uint32":
        t[e][s] = i.readUint32();
        break;
      case "Int32":
        t[e][s] = i.readInt32();
        break;
      case "Float":
        t[e][s] = i.readFloat();
        break;
      case "String":
        t[e][s] = i.readVString();
        break;
      case "ZombieColour":
        t[e][s] = r[i.readUint8()];
        break;
      case "Vector2":
        t[e][s] = {
          x: i.readUint16(),
          y: i.readUint16(),
        };
        break;
      case "ArrayVector2":
        {
          let n = i.readInt32(),
            r = [];
          for (var a = 0; a < n; a++) {
            var o = i.readInt32() / 100,
              h = i.readInt32() / 100;
            r.push({
              x: o,
              y: h,
            });
          }
          t[e][s] = r;
        }
        break;
      case "ArrayUint32":
        {
          let n = i.readUint16(),
            r = [];
          for (a = 0; a < n; a++) {
            var l = i.readUint32();
            r.push(l);
          }
          t[e][s] = r;
        }
        break;
      case "Uint16":
        t[e][s] = i.readUint16();
        break;
      case "Uint8":
        t[e][s] = i.readUint8();
        break;
      case "Int16":
        t[e][s] = i.readInt16();
        break;
      case "Int8":
        t[e][s] = i.readInt8();
        break;
      case "Uint64":
        t[e][s] = i.readUint64();
        break;
      case "Int64":
        t[e][s] = i.readInt64();
        break;
      case "Double":
        t[e][s] = i.readDouble();
        break;
      case "Varint32":
        t[e][s] = i.readVarint32();
        break;
      default:
        throw new Error(`Unsupported attribute type: ${s}`);
    }
  }
  decodeRpc(t) {
    const e = {
        PartyKey: {
          partyKey: "String",
        },
        PartyBuilding: {
          isArray: !0,
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
          isArray: !0,
          canPlace: "Boolean",
          canSell: "Boolean",
          name: "String",
          uid: "Uint32",
          isLeader: "Boolean",
        },
        UpdateParty: {
          isArray: !0,
          isOpen: "Boolean",
          partyId: "Uint32",
          partyName: "String",
          memberCount: "Uint8",
          memberLimit: "Uint8",
        },
        UpdateLeaderboard: {
          isArray: !0,
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
          isArray: !0,
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
        Failure: {
          failure: "String",
        },
        ReceiveChatMessage: {
          channel: "String",
          name: "String",
          message: "String",
        },
      },
      i = Object.keys(e)[t.readUint8()],
      s = e[i],
      n = {
        name: i,
        response: {},
      };
    if (!0 === s.isArray) {
      const e = [],
        i = t.readUint16();
      for (let n = 0; n < i; n++) {
        let i = {};
        for (let e in s) {
          if ("isArray" == e) continue;
          let n;
          switch (s[e]) {
            case "Uint8":
              n = t.readUint8();
              break;
            case "Uint16":
              n = t.readUint16();
              break;
            case "Uint32":
              n = t.readUint32();
              break;
            case "Uint64":
              n = t.readUint64();
              break;
            case "String":
              n = t.readVString();
              break;
            case "Boolean":
              n = !!t.readUint8();
              break;
            default:
              throw new Error(`Unknown RPC type: ${JSON.stringify(s)}`);
          }
          i[e] = n;
        }
        e.push(i);
      }
      n.response = e;
    } else
      for (let e in s) {
        if ("isArray" == e) continue;
        let i;
        switch (s[e]) {
          case "Uint8":
            i = t.readUint8();
            break;
          case "Uint16":
            i = t.readUint16();
            break;
          case "Uint32":
            i = t.readUint32();
            break;
          case "Uint64":
            i = t.readUint64();
            break;
          case "String":
            i = t.readVString();
            break;
          case "Boolean":
            i = !!t.readUint8();
            break;
          default:
            throw new Error(`Unknown RPC type: ${JSON.stringify(s)}`);
        }
        n.response[e] = i;
      }
    return n;
  }
  decodePing(t) {
    return {};
  }
}
