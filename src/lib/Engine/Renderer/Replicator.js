export default class {
  constructor(game) {
    this.game = game;
    this.currentTick = {
      tick: 0,
    };
    this.ticks = [];
    this.shiftedGameTime = 0;
    this.lastShiftedGameTime = 0;
    this.receivedFirstTick = false;
    this.serverTime = 0;
    this.msPerTick = 0;
    this.msInThisTick = 0;
    this.msElapsed = 0;
    this.lastMsElapsed = 0;
    this.startTime = null;
    this.startShiftedGameTime = 0;
    this.frameStutters = 0;
    this.frameTimes = [];
    this.interpolating = false;
    this.ticksDesynced = 0;
    this.ticksDesynced2 = 0;
    this.clientTimeResets = 0;
    this.maxExtrapolationTime = 0;
    this.totalExtrapolationTime = 0;
    this.extrapolationIncidents = 0;
    this.differenceInClientTime = 0;
    this.equalTimes = 0;
    this.wasRendererJustUnpaused = false;
    this.tickUpdatedCallback = () => {};
    this.game.eventEmitter.on("EnterWorldResponse", this.onEnterWorld.bind(this));
    this.game.eventEmitter.on("EntityUpdate", this.onEntityUpdate.bind(this));
    this.game.eventEmitter.on("RendererUpdated", this.onTick.bind(this));
  }
  setTargetTickUpdatedCallback(t) {
    this.tickUpdatedCallback = t;
  }
  getClientTimeResets() {
    return this.clientTimeResets;
  }
  getMsInThisTick() {
    return Math.floor(this.msInThisTick);
  }
  getMsPerTick() {
    return this.msPerTick;
  }
  getMsSinceTick(t, e = !0) {
    return e && (t += 1), this.shiftedGameTime - t * this.msPerTick;
  }
  getMsUntilTick(t) {
    return t * this.msPerTick - this.shiftedGameTime;
  }
  getServerTime() {
    return Math.floor(this.serverTime);
  }
  getClientTime() {
    return Math.floor(this.shiftedGameTime);
  }
  getRealClientTime() {
    if (null == this.startTime) return 0;
    var t = new Date().getTime() - this.startTime.getTime();
    return Math.floor(this.startShiftedGameTime + t);
  }
  getFrameStutters() {
    return this.frameStutters;
  }
  getDifferenceInClientTime() {
    return this.differenceInClientTime;
  }
  isFpsReady() {
    return this.frameTimes.length >= 10;
  }
  getFps() {
    for (var t = 0, e = 0; e < this.frameTimes.length; e++) t += this.frameTimes[e];
    return 1e3 / (t / this.frameTimes.length);
  }
  getTickIndex() {
    return null == this.currentTick ? 0 : this.currentTick.tick;
  }
  getMaxExtrapolationTime() {
    return this.maxExtrapolationTime;
  }
  getExtrapolationIncidents() {
    return this.extrapolationIncidents;
  }
  getTotalExtrapolationTime() {
    return this.totalExtrapolationTime;
  }
  resetClientLag() {
    this.shiftedGameTime = this.getRealClientTime();
  }
  onTick({ msElapsed: t }) {
    (this.msElapsed += t),
      (this.lastMsElapsed = t),
      this.frameTimes.push(t),
      this.frameTimes.length > 10 && this.frameTimes.shift();
    for (var e = 0, r = 1e3 / 60; this.msElapsed >= r; ) (this.msElapsed -= r), e++;
    e > 1 && this.frameStutters++,
      this.isRendererPaused() &&
        ((this.wasRendererJustUnpaused = !0), (this.equalTimes = 0), (t = 0)),
      (this.serverTime += t),
      (this.shiftedGameTime += t),
      (this.msInThisTick += t),
      this.updateTick();
  }
  onServerDesync() {
    this.ticks.length = 0;
  }
  updateTick() {
    for (var t = 0; t < this.ticks.length; t++) {
      var e = this.ticks[t],
        r = this.msPerTick * e.tick;
      this.shiftedGameTime >= r &&
        ((this.currentTick = e),
        (this.msInThisTick = this.shiftedGameTime - r),
        this.tickUpdatedCallback(e.entities),
        this.ticks.shift(),
        t--);
    }
    if (null != this.currentTick) {
      var n = this.msPerTick * (this.currentTick.tick + 1);
      if (this.shiftedGameTime >= n) {
        this.interpolating && ((this.interpolating = !1), this.extrapolationIncidents++),
          (this.maxExtrapolationTime = Math.max(
            this.shiftedGameTime - n,
            this.maxExtrapolationTime,
          ));
        let t = Math.min(this.msInThisTick - this.msPerTick, this.lastMsElapsed);
        this.totalExtrapolationTime += t;
      } else this.interpolating = !0;
      this.serverTime - this.shiftedGameTime < this.game.network.ping &&
        (this.ticksDesynced++, this.ticksDesynced);
    }
  }
  onEnterWorld(t) {
    t.allowed &&
      ((this.msPerTick = t.tickRate),
      (this.msInThisTick = 0),
      (this.shiftedGameTime = 0),
      (this.serverTime = 0),
      (this.receivedFirstTick = !1),
      (this.msElapsed = 0),
      (this.lastMsElapsed = 0),
      (this.startTime = null),
      (this.startShiftedGameTime = 0),
      (this.interpolating = !1));
  }
  checkRendererPaused() {
    this.lastShiftedGameTime == this.shiftedGameTime
      ? this.equalTimes++
      : (this.equalTimes = 0);
  }
  isRendererPaused() {
    return this.equalTimes >= 8;
  }
  onEntityUpdate(t) {
    if (
      ((this.serverTime = t.tick * this.msPerTick + this.game.network.ping),
      this.ticks.push(t),
      this.receivedFirstTick)
    ) {
      this.checkRendererPaused();
      var e = this.isRendererPaused(),
        r = t.tick * this.msPerTick - 90 - this.shiftedGameTime;
      if (
        (e || (this.differenceInClientTime = r),
        Math.abs(r) >= 40 ? this.ticksDesynced2++ : (this.ticksDesynced2 = 0),
        this.ticksDesynced2 >= 10 || this.wasRendererJustUnpaused)
      ) {
        var n = this.shiftedGameTime;
        (this.shiftedGameTime = t.tick * this.msPerTick - 90),
          (this.msInThisTick += this.shiftedGameTime - n),
          e || this.wasRendererJustUnpaused || this.clientTimeResets++,
          (this.ticksDesynced2 = 0),
          (this.wasRendererJustUnpaused = !1);
      }
      this.lastShiftedGameTime = this.shiftedGameTime;
    } else
      (this.receivedFirstTick = !0),
        (this.startTime = new Date()),
        (this.shiftedGameTime = t.tick * this.msPerTick - 90),
        (this.startShiftedGameTime = this.shiftedGameTime),
        (this.clientTimeResets = 0);
  }
}
