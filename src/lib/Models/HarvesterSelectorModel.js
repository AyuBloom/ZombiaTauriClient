import GraphicsNode from "./GraphicsNode";
import Model from "./Model";

export default class extends Model {
  constructor(game, t) {
    super(game);

    this.circleRegion = new GraphicsNode(this.game);
    this.circleRegion.setAlpha(0.1);
    this.addAttachment(this.circleRegion);

    this.args = t;

    this.minRadius = t.radius - 10;
    this.maxRadius = t.radius + 10;
    this.currentRadius = this.minRadius;

    this.increasingSize = true;
  }
  update(t, e) {
    super.update(t, e);
    0 != this.isVisible &&
      (this.circleRegion.clear(),
      1 == this.increasingSize
        ? this.currentRadius >= this.maxRadius
          ? (this.increasingSize = !1)
          : (this.currentRadius += 0.2)
        : this.currentRadius <= this.minRadius
          ? (this.increasingSize = !0)
          : (this.currentRadius -= 0.2),
      this.circleRegion.drawCircle(
        0,
        0,
        this.currentRadius,
        this.args.fill || {
          r: 255,
          g: 255,
          b: 255,
          a: 0,
        },
        this.args.lineFill || {
          r: 255,
          g: 255,
          b: 255,
        },
        this.args.lineWidth || 8,
      ));
  }
}
