import Model from "./Model";

export default class extends Model {
  constructor(game) {
    super(game);
    this.lastDamagedTick = 0;
    this.lastDamagedAnimationDone = !0;
    this.lastFiringTick = 0;
    this.lastFiringAnimationDone = !0;
  }
  update(t, e) {
    const r = this.getParent();
    e &&
      // (0 == this.game.settings.specialEffectsDisabled && this.updateDamageTint(e),
      this.weaponUpdateFunc?.(e, r);
    super.update(t, e);
  }
  updateDamageTint(t) {
    if (
      t.lastDamagedTick &&
      (t.lastDamagedTick !== this.lastDamagedTick || !this.lastDamagedAnimationDone)
    ) {
      (this.lastDamagedTick = t.lastDamagedTick), (this.lastDamagedAnimationDone = !1);
      const e = this.game.renderer.replicator.getMsSinceTick(t.lastDamagedTick),
        r = 100,
        n = Math.min(e / r, 1),
        i = Math.sin(n * Math.PI);
      let o = (255 << 16) | ((255 - (255 * i) / 4) << 8) | ((255 - (255 * i) / 4) << 0);
      1 === n && ((o = 16777215), (this.lastDamagedAnimationDone = !0)),
        this.base.setTint(o),
        this.weapon && this.weapon.setTint(o);
    }
  }
  updateStabbingWeapon(t = 300) {
    return (e, r) => {
      if (
        e.firingTick &&
        (e.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
      ) {
        (this.lastFiringTick = e.firingTick), (this.lastFiringAnimationDone = !1);
        const r = this.game.renderer.replicator.getMsSinceTick(e.firingTick),
          n = Math.min(r / t, 1),
          i = (Math.sin(2 * n * Math.PI) / Math.PI) * -1;
        1 === n && (this.lastFiringAnimationDone = !0),
          r < t / 2
            ? this.weaponLeft.setPositionY(20 * i)
            : this.weaponRight.setPositionY(20 * i);
      }
    };
  }
  updateAntiClockwiseSwingingWeapon(t = 300, e = 100) {
    return (r, n) => {
      if (
        r.firingTick &&
        (r.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
      ) {
        (this.lastFiringTick = r.firingTick), (this.lastFiringAnimationDone = !1);
        const n = this.game.renderer.replicator.getMsSinceTick(r.firingTick),
          i = Math.min(n / t, 1),
          o = Math.sin(i * Math.PI) * e;
        1 === i && (this.lastFiringAnimationDone = !0), this.weapon.setRotation(-o);
      }
    };
  }
  updateClockwiseSwingingWeapon(t = 300, e = 100) {
    return (r, n) => {
      if (
        r.firingTick &&
        (r.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
      ) {
        (this.lastFiringTick = r.firingTick), (this.lastFiringAnimationDone = !1);
        const n = this.game.renderer.replicator.getMsSinceTick(r.firingTick),
          i = Math.min(n / t, 1),
          o = Math.sin(i * Math.PI) * e;
        1 === i && (this.lastFiringAnimationDone = !0), this.weapon.setRotation(o);
      }
    };
  }
  updateBowWeapon(t = 500, e = 250) {
    return (r, n) => {
      if (
        r.firingTick &&
        (r.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
      )
        if (r.startChargingTick) {
          this.lastFiringAnimationDone = !1;
          const e = this.game.renderer.replicator.getMsSinceTick(r.startChargingTick),
            n = Math.min(e / t, 1);
          this.bowHands.setPositionY(10 * n);
        } else if (
          r.firingTick &&
          (r.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
        ) {
          (this.lastFiringTick = r.firingTick), (this.lastFiringAnimationDone = !1);
          const t = this.game.renderer.replicator.getMsSinceTick(r.firingTick),
            n = Math.min(t / e, 1);
          1 === n && (this.lastFiringAnimationDone = !0),
            this.bowHands.setPositionY(10 - 10 * n);
        }
    };
  }
}
