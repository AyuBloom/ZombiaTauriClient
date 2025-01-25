import GraphicsNode from "./GraphicsNode";
import Model from "./Model";

export default class extends Model {
  constructor(game, t) {
    super(game);
    this.goldRegion = new GraphicsNode(this.game);
    this.goldRegion.setAlpha(0.1);
    this.goldRegion.setRotation(-90);
    t.isTriangular
      ? this.goldRegion.drawTriangle(
          {
            x: 0,
            y: 0,
          },
          {
            x: t.range,
            y: -t.maxYawDeviation,
          },
          {
            x: t.range,
            y: t.maxYawDeviation,
          },
          t.fill || {
            r: 200,
            g: 160,
            b: 0,
          },
          t.lineFill || {
            r: 255,
            g: 200,
            b: 0,
          },
          8,
        )
      : t.isCircular
        ? this.goldRegion.drawCircle(
            0,
            0,
            t.radius,
            t.fill || {
              r: 200,
              g: 160,
              b: 0,
            },
            t.lineFill || {
              r: 255,
              g: 200,
              b: 0,
            },
            8,
          )
        : this.goldRegion.drawRect(
            -t.width / 2,
            -t.height / 2,
            t.width / 2,
            t.height / 2,
            t.fill || {
              r: 200,
              g: 160,
              b: 0,
            },
            t.lineFill || {
              r: 255,
              g: 200,
              b: 0,
            },
            t.lineWidth || 8,
          );
    this.addAttachment(this.goldRegion);
  }
}
