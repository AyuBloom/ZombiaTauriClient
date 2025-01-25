import { Graphics } from "pixi.js";
import Node from "./Node";

export default class extends Node {
  constructor(game) {
    super(game);
    this.draw = new Graphics();
    this.clear();
    this.setNode(this.draw);
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
  clear() {
    this.draw.clear();
  }
  setParent(t) {
    super.setParent(t), null == t && this.draw.destroy();
  }
}
