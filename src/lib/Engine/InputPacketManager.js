export default class {
  constructor(game) {
    this.game = game;
    this.movementPackets = {};
    this.lastSentYaw = 1;
    this.hasBoundKeys = false;
    this.mouseDown = false;
    this.shiftDown = false;
    this.inputsLocked = false;
  }
  init() {
    this.game.eventEmitter.on("EnterWorldResponse", this.onEnterWorld.bind(this));
  }
  /*
    toggleInputLock() {
        this.game.network.connected && (this.inputsLocked = !this.inputsLocked,
        this.game.ui.components.uiInputLock.toggle(this.inputsLocked))
    }
    */
  onEnterWorld() {
    this.inputsLocked = false;
    if (!this.hasBoundKeys) {
      this.hasBoundKeys = true;

      window.addEventListener("keydown", this.onKeydown.bind(this));
      window.addEventListener("keyup", this.onKeyup.bind(this));
      window.addEventListener("mousedown", this.onMouseDown.bind(this));
      window.addEventListener("mouseup", this.onMouseUp.bind(this));
      window.addEventListener("mousemove", this.onMouseMoved.bind(this));
    }
  }
  sendInputPacket(t, e) {
    /*
        if (1 == this.inputsLocked && 71 !== e.which)
            return void dr.ui.components.uiInputLock.alert();
            */
    let r = {};
    for (let e of Object.keys(t))
      if (void 0 === this.movementPackets[e])
        (this.movementPackets[e] = t[e]), (r[e] = t[e]);
      else {
        if (this.movementPackets[e] === t[e]) continue;
        (this.movementPackets[e] = t[e]), (r[e] = t[e]);
      }
    Object.keys(r).length > 0 &&
      this.game.network.sendInput({
        ...r,
      });
  }
  onKeydown(t) {
    switch (t.which) {
      case 87:
      case 38:
        this.sendInputPacket(
          {
            up: true,
            down: false,
          },
          t,
        );
        break;
      case 65:
      case 37:
        this.sendInputPacket(
          {
            left: true,
            right: false,
          },
          t,
        );
        break;
      case 83:
      case 40:
        this.sendInputPacket(
          {
            down: true,
            up: false,
          },
          t,
        );
        break;
      case 68:
      case 39:
        this.sendInputPacket(
          {
            right: true,
            left: false,
          },
          t,
        );
        break;
      case 32:
        this.sendInputPacket(
          {
            space: true,
          },
          t,
        );
        break;
      case 16:
        this.shiftDown = true;
    }
    this.game.eventEmitter.emit(`${t.which}Down`);
  }
  onKeyup(t) {
    switch (t.which) {
      case 87:
      case 38:
        this.sendInputPacket(
          {
            up: false,
          },
          t,
        );
        break;
      case 65:
      case 37:
        this.sendInputPacket(
          {
            left: false,
          },
          t,
        );
        break;
      case 83:
      case 40:
        this.sendInputPacket(
          {
            down: false,
          },
          t,
        );
        break;
      case 68:
      case 39:
        this.sendInputPacket(
          {
            right: false,
          },
          t,
        );
        break;
      case 32:
        this.sendInputPacket(
          {
            space: false,
          },
          t,
        );
        break;
      case 16:
        this.shiftDown = false;
        break;
      /*
        case 71:
            this.toggleInputLock()
            */
    }
    this.game.eventEmitter.emit(`${t.which}Up`, t);
  }
  getLastSentYaw() {
    return this.lastSentYaw;
  }
  onMouseMoved(t) {
    const e = this.game.renderer.screenToWorld(t.clientX, t.clientY),
      r = this.game.renderer.screenToYaw(t.clientX, t.clientY);
    this.lastSentYaw = r;
    this.sendInputPacket(
      {
        mouseMoved: r,
        x: Math.floor(e.x),
        y: Math.floor(e.y),
      },
      t,
    );
    this.game.eventEmitter.emit("mouseMoved", {
      event: t,
    });
  }
  onMouseDown(t) {
    if (3 == t.which || 2 == t.button) {
      this.rightMouseDown &&
        this.game.eventEmitter.emit("rightMouseUp", {
          event: t,
        });
      this.rightMouseDown = true;
      return void this.game.eventEmitter.emit("rightMouseDown", {
        event: t,
      });
    }
    false == this.game.ui.castingSpell &&
      this.sendInputPacket(
        {
          mouseDown: true,
        },
        t,
      );
    this.mouseDown = true;
    this.game.eventEmitter.emit("mouseDown", {
      event: t,
    });
  }
  onMouseUp(t) {
    if (1 != this.inputsLocked) {
      if (3 == t.which || 2 == t.button) {
        this.rightMouseDown = false;
        return void this.game.eventEmitter.emit("rightMouseUp", t);
      }
      false == this.game.ui.castingSpell &&
        this.sendInputPacket(
          {
            mouseDown: false,
          },
          t,
        );
      this.mouseDown = false;
      this.game.eventEmitter.emit("mouseUp", {
        event: t,
      });
    }
  }
}
