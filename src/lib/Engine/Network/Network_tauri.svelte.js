import WebSocket from "@tauri-apps/plugin-websocket";
import Codec from "./Codec.js";

export default class {
  ping = $state();

  constructor(game) {
    this.game = game;
    this.codec = new Codec(game);

    this.connected = false;
    this.connecting = false;

    this.pingStart = null;
    this.pingCompletion = null;

    this.options = {};
  }
  init() {
    // this.inputPacketManager.init();
    this.game.eventEmitter.on(
      "ModelPropsRpcReceived",
      this.codec.onModelProps.bind(this.codec),
    );
    /*
      document.onvisibilitychange = () => {
          if ("visible" == document.visibilityState && 1 == dr.network.connected) {
              if (this.packetArr.length >= this.packetCountLimit)
                  return console.log("Tab was hidden for too long. Reporting as desynced."),
                  this.packetArr.length = 0,
                  this.knownEntities = {},
                  dr.renderer.onServerDesync(),
                  dr.renderer.world.onServerDesync(),
                  dr.renderer.replicator.onServerDesync(),
                  this.outOfSync = !0,
                  void dr.network.sendRpc({
                      name: "OutOfSync"
                  });
              for (console.log(`Page is now visible! Decoding ${this.packetArr.length} packets...`); this.packetArr.length > 0; )
                  this.handleEntityUpdate(this.decode(this.packetArr[0])),
                  this.packetArr.shift()
          }
      }
      */
  }
  setConnectionData(t, e, r) {
    this.options = {
      name: t,
      partyKey: e,
      serverData: r,
    };
  }
  async connect() {
    if (!this.connected || !this.connecting) {
      this.connecting = true;
      this.codec.socket = await WebSocket.connect(
        `ws://server-${this.options.serverData.id}.zombia.io:${this.options.serverData.port}`,
      );
      // this.codec.socket.binaryType = "arraybuffer";
      this.codec.socket.addListener("open", this.onSocketOpen.bind(this));
      this.codec.socket.addListener("close", this.onSocketClose.bind(this));
      this.codec.socket.addListener("message", this.onSocketMessage.bind(this));
    }
  }
  onSocketOpen() {
    this.connected = true;
    this.connecting = false;

    this.codec.knownEntities = {};

    this.sendEnterWorld(this.options.name, this.options.partyKey);
    this.sendPingIfNecessary();

    this.game.eventEmitter.emit("SocketOpened");
  }
  onSocketClose() {
    this.codec.pingStart = null;

    this.connected = false;
    this.connecting = false;

    if (this.socketIntentionallyClosed) {
      this.socketIntentionallyClosed = false;
    } else {
      setTimeout(this.connect.bind(this), 1e3);
    }
    this.game.eventEmitter.emit("SocketClosed");
  }
  onSocketMessage(t) {
    console.log(t);
    if ("string" == typeof t.data) return console.log(t.data);
    const e = this.codec.decode(t.data);
    if (null != e.opcode)
      switch (e.opcode) {
        case 4:
          this.handleEnterWorldResponse(e);
          break;
        case 0:
          this.handleEntityUpdate(e);
          break;
        case 9:
          this.handleRpc(e);
          break;
        case 7:
          this.handlePing(e);
      }
  }
  sendPingIfNecessary() {
    null !== this.pingStart ||
      (null !== this.pingCompletion &&
        new Date().getTime() - this.pingCompletion.getTime() <= 5e3) ||
      ((this.pingStart = new Date()), this.sendPing());
  }
  sendPacket(t, e) {
    this.codec.socket.readyState === 1 && this.codec.socket.send(this.codec.encode(t, e));
  }
  sendEnterWorld(t, e) {
    this.sendPacket(4, {
      name: t,
      partyKey: e,
    });
  }
  sendInput(t) {
    this.sendPacket(3, t);
  }
  sendRpc(t) {
    this.sendPacket(9, {
      response: t,
    });
  }
  sendPing() {
    this.sendPacket(7);
  }
  handleEnterWorldResponse(t) {
    if (false === t.allowed) return (this.socketIntentionallyClosed = true);

    this.codec.currentTickNumber = t.startingTick;

    this.game.eventEmitter.emit("EnterWorldResponse", t);
  }
  handleEntityUpdate(t) {
    const e = performance.now();
    this.codec.entityUpdateTimeDelta = e - this.codec.lastEntityUpdateMessageReceived;
    this.codec.lastEntityUpdateMessageReceived = e;

    this.sendPingIfNecessary();

    this.game.eventEmitter.emit("EntityUpdate", t);
  }
  handleRpc(t) {
    this.game.eventEmitter.emit(`${t.name}RpcReceived`, t.response);
  }
  handlePing() {
    const t = new Date();
    this.ping = (t.getTime() - this.pingStart.getTime()) / 2;
    this.pingStart = null;
    this.pingCompletion = t;
  }
}
