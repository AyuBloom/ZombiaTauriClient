import { Container } from "pixi.js";

export default class {
  constructor(game, t = null) {
    this.game = game;
    this.attachments = [];
    this.parent = null;
    this.isVisible = !0;
    this.setNode(t || new Container());
  }
  getNode() {
    return this.node;
  }
  setNode(t) {
    this.node = t;
  }
  getParent() {
    return this.parent;
  }
  setParent(t) {
    if (null == t) {
      if (void 0 !== this.currentModel) {
        this.currentModel.removedParentFunction?.();
        for (const t of this.currentModel.attachments) t.setParent(null);
      }
      for (const t of this.attachments) t.setParent(null);
    }
    this.parent = t;
  }
  getAttachments() {
    return this.attachments;
  }
  addAttachment(t, e = 0) {
    (t.getNode().zIndex = e),
      t.setParent(this),
      this.node.addChild(t.getNode()),
      this.attachments.push(t),
      this.node.children.sort((t, e) =>
        t.zIndex == e.zIndex ? 0 : t.zIndex < e.zIndex ? -1 : 1,
      );
  }
  removeAttachment(t) {
    t &&
      (this.node.removeChild(t.getNode()),
      t.setParent(null),
      this.attachments.indexOf(t) > -1 &&
        this.attachments.splice(this.attachments.indexOf(t), 1));
  }
  getRotation() {
    return (180 * this.node.rotation) / Math.PI;
  }
  setRotation(t) {
    this.node.rotation = (t * Math.PI) / 180;
  }
  getAlpha() {
    return this.node.alpha;
  }
  setAlpha(t) {
    this.node.alpha !== t && (this.node.alpha = t);
  }
  setSize(w, h) {
    this.node.setSize(w, h);
  }
  getScale() {
    return this.node.scale;
  }
  setScale(t) {
    (this.node.scale.x = t), (this.node.scale.y = t);
  }
  getScaleX() {
    return this.node.scale.x;
  }
  setScaleX(t) {
    this.node.scale.x = t;
  }
  getScaleY() {
    return this.node.scale.y;
  }
  setScaleY(t) {
    this.node.scale.y = t;
  }
  getFilters() {
    return this.node.filters;
  }
  setFilters(t) {
    this.node.filters = t;
  }
  getPosition() {
    return this.node.position;
  }
  setPosition(t, e) {
    this.node.position.x !== t && (this.node.position.x = t),
      this.node.position.y !== e && (this.node.position.y = e);
  }
  getPositionX() {
    return this.node.position.x;
  }
  setPositionX(t) {
    this.node.position.x !== t && (this.node.position.x = t);
  }
  getPositionY() {
    return this.node.position.y;
  }
  setPositionY(t) {
    this.node.position.y !== t && (this.node.position.y = t);
  }
  getPivotPoint() {
    return this.node.pivot;
  }
  setPivotPoint(t, e) {
    (this.node.pivot.x = t), (this.node.pivot.y = e);
  }
  getVisible() {
    return this.isVisible;
  }
  setVisible(t) {
    (this.isVisible = t), (this.node.visible = t);
  }
  update(t, e) {
    for (const r of this.attachments) r.update(t, e);
  }
}
