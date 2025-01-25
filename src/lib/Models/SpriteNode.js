import { Assets, TilingSprite, Sprite } from "pixi.js";
import Node from "./Node.js";

export default class extends Node {
  constructor(game, t, tiled = false) {
    super(game);

    const r = Assets.get(t);

    if (tiled) {
      r.source.scaleMode = "nearest";
      this.sprite = new TilingSprite(r);
    } else {
      this.sprite = new Sprite(r);
    }

    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;

    this.setNode(this.sprite);
  }
  getAnchor() {
    return this.sprite.anchor;
  }
  setAnchor(t, e) {
    this.sprite.anchor.x = t;
    this.sprite.anchor.y = e;
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
    this.sprite.x = t;
    this.sprite.y = e;
    this.sprite.width = r;
    this.sprite.height = n;
  }
  setParent(t) {
    super.setParent(t), null == t && this.sprite.destroy();
  }
}
