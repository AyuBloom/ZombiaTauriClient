import EntityModels from "$lib/Models/EntityModels";
import RangeModel from "$lib/Models/RangeModel";
import SpriteNode from "$lib/Models/SpriteNode";
import TextNode from "$lib/Models/TextNode";
import TintModel from "$lib/Models/TintModel";

export default class {
  constructor(game) {
    this.game = game;

    this.placeholderTints = [];
    this.borderTints = [];
    this.direction = 0;
    this.disableDirection = true;
    this.placeholderEntity = null;
    this.buildingRangeIndicator = null;
    this.placeholderText = new TextNode(this.game, "Press R to rotate...", {
      fontFamily: "Hammersmith One",
      fontSize: 16,
      strokeWidth: 3,
    });
    this.placeholderText.setAnchor(0.5, 0.5);
    this.placeholderText.setColor(220, 220, 220);
    this.placeholderText.setFontWeight("bold");
    this.placeholderText.setLetterSpacing(1);
    this.placeholderText.setAlpha(0);
    this.placeholderText.setPosition(-1e3, -1e3);
  }
  init() {
    this.game.renderer.uiLayer.addAttachment(this.placeholderText);
    this.game.eventEmitter.on("82Up", this.cycleDirection.bind(this));
    this.game.eventEmitter.on("EnterWorldResponse", this.onEnterWorld.bind(this));
    this.game.eventEmitter.on("CameraUpdate", this.update.bind(this));
    this.game.eventEmitter.on("DeadRpcReceived", this.onDead.bind(this));
    this.game.eventEmitter.on("27Up", this.cancelPlacing.bind(this));
    this.game.eventEmitter.on("BuildingsUpdated", this.onBuildingData.bind(this));
  }
  onBuildingData(t) {
    for (let e in t) {
      const r = t[e];
      if (
        r.type == this.buildingType &&
        this.game.ui.buildingData[r.type].built >= this.game.ui.buildingData[r.type].limit
      )
        this.cancelPlacing();
    }
  }
  onEnterWorld(t) {
    this.cancelPlacing();
    this.minWallDistance = t.minimumBuildDistanceFromWall;
    this.maxFactoryDistance = t.maxFactoryBuildDistance;
    this.maxPlayerDistance = t.maxPlayerBuildDistance;
  }
  cycleDirection() {
    if (!0 !== this.disableDirection && null !== this.placeholderEntity) {
      this.direction = (this.direction + 1) % 4;
      this.placeholderEntity.setRotation(90 * this.direction);
      this.update();
    }
  }
  onDead() {
    this.cancelPlacing();
  }
  startPlacing(t) {
    this.buildingType && this.cancelPlacing();
    // this.game.ui.components.uiBuildingOverlay.stopWatching(),
    this.buildingType = t;
    const e = this.game.ui.buildingData[t];

    if (["SawTower", "Harvester"].includes(this.buildingType)) {
      this.disableDirection = false;
      this.placeholderText.setAlpha(0.75);
      this.placeholderText.setPosition(-1e3, -1e3);
    } else {
      this.disableDirection = true;
      this.direction = 0;
      this.placeholderText.setAlpha(0);
      this.placeholderText.setPosition(-1e3, -1e3);
    }
    const r = this.game.renderer.world.entityGrid.cellSize,
      n = e.gridWidth * e.gridHeight;
    if (EntityModels[t]) {
      this.placeholderEntity = new SpriteNode(
        this.game,
        `./static/images/Ui/Buildings/${t}/${t}Tier1.svg`,
      );
      this.placeholderEntity.setAlpha(0.5);
      this.placeholderEntity.setRotation(90 * this.direction);
      this.game.renderer.uiLayer.addAttachment(this.placeholderEntity);
    }
    for (let t = 0; t < n; t++) {
      this.placeholderTints[t] = new TintModel(this.game, {
        width: r,
        height: r,
      });
      this.game.renderer.uiLayer.addAttachment(this.placeholderTints[t]);
    }
    this.buildingRangeIndicator = new RangeModel(this.game, {
      width: this.maxFactoryDistance * r * 2,
      height: this.maxFactoryDistance * r * 2,
      fill: {
        r: 0,
        b: 0,
        g: 0,
      },
      lineFill: {
        r: 255,
        b: 0,
        g: 0,
      },
      lineWidth: 12,
    });
    this.game.renderer.groundLayer.addAttachment(this.buildingRangeIndicator);
    const i = this.game.renderer.worldSize.x / r,
      o = this.game.renderer.worldSize.y / r;
    for (let t = 0; t < 4; t++) {
      const e = this.minWallDistance / 2;
      if (0 == t || 1 == t) {
        this.borderTints[t] = new TintModel(this.game, {
          width: r * this.minWallDistance,
          height: r * o,
        });
      } else if (2 == t || 3 == t) {
        this.borderTints[t] = new TintModel(this.game, {
          width: r * (i - 2 * this.minWallDistance),
          height: r * this.minWallDistance,
        });
      }
      this.game.renderer.groundLayer.addAttachment(this.borderTints[t]);
      0 == t
        ? this.borderTints[t].setPosition(r * e, r * (o / 2))
        : 1 == t
          ? this.borderTints[t].setPosition(r * (i - e), r * (o / 2))
          : 2 == t
            ? this.borderTints[t].setPosition(r * (i / 2), r * e)
            : 3 == t && this.borderTints[t].setPosition(r * (i / 2), r * (o - e));
      this.borderTints[t].setIsOccupied(true);
    }
    this.update();
  }
  update() {
    if (!this.buildingType) return;

    const t = this.game.ui.buildingData[this.buildingType],
      e = this.game.ui.mousePosition,
      r = this.game.renderer.world,
      n = this.game.renderer.screenToWorld(e.x, e.y);

    let i = t.gridWidth,
      o = t.gridHeight;

    (1 != this.direction && 3 != this.direction) ||
      ((i = t.gridHeight), (o = t.gridWidth));

    const s = r.entityGrid.getCellIndices(n.x, n.y, {
        width: i,
        height: o,
      }),
      a = r.entityGrid.cellSize;
    let c = {
      x: 0,
      y: 0,
    };
    for (let t in s) {
      if (!s[t]) {
        this.placeholderTints[t].setVisible(!1);
        continue;
      }
      const e = r.entityGrid.getCellCoords(s[t]);
      let n = {
        x: e.x * a + a / 2,
        y: e.y * a + a / 2,
      };
      const i = this.game.renderer.worldToUi(n.x, n.y),
        o = this.checkIsOccupied(s[t], e);
      this.placeholderTints[t].setPosition(i.x, i.y);
      this.placeholderTints[t].setIsOccupied(o);
      this.placeholderTints[t].setVisible(true);
      (c.x += e.x), (c.y += e.y);
    }
    (c.x = c.x / s.length), (c.y = c.y / s.length);
    let l = {
        x: c.x * a + a / 2,
        y: c.y * a + a / 2,
      },
      u = this.game.ui.factory?.x,
      h = this.game.ui.factory?.y;
    null == this.game.ui.factory && ((u = l.x), (h = l.y));
    this.buildingRangeIndicator.setPosition(u, h);
    const f = this.game.renderer.worldToUi(l.x, l.y);
    if (null !== this.placeholderEntity) {
      this.placeholderEntity.setPosition(f.x, f.y);
      this.placeholderText.setPosition(f.x, f.y - 110);
    }
  }
  checkIsOccupied(t, e) {
    const r = this.game.renderer.world,
      n = r.entityGrid.cellSize,
      i = r.entityGrid.getEntitiesInCell(t),
      o = e.x * n + n / 2,
      s = e.y * n + n / 2;
    if (!i) return true;
    for (const t in i) {
      const e = r.entities[parseInt(t)];
      if (!e) continue;
      const n = e.getTargetTick();
      if (n && "HarvesterDrone" != n.model && "Projectile" !== n.entityClass) return true;
    }
    const a = Math.min(e.x, r.entityGrid.columns - 1 - e.x),
      c = Math.min(e.y, r.entityGrid.rows - 1 - e.y);
    if (a < this.minWallDistance || c < this.minWallDistance) return true;
    if (r.getLocalPlayer()) {
      const t = r.entities[r.getLocalPlayer()];
      if (t) {
        const e = Math.abs(t.getPositionX() - o) / n,
          r = Math.abs(t.getPositionY() - s) / n;
        if (e > this.maxPlayerDistance || r > this.maxPlayerDistance) return !0;
      }
    }
    if (null !== this.game.ui.factory && "Harvester" !== this.buildingType) {
      const t = Math.abs(this.game.ui.factory.x - o) / n,
        e = Math.abs(this.game.ui.factory.y - s) / n;
      if (t > this.maxFactoryDistance || e > this.maxFactoryDistance) return true;
    }
    return !1;
  }
  cancelPlacing() {
    if (this.buildingType) {
      this.game.renderer.uiLayer.removeAttachment(this.placeholderEntity);
      for (let t in this.placeholderTints)
        this.game.renderer.uiLayer.removeAttachment(this.placeholderTints[t]);
      for (let t in this.borderTints)
        this.game.renderer.groundLayer.removeAttachment(this.borderTints[t]);
      if (this.buildingRangeIndicator) {
        this.game.renderer.groundLayer.removeAttachment(this.buildingRangeIndicator);
        delete this.buildingRangeIndicator;
      }
      this.placeholderText.setAlpha(0);
      this.placeholderText.setPosition(-1e3, -1e3);
      this.placeholderEntity = null;
      this.placeholderTints = [];
      this.borderTints = [];
      this.buildingType = null;
    }
  }
  placeBuilding() {
    if (!this.buildingType) return;
    const t = this.game.renderer.world.getLocalPlayer();
    if (!t) return false;
    if (!this.game.renderer.world.entities[t]) return false;
    const e = this.game.ui.buildingData[this.buildingType],
      r = this.game.ui.mousePosition,
      n = this.game.renderer.world,
      i = this.game.renderer.screenToWorld(r.x, r.y);
    let o = e.gridWidth,
      s = e.gridHeight;
    (1 != this.direction && 3 != this.direction) ||
      ((o = e.gridHeight), (s = e.gridWidth));
    const a = n.entityGrid.getCellIndices(i.x, i.y, {
        width: o,
        height: s,
      }),
      c = n.entityGrid.cellSize;
    let l = {
      x: 0,
      y: 0,
    };
    for (let t in a) {
      if (!a[t]) return false;
      const e = n.entityGrid.getCellCoords(a[t]);
      (l.x += e.x), (l.y += e.y);
    }
    (l.x /= a.length), (l.y /= a.length);
    let u = {
      x: l.x * c + c / 2,
      y: l.y * c + c / 2,
    };
    const packet = {
      name: "PlaceBuilding",
      x: u.x,
      y: u.y,
      type: this.buildingType,
      yaw: 90 * this.direction,
    };
    this.game.network.sendRpc(packet);
    return true;
  }
  isActive() {
    return !!this.buildingType;
  }
}
