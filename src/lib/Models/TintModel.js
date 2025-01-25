import GraphicsNode from "./GraphicsNode";
import Model from "./Model";

export default class extends Model {
  constructor(game, t) {
    super(game);
    this.isOccupied = false;
    this.redSquare = new GraphicsNode(this.game);
    this.redSquare.drawRect(-t.width / 2, -t.height / 2, t.width / 2, t.height / 2, {
      r: 255,
      g: 0,
      b: 0,
    });
    this.redSquare.setAlpha(0.2);
    this.redSquare.setVisible(false);
    this.addAttachment(this.redSquare);
  }
  setIsOccupied(t) {
    this.redSquare.setVisible((this.isOccupied = t));
  }
}
