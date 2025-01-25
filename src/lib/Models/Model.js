import Node from "./Node";

export default class extends Node {
  constructor(game) {
    super(game);
    this.hasDeathFadeEffect = false;
    this.deathFadeEffect = {
      inUse: !1,
      id: 0,
      diedTick: 0,
      lastFramePosition: {
        x: 0,
        y: 0,
      },
      lastFrameVelocity: {
        x: 0,
        y: 0,
      },
      shouldUpdatePosition: !0,
      fadeOutTime: 0,
      maxScaleIncreasePercent: 0,
    };
  }
  reset() {
    this.setParent(null);
  }
  updateDeathFadeEffect(t, e) {
    const r =
        this.game.renderer.replicator.currentTick.tick - this.deathFadeEffect.diedTick,
      n = this.deathFadeEffect.fadeOutTime / this.game.renderer.replicator.msPerTick,
      i = 1 - r / n;
    if (i <= 0)
      return void this.game.renderer.deleteFadingAttachment(this.deathFadeEffect.id);
    this.setAlpha(i);
    const o = 1 + (r / n) * this.deathFadeEffect.maxScaleIncreasePercent;
    this.setScale(o),
      1 == this.deathFadeEffect.shouldUpdatePosition &&
        (this.parent.setPositionX(this.deathFadeEffect.lastFramePosition.x),
        this.parent.setPositionY(this.deathFadeEffect.lastFramePosition.y),
        (this.deathFadeEffect.lastFramePosition.x +=
          (this.deathFadeEffect.lastFrameVelocity.x /
            2 /
            this.game.renderer.replicator.msPerTick) *
          t),
        (this.deathFadeEffect.lastFramePosition.y +=
          (this.deathFadeEffect.lastFrameVelocity.y /
            2 /
            this.game.renderer.replicator.msPerTick) *
          t));
  }
  update(t, e) {
    super.update(t, e),
      1 == this.hasDeathFadeEffect &&
        1 == this.deathFadeEffect?.inUse &&
        this.updateDeathFadeEffect(t, e);
  }
}
