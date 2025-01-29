import ByteBuffer from "bytebuffer";

export default class {
  constructor(game) {
    this.game = game;

    this.socket = null;

    this.currentTickNumber = 0;
    this.knownEntities = {};

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

    this.outOfSync = false;
    this.packetArr = [];
    this.packetCountLimit = 200;

    document.onvisibilitychange = () => {
      if ("visible" == document.visibilityState && 1 == this.game.network.connected) {
        if (this.packetArr.length >= this.packetCountLimit) {
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
        console.log(`Page is now visible! Decoding ${this.packetArr.length} packets...`);
        for (; this.packetArr.length > 0; ) {
          this.game.network.handleEntityUpdate(this.decode(this.packetArr[0]));
          this.packetArr.shift();
        }
      } else console.log("this fires first? or nah?");
    };
  }
  encode(t, e) {
    const r = new ByteBuffer(100, true);
    switch ((r.writeUint8(t), t)) {
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
        this.encodePing(r, e);
    }
    return r.flip(), r.compact(), r.toArrayBuffer(false);
  }
  encodeEnterWorld(t, e) {
    t.writeVString(e.name), t.writeVString(e.partyKey);
  }
  encodeInput(t, e) {
    const r = {
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
    for (let n in e)
      switch ((t.writeUint8(Object.keys(r).indexOf(n)), r[n])) {
        case "Uint16":
          t.writeUint16(e[n]);
          break;
        case "Boolean":
          t.writeUint8(+e[n]);
          break;
        default:
          throw new Error(`Unsupported input attribute type: ${n}`);
      }
  }
  encodeRpc(t, e) {
    const r = {
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
    t.writeUint8(Object.keys(r).indexOf(e.response.name));
    const n = r[e.response.name];
    for (let r in n) {
      const i = n[r],
        o = e.response[r];
      switch (i) {
        case "Uint32":
          t.writeUint32(o);
          break;
        case "Int32":
          t.writeInt32(o);
          break;
        case "Float":
          t.writeFloat(o);
          break;
        case "String":
          t.writeVString(o);
          break;
        case "Vector2":
          t.writeVarint32(Math.floor(100 * o.x)), t.writeVarint32(Math.floor(100 * o.y));
          break;
        case "ArrayVector2":
          t.writeInt32(o.length);
          for (let e = 0; e < o.length; e++)
            t.writeInt32(100 * o[e].x), t.writeInt32(100 * o[e].y);
          break;
        case "ArrayUint32":
          t.writeInt32(o.length);
          for (let e = 0; e < o.length; e++) t.writeInt32(o[e]);
          break;
        case "Uint16":
          t.writeUint16(o);
          break;
        case "Uint8":
          t.writeUint8(o);
          break;
        case "Int16":
          t.writeInt16(o);
          break;
        case "Int8":
          t.writeInt8(o);
          break;
        case "Uint64":
          t.writeUint64(o);
          break;
        case "Int64":
          t.writeInt64(o);
          break;
        case "Double":
          t.writeDouble(o);
          break;
        case "Boolean":
          t.writeUint8(+o);
          break;
        default:
          throw new Error(`Unsupported rpc type: ${attributeType}`);
      }
    }
  }
  encodePing(t, e) {}
  decode(t) {
    let e = ByteBuffer.wrap(t);
    e.littleEndian = true;
    const r = e.readUint8();
    if (0 == r && "hidden" == document.visibilityState) {
      this.packetArr.length < this.packetCountLimit && this.packetArr.push(t);
      e = null;
      return {};
    }
    let n;
    switch (r) {
      case 4:
        n = this.decodeEnterWorld(e);
        break;
      case 0:
        if (((n = this.decodeEntityUpdate(e)), 1 == n.unsynced)) return {};
        break;
      case 9:
        n = this.decodeRpc(e);
        break;
      case 7:
        n = this.decodePing(e);
    }
    return (n.opcode = r), n;
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
    let __ = null;
    let e = ++this.currentTickNumber;
    const r = !!t.readUint8();
    if (1 == r) {
      e = t.readUint32();
      this.currentTickNumber = e;
      this.outOfSync = false;
      console.log("Server has resynced, decoding as normal");
      __ = true;
    } else if (0 == r && 1 == this.outOfSync) {
      return {
        unsynced: true,
      };
    }
    const n = t.readVarint32();
    for (let e = 0; e < n; e++) {
      let e = t.readUint16();
      delete this.knownEntities[e];
    }
    const i = t.readVarint32(),
      o = {};
    for (let e = 0; e < i; e++) {
      const e = t.readUint16(),
        r = Object.values(this.modelProps)[t.readUint8()];
      if (
        ((o[e] = {
          uid: e,
          model: r.name,
          entityClass: r.entityClass,
        }),
        e == this.game.renderer.world.localPlayer)
      )
        for (const n of r.privateProps) {
          const r = this.propTypes[n];
          this.decodeEntityAttributes(o, e, t, n, r);
        }
      else
        for (const n of r.props || r.publicProps) {
          const r = this.propTypes[n];
          this.decodeEntityAttributes(o, e, t, n, r);
        }
    }
    let s = [],
      a = t.readVarint32(),
      c = Object.keys(this.knownEntities);
    for (let e = 0; e < a; e++) {
      let r = t.readUint8();
      for (let t = 0; t < 8; t++) {
        let n = 1 & r;
        (r >>= 1),
          0 === n && void 0 !== c[8 * e + t]
            ? s.push(parseInt(c[8 * e + t]))
            : 1 === n && (o[parseInt(c[8 * e + t])] = !0);
      }
    }
    s.sort((t, e) => t - e);
    for (const e of s) {
      o[e] = {};
      const r = t.readUint8();
      for (let n = 0; n < r; n++) {
        const r = this.propTypesArr[t.readUint8()],
          n = this.propTypes[r];
        this.decodeEntityAttributes(o, e, t, r, n);
      }
    }
    const l = t.readUint16() / 100;
    __ === true && console.log(o);
    return (
      (this.knownEntities = o),
      {
        tick: e,
        entities: o,
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
  decodeEntityAttributes(t, e, r, n, i) {
    if ("shortPosition" == n) {
      const n = r.readUint16(),
        i = this.splitUint16(n);
      return void (t[e].shortPosition = {
        x: i.firstValue - 128,
        y: i.secondValue - 128,
      });
    }
    let s = ["Grey", "Green", "Blue", "Red"];
    switch (i) {
      case "Boolean":
        t[e][n] = !!r.readUint8();
        break;
      case "Uint32":
        t[e][n] = r.readUint32();
        break;
      case "Int32":
        t[e][n] = r.readInt32();
        break;
      case "Float":
        t[e][n] = r.readFloat();
        break;
      case "String":
        t[e][n] = r.readVString();
        break;
      case "ZombieColour":
        t[e][n] = s[r.readUint8()];
        break;
      case "Vector2":
        t[e][n] = {
          x: r.readUint16(),
          y: r.readUint16(),
        };
        break;
      case "ArrayVector2":
        {
          let i = r.readInt32(),
            s = [];
          for (var o = 0; o < i; o++) {
            var a = r.readInt32() / 100,
              u = r.readInt32() / 100;
            s.push({
              x: a,
              y: u,
            });
          }
          t[e][n] = s;
        }
        break;
      case "ArrayUint32":
        {
          let i = r.readUint16(),
            s = [];
          for (o = 0; o < i; o++) {
            var l = r.readUint32();
            s.push(l);
          }
          t[e][n] = s;
        }
        break;
      case "Uint16":
        t[e][n] = r.readUint16();
        break;
      case "Uint8":
        t[e][n] = r.readUint8();
        break;
      case "Int16":
        t[e][n] = r.readInt16();
        break;
      case "Int8":
        t[e][n] = r.readInt8();
        break;
      case "Uint64":
        t[e][n] = r.readUint64();
        break;
      case "Int64":
        t[e][n] = r.readInt64();
        break;
      case "Double":
        t[e][n] = r.readDouble();
        break;
      case "Varint32":
        t[e][n] = r.readVarint32();
        break;
      default:
        throw new Error(`Unsupported attribute type: ${n}`);
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
      },
      r = Object.keys(e)[t.readUint8()],
      n = e[r],
      i = {
        name: r,
        response: {},
      };
    if (!0 === n.isArray) {
      const e = [],
        r = t.readUint16();
      for (let i = 0; i < r; i++) {
        let r = {};
        for (let e in n) {
          if ("isArray" == e) continue;
          let i;
          switch (n[e]) {
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
              throw new Error(`Unknown RPC type: ${JSON.stringify(n)}`);
          }
          r[e] = i;
        }
        e.push(r);
      }
      i.response = e;
    } else
      for (let e in n) {
        if ("isArray" == e) continue;
        let r;
        switch (n[e]) {
          case "Uint8":
            r = t.readUint8();
            break;
          case "Uint16":
            r = t.readUint16();
            break;
          case "Uint32":
            r = t.readUint32();
            break;
          case "Uint64":
            r = t.readUint64();
            break;
          case "String":
            r = t.readVString();
            break;
          case "Boolean":
            r = !!t.readUint8();
            break;
          default:
            throw new Error(`Unknown RPC type: ${JSON.stringify(n)}`);
        }
        i.response[e] = r;
      }
    return i;
  }
  decodePing(t) {
    return {};
  }
  onModelProps(t) {
    this.modelProps = JSON.parse(t.json);
  }
}
