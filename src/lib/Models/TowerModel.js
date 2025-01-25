import GraphicsNode from "./GraphicsNode";
import HealthBarModel from "./HealthBarModel";
import Model from "./Model";
import SpriteNode from "./SpriteNode";

export default class extends Model {
  constructor(game, t) {
    super(game);
    this.type = t;

    this.healthBar = new HealthBarModel(this.game);
    this.healthBar.setSize(82, 16);
    this.healthBar.setPivotPoint(41, -25);
    this.healthBar.setVisible(false);
    this.addAttachment(this.healthBar, 100);

    this.lastYaw = 0;
  }
  update(t, e) {
    if (e) {
      this.updateModel(e.tier);
      this.updateHealthBar(e);
      this.head?.setRotation(e.aimingYaw);
    }
    super.update(t, e);
  }
  updateModel(t = 1) {
    if (t != this.currentTier) {
      this.currentTier = t;
      this.removeAttachment(this.base);
      this.removeAttachment(this.head);
      if (![1, 2, 3, 4, 5, 6, 7, 8].includes(t)) {
        throw new Error(`Unknown tier encountered for ${this.type} tower: ${t}`);
      }
      this.base = new SpriteNode(
        this.game,
        `./static/images/Entity/${this.type}/${this.type}Tier${t}Base.svg`,
      );
      this.head = new SpriteNode(
        this.game,
        `./static/images/Entity/${this.type}/${this.type}Tier${t}Head.svg`,
      );
      this.addAttachment(this.base, 2), this.addAttachment(this.head, 3);
    }
  }
  updateHealthBar(t) {
    this.healthBar.setVisible(t.health !== t.maxHealth);
  }
}
