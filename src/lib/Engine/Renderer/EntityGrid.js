export default class {
  constructor(game, t, e) {
    this.cellEntities = [];
    this.entityMap = {};
    this.cellSize = 48;
    this.columns = t / this.cellSize;
    this.rows = e / this.cellSize;
    this.totalCells = this.columns * this.rows;
    this.entityData = {};
    for (let t = 0; t < this.totalCells; t++) this.cellEntities[t] = {};
    game.eventEmitter.on("EntityDataRpcReceived", this.onEntityData.bind(this));
  }
  getEntitiesInCell(t) {
    return t in this.cellEntities && this.cellEntities[t];
  }
  onEntityData(t) {
    this.entityData = JSON.parse(t.json);
  }
  updateEntity(t) {
    const e = {
        width: 1,
        height: 1,
      },
      r = t.getTargetTick();
    if (r && "model" in r) {
      let t = this.entityData[r.model];
      void 0 === t &&
        "Resource" === r.entityClass &&
        (t = this.entityData[r.resourceType]);
      void 0 !== t &&
        "gridWidth" in t &&
        "gridHeight" in t &&
        ((e.width = t.gridWidth),
        (e.height = t.gridHeight),
        (90 != r.yaw && 270 != r.yaw) ||
          ((e.width = t.gridHeight), (e.height = t.gridWidth)));
    }
    const n = this.getCellIndices(t.getPositionX(), t.getPositionY(), e);
    if (!(t.uid in this.entityMap)) return this.addEntityToCells(t.uid, n);
    (this.entityMap[t.uid].length !== n.length ||
      !this.entityMap[t.uid].every((t, e) => t === n[e])) &&
      (this.removeEntityFromCells(t.uid, this.entityMap[t.uid]),
      this.addEntityToCells(t.uid, n));
  }
  removeEntity(t) {
    this.removeEntityFromCells(t, this.entityMap[t]);
  }
  getCellIndices(t, e, r) {
    const n = [];
    for (let i = -r.width / 2 + 0.5; i < r.width / 2; i++)
      for (let o = -r.height / 2 + 0.5; o < r.height / 2; o++) {
        const r =
          this.columns * Math.floor(e / this.cellSize + o) +
          Math.floor(t / this.cellSize + i);
        n.push(r >= 0 && r < this.totalCells && r);
      }
    return n;
  }
  getCellCoords(t) {
    return {
      x: t % this.columns,
      y: Math.floor(t / this.columns),
    };
  }
  removeEntityFromCells(t, e) {
    if (e)
      if (e.length > 1) for (const r in e) e[r] && delete this.cellEntities[e[r]][t];
      else e[0] && delete this.cellEntities[e[0]][t];
    delete this.entityMap[t];
  }
  addEntityToCells(t, e) {
    if (e.length > 1) for (const r in e) e[r] && (this.cellEntities[e[r]][t] = !0);
    else e[0] && (this.cellEntities[e[0]][t] = !0);
    this.entityMap[t] = e;
  }
}
