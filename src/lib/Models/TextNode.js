import { Text } from "pixi.js";
import Node from "./Node.js";

export default class extends Node {
  constructor(game, t, e) {
    super(game);
    this.text = new Text({
      text: t,
      style: {
        fontFamily: e.fontFamily,
        fontSize: e.fontSize,
        lineJoin: "round",
        padding: 10,
        stroke: {
          color: "#333333",
          width: e.strokeWidth,
          join: "round",
        },
      },
    });
    this.text.resolution = 2 * window.devicePixelRatio;
    this.setNode(this.text);
  }
  setColor(t, e, r) {
    this.text.style.fill = (t << 16) | (e << 8) | r;
  }
  setFontWeight(t) {
    this.text.style.fontWeight = t;
  }
  setLetterSpacing(t) {
    this.text.style.letterSpacing = t;
  }
  setAnchor(t, e) {
    this.text.anchor.set(t, e);
  }
  setString(t) {
    this.text.text = t;
  }
  getString() {
    return this.text.text;
  }
}
