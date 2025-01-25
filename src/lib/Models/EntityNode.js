import EntityModels from "./EntityModels.js";
import Node from "./Node.js";

export default class extends Node {
  constructor(game, t) {
    super(game);

    this.uid = t.uid;
    this.setVisible(true);
    this.fromTick = {};
    this.targetTick = {
      firingTick: 0,
      lastDamagedTick: 0,
      position: {
        x: 0,
        y: 0,
      },
      yaw: 0,
    };
    this.setTargetTick(t);
    this.fromTick = this.targetTick;
    this.hasRunTick = false;
  }
  reset() {
    this.uid = 0;
    this.currentModel = this.entityClass = this.fromTick = this.targetTick = null;
    this.setVisible(true);
  }
  isLocal() {
    return this.uid == this.game.renderer.world.getLocalPlayer();
  }
  getTargetTick() {
    return this.targetTick;
  }
  getFromTick() {
    return this.fromTick;
  }
  setTargetTick(t) {
    void 0 !== this.targetTick.lastPlayerDamages &&
      null == t.lastPlayerDamages &&
      (t.lastPlayerDamages = []);
    void 0 !== this.targetTick.hits && null == t.hits && (t.hits = []);
    this.addMissingTickFields(t, this.targetTick);
    if (void 0 !== t.shortPosition) {
      t.position = {
        x: this.targetTick.position.x + t.shortPosition.x,
        y: this.targetTick.position.y + t.shortPosition.y,
      };
      delete t.shortPosition;
    }
    this.fromTick = this.targetTick;
    this.targetTick = t;
    void 0 !== t.scale && this.setScale(t.scale);
    this.fromTick.model !== this.targetTick.model && this.refreshModel();
    this.targetTick.entityClass !== this.entityClass &&
      (this.entityClass = this.targetTick.entityClass);

    this.isLocal() && this.game.ui.setPlayerTick(this.targetTick);

    /*
    if (
    "Harvester" == this.targetTick.model &&
      "Harvester" == this.game.ui.components.uiBuildingOverlay.buildingId) {
      if (
        this.targetTick.targetResourceUid !== this.fromTick.targetResourceUid) {
        this.game.ui.components.uiBuildingOverlay.shouldUpdateRanges = true;
        this.game.ui.components.uiBuildingOverlay.update();
        };
      this.targetTick.droneCount !== this.fromTick.droneCount &&
        this.game.ui.components.uiBuildingOverlay.updateText()
    };
    */
  }
  tick(t, e) {
    if (!this.fromTick) return;
    const r = t / e;
    this.isVisible || this.setVisible(true);
    this.setPositionX(
      this.game.util.lerp(this.fromTick.position?.x, this.targetTick.position?.x, r),
    );
    this.setPositionY(
      this.game.util.lerp(this.fromTick.position?.y, this.targetTick.position?.y, r),
    );
    true !== this.currentModel?.rotationLocked &&
      this.setRotation(
        this.game.util.interpolateYaw(this.fromTick.yaw, this.targetTick.yaw),
      );
  }
  update(t) {
    this.currentModel && this.currentModel.update(t, this.fromTick);
  }
  refreshModel() {
    let t = this.targetTick.model,
      e = t;
    if (!(t in EntityModels))
      switch (t) {
        case "Tree1":
        case "Tree2":
        case "Stone1":
        case "Stone2":
          e = "Resource";
          break;
        case "MageProjectile":
        case "ArrowProjectile":
        case "CannonProjectile":
        case "BombProjectile":
          e = "Projectile";
          break;
        default:
          return console.log(
            `Model ${t} could not be found.\n${JSON.stringify(this.targetTick)}`,
          );
      }
    if (!EntityModels[e]) return;
    this.currentModel = new EntityModels[e](this.game, this.targetTick);
    this.currentModel.modelName = e;
    this.currentModel.setParent(this);
    this.setNode(this.currentModel.getNode());
  }
  addMissingTickFields(t, e) {
    for (var r in e) {
      var n = e[r];
      null == t[r] && (t[r] = n);
    }
  }
}
