import GraphicsNode from "./GraphicsNode.js";
import Node from "./Node.js";

export default class extends Node {
  constructor(game, t = null) {
    super(game),
      (this.barColor = t || {
        r: 180,
        g: 0,
        b: 10,
      }),
      (this.width = 84),
      (this.height = 12),
      (this.backgroundNode = new GraphicsNode()),
      this.backgroundNode.drawRoundedRect(0, 0, this.width, this.height, 3, {
        r: 0,
        g: 0,
        b: 0,
      }),
      this.backgroundNode.setAlpha(0.3),
      (this.barNode = new GraphicsNode()),
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
      this.setRotation(-this.getParent()?.getParent().getRotation()),
      super.update(t, e);
  }
}
