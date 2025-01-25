import PIXI from "pixi.js";
import Node from "./Node.js";
import TextNode from "./TextNode.js";

class ee extends te {
  constructor() {
    super(),
      (this.lastDamagedTick = 0),
      (this.lastDamagedAnimationDone = !0),
      (this.lastFiringTick = 0),
      (this.lastFiringAnimationDone = !0);
  }
  update(t, e) {
    const r = this.getParent();
    e &&
      (0 == dr.settings.specialEffectsDisabled && this.updateDamageTint(e),
      this.weaponUpdateFunc?.(e, r)),
      super.update(t, e);
  }
  updateDamageTint(t) {
    if (
      t.lastDamagedTick &&
      (t.lastDamagedTick !== this.lastDamagedTick || !this.lastDamagedAnimationDone)
    ) {
      (this.lastDamagedTick = t.lastDamagedTick), (this.lastDamagedAnimationDone = !1);
      const e = dr.renderer.replicator.getMsSinceTick(t.lastDamagedTick),
        r = 100,
        n = Math.min(e / r, 1),
        i = Math.sin(n * Math.PI);
      let o = (255 << 16) | ((255 - (255 * i) / 4) << 8) | ((255 - (255 * i) / 4) << 0);
      1 === n && ((o = 16777215), (this.lastDamagedAnimationDone = !0)),
        this.base.setTint(o),
        this.weapon && this.weapon.setTint(o);
    }
  }
  updatePunchingWeapon(t = 300) {
    return (e, r) => {
      if (
        e.firingTick &&
        (e.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
      ) {
        (this.lastFiringTick = e.firingTick), (this.lastFiringAnimationDone = !1);
        const r = dr.currentGame.world.getReplicator().getMsSinceTick(e.firingTick),
          n = Math.min(r / t, 1),
          i = (Math.sin(2 * n * Math.PI) / Math.PI) * -1;
        1 === n && (this.lastFiringAnimationDone = !0), this.weapon.setPositionY(20 * i);
      }
    };
  }
  updateStabbingWeapon(t = 300) {
    return (e, r) => {
      if (
        e.firingTick &&
        (e.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
      ) {
        (this.lastFiringTick = e.firingTick), (this.lastFiringAnimationDone = !1);
        const r = dr.renderer.replicator.getMsSinceTick(e.firingTick),
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
        const n = dr.renderer.replicator.getMsSinceTick(r.firingTick),
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
        const n = dr.renderer.replicator.getMsSinceTick(r.firingTick),
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
          const e = dr.renderer.replicator.getMsSinceTick(r.startChargingTick),
            n = Math.min(e / t, 1);
          this.bowHands.setPositionY(10 * n);
        } else if (
          r.firingTick &&
          (r.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
        ) {
          (this.lastFiringTick = r.firingTick), (this.lastFiringAnimationDone = !1);
          const t = dr.renderer.replicator.getMsSinceTick(r.firingTick),
            n = Math.min(t / e, 1);
          1 === n && (this.lastFiringAnimationDone = !0),
            this.bowHands.setPositionY(10 - 10 * n);
        }
    };
  }
}
class re extends Jt {
  constructor() {
    super(), (this.draw = new Nt.T()), this.clear(), this.setNode(this.draw);
  }
  drawTriangle(t, e, r, n = null, i = null, o = null) {
    this.draw.poly([t.x, t.y, e.x, e.y, r.x, r.y]),
      n &&
        this.draw.fill({
          color: (n.r << 16) | (n.g << 8) | n.b,
          alpha: null == n.a ? 1 : n.a,
        }),
      o &&
        o > 0 &&
        this.draw.stroke({
          width: o,
          color: (i.r << 16) | (i.g << 8) | i.b,
          alpha: null == i.a ? 1 : n.a,
        });
  }
  drawArc(t, e, r, n, i, o, s = null, a = null, c = null) {
    this.draw.arc(t, e, r, n, i, o),
      s &&
        this.draw.fill({
          color: (s.r << 16) | (s.g << 8) | s.b,
          alpha: null == s.a ? 1 : s.a,
        }),
      c &&
        c > 0 &&
        this.draw.stroke({
          width: c,
          color: (a.r << 16) | (a.g << 8) | a.b,
          alpha: null == a.a ? 1 : s.a,
        }),
      (n *= Math.PI / 180),
      (i *= Math.PI / 180);
  }
  drawCircle(t, e, r, n = null, i = null, o = null) {
    this.draw.circle(t, e, r),
      n &&
        this.draw.fill({
          color: (n.r << 16) | (n.g << 8) | n.b,
          alpha: null == n.a ? 1 : n.a,
        }),
      o &&
        o > 0 &&
        this.draw.stroke({
          width: o,
          color: (i.r << 16) | (i.g << 8) | i.b,
          alpha: null == i.a ? 1 : n.a,
        });
  }
  drawRect(t, e, r, n, i = null, o = null, s = null, a = 1) {
    this.draw.rect(t, e, r - t, n - e),
      i &&
        this.draw.fill({
          color: (i.r << 16) | (i.g << 8) | i.b,
          alpha: a,
        }),
      s &&
        s > 0 &&
        this.draw.stroke({
          width: s,
          color: (o.r << 16) | (o.g << 8) | o.b,
        });
  }
  drawRoundedRect(t, e, r, n, i, o = null, s = null, a = null, c = 1) {
    this.draw.roundRect(t, e, r - t, n - e, i),
      o &&
        this.draw.fill({
          color: (o.r << 16) | (o.g << 8) | o.b,
          alpha: c,
        }),
      a &&
        a > 0 &&
        this.draw.stroke({
          width: a,
          color: (s.r << 16) | (s.g << 8) | s.b,
        });
  }
  drawEllipse(t, e, r, n, i = null, o = null, s = null) {
    this.draw.ellipse(t, e, r, n),
      i &&
        this.draw.fill({
          color: (i.r << 16) | (i.g << 8) | i.b,
          alpha: null == i.a ? 1 : i.a,
        }),
      s &&
        s > 0 &&
        this.draw.stroke({
          width: s,
          color: (o.r << 16) | (o.g << 8) | o.b,
          alpha: null == o.a ? 1 : i.a,
        });
  }
  getTexture() {
    return dr.renderer.getInternalRenderer().generateTexture(this.draw);
  }
  clear() {
    this.draw.clear();
  }
  setParent(t) {
    super.setParent(t), null == t && this.draw.destroy();
  }
}
class ne extends Jt {
  constructor(t) {
    super(),
      (this.barColor = t || {
        r: 180,
        g: 0,
        b: 10,
      }),
      (this.width = 84),
      (this.height = 12),
      (this.backgroundNode = new re()),
      this.backgroundNode.drawRoundedRect(0, 0, this.width, this.height, 3, {
        r: 0,
        g: 0,
        b: 0,
      }),
      this.backgroundNode.setAlpha(0.3),
      (this.barNode = new re()),
      this.barNode.drawRoundedRect(
        2,
        2,
        this.width - 2,
        this.height - 2,
        2,
        this.barColor,
      ),
      this.addAttachment(this.backgroundNode),
      this.addAttachment(this.barNode),
      this.setPivotPoint(this.width / 2, -64),
      this.setMaxHealth(100),
      this.setHealth(100);
  }
  setSize(t, e) {
    const r = this.percent;
    (this.width = t),
      (this.height = e),
      (this.percent = null),
      this.backgroundNode.clear(),
      this.backgroundNode.drawRoundedRect(0, 0, this.width, this.height, 3, {
        r: 0,
        g: 0,
        b: 0,
      }),
      this.barNode.clear(),
      this.barNode.drawRoundedRect(
        2,
        2,
        this.width - 2,
        this.height - 2,
        2,
        this.barColor,
      ),
      this.setPivotPoint(this.width / 2, -64),
      this.setPercent(r);
  }
  setHealth(t) {
    (this.health = t), this.setPercent(this.health / this.maxHealth);
  }
  setMaxHealth(t) {
    (this.maxHealth = t), this.setPercent(this.health / this.maxHealth);
  }
  setPercent(t) {
    this.percent !== t && ((this.percent = t), this.barNode.setScaleX(this.percent));
  }
  update(t, e) {
    e && (this.setHealth(e.health), this.setMaxHealth(e.maxHealth)),
      this.setRotation(-this.getParent().getParent().getRotation()),
      super.update(t, e);
  }
}
class ie extends Jt {
  constructor() {
    super(),
      (this.barColor = {
        r: 61,
        g: 161,
        b: 217,
      }),
      (this.width = 76),
      (this.height = 8),
      (this.percent = 1),
      (this.backgroundNode = new re()),
      this.backgroundNode.drawRoundedRect(0, 0, this.width, this.height, 3, {
        r: 0,
        g: 0,
        b: 0,
      }),
      this.backgroundNode.setAlpha(0.3),
      (this.barNode = new re()),
      this.addAttachment(this.backgroundNode),
      this.addAttachment(this.barNode),
      this.setPivotPoint(this.width / 2, -80),
      this.setMaxHealth(100),
      this.setHealth(100);
  }
  setSize(t, e) {
    var r = this.percent;
    (this.width = t),
      (this.height = e),
      (this.percent = null),
      this.backgroundNode.clear(),
      this.backgroundNode.drawRoundedRect(0, 0, this.width, this.height, 3, {
        r: 0,
        g: 0,
        b: 0,
      }),
      this.setPivotPoint(this.width / 2, -80),
      this.setPercent(r);
  }
  setHealth(t) {
    (this.health = t), this.setPercent(this.health / this.maxHealth);
  }
  setMaxHealth(t) {
    (this.maxHealth = t), this.setPercent(this.health / this.maxHealth);
  }
  setPercent(t) {
    if (
      this.percent !== t &&
      ((this.percent = t), this.barNode.clear(), 0 !== this.health)
    ) {
      var e = (this.width - 2) * this.percent;
      this.barNode.drawRoundedRect(2, 2, e, this.height - 2, 2, this.barColor);
    }
  }
  update(t, e) {
    this.getParent(),
      e &&
        (this.setHealth(e.zombieShieldHealth),
        this.setMaxHealth(e.zombieShieldMaxHealth)),
      this.setRotation(-this.getParent().getParent().getRotation()),
      super.update(t, e);
  }
}
class oe extends Jt {
  constructor(t, e = !1) {
    super();
    const r = Lt.get(t);
    e
      ? ((r.source.scaleMode = "nearest"), (this.sprite = new Wt(r)))
      : (this.sprite = new Ht.j(r)),
      (this.sprite.anchor.x = 0.5),
      (this.sprite.anchor.y = 0.5),
      this.setNode(this.sprite);
  }
  getAnchor() {
    return this.sprite.anchor;
  }
  setAnchor(t, e) {
    (this.sprite.anchor.x = t), (this.sprite.anchor.y = e);
  }
  getTint() {
    return this.node.tint;
  }
  setTint(t) {
    this.node.tint = t;
  }
  getBlendMode() {
    return this.node.tint;
  }
  setBlendMode(t) {
    this.node.blendMode = t;
  }
  getMask() {
    return this.node.mask;
  }
  setMask(t) {
    this.node.mask = t.getNode();
  }
  setDimensions(t, e, r, n) {
    (this.sprite.x = t),
      (this.sprite.y = e),
      (this.sprite.width = r),
      (this.sprite.height = n);
  }
  setParent(t) {
    super.setParent(t), null == t && this.sprite.destroy();
  }
}
