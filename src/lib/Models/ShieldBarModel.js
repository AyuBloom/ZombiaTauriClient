import GraphicsNode from "./GraphicsNode";
import Node from "./Node";

export default class extends Node {
  constructor(game) {
    super(game),
      (this.barColor = {
        r: 61,
        g: 161,
        b: 217,
      }),
      (this.width = 76),
      (this.height = 8),
      (this.percent = 1),
      (this.backgroundNode = new GraphicsNode()),
      this.backgroundNode.drawRoundedRect(0, 0, this.width, this.height, 3, {
        r: 0,
        g: 0,
        b: 0,
      }),
      this.backgroundNode.setAlpha(0.3),
      (this.barNode = new GraphicsNode()),
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
    e &&
      (this.setHealth(e.zombieShieldHealth), this.setMaxHealth(e.zombieShieldMaxHealth)),
      this.setRotation(-this.getParent()?.getParent().getRotation()),
      super.update(t, e);
  }
}
