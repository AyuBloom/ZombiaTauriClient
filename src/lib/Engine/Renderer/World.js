import EntityNode from "$lib/Models/EntityNode.js";
import EntityGrid from "./EntityGrid.js";

export default class {
  constructor(game) {
    this.game = game;
    this.entities = {};
    this.localPlayer = null;
  }
  init() {
    this.game.eventEmitter.on("EnterWorldResponse", this.onEnterWorld.bind(this));
    this.game.eventEmitter.on("RendererUpdated", this.onRendererTick.bind(this));
    this.game.renderer.replicator.setTargetTickUpdatedCallback(
      this.updateEntities.bind(this),
    );
  }
  onServerDesync() {
    for (let t in this.entities) this.removeEntity(t, false);
    this.entities = {};
    console.log("Server desynced, world has removed all entities.");
  }
  onEnterWorld(t) {
    for (let t in this.entities) this.removeEntity(t, !1);
    this.entities = {};
    this.localPlayer = t.uid;
    this.entityGrid = new EntityGrid(this.game, t.x, t.y);
  }
  onRendererTick(t) {
    if (0 == this.game.network.connected) return;
    const e = this.game.renderer.replicator.getMsInThisTick();
    for (const t of Object.values(this.entities))
      t.tick(e, this.game.renderer.replicator.msPerTick);
  }
  updateEntities(t) {
    for (let e in this.entities)
      e in t
        ? !0 !== t[e]
          ? this.updateEntity(t[e], e)
          : this.updateEntity({}, e, !0)
        : this.removeEntity(e);
    for (let e in t) !0 !== t[e] && (e in this.entities || this.createEntity(t[e]));
  }
  createEntity(t) {
    let e = new EntityNode(this.game, t);
    t.uid === this.localPlayer && (this.game.renderer.followingObject = e),
      (this.entities[e.uid] = e),
      this.game.renderer.add(e, t.entityClass),
      this.entityGrid.updateEntity(this.entities[e.uid]);
  }
  removeEntity(t, e = true) {
    if (this.entities[t].entityClass == "Resource") return;

    this.game.renderer.remove(this.entities[t], e),
      delete this.entities[t],
      this.entityGrid.removeEntity(parseInt(t));
  }
  updateEntity(t, e, r = false) {
    true === r
      ? this.entities[e].hasRunTick ||
        ((this.entities[e].hasRunTick = !0), this.entities[e].setTargetTick(t, r))
      : ((this.entities[e].hasRunTick = !1), this.entities[e].setTargetTick(t, r)),
      this.entityGrid.updateEntity(this.entities[e]);
  }
  getLocalPlayer() {
    return this.localPlayer;
  }
}
