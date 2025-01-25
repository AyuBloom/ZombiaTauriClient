import Model from "./Model";
import PlayerModel from "./PlayerModel";
import ShieldBarModel from "./ShieldBarModel";
import HealthBarModel from "./HealthBarModel";

import SpriteNode from "./SpriteNode";
import TextNode from "./TextNode";
import TowerModel from "./TowerModel";
import GraphicsNode from "./GraphicsNode";

export default {
  Player: class extends PlayerModel {
    constructor(game) {
      super(game);
      (this.base = new SpriteNode(this.game, "./static/images/Entity/Player/Player.svg")),
        this.addAttachment(this.base, 2),
        (this.nameEntity = new TextNode(this.game, "Player", {
          fontFamily: "Hammersmith One",
          fontSize: 24,
          strokeWidth: 6,
        })),
        this.nameEntity.setAnchor(0.4, 0.45),
        this.nameEntity.setPivotPoint(0, 70),
        this.nameEntity.setColor(220, 220, 220),
        this.nameEntity.setFontWeight("bold"),
        this.nameEntity.setLetterSpacing(1),
        this.addAttachment(this.nameEntity, 0),
        (this.healthBar = new HealthBarModel(this.game)),
        this.addAttachment(this.healthBar, 0),
        (this.shieldBar = new ShieldBarModel(this.game)),
        this.addAttachment(this.shieldBar, 0),
        this.shieldBar.setVisible(false),
        (this.rotationLocked = true),
        (this.nameFiltered = void 0),
        (this.invulnerabilityAnimationProps = {
          isForward: true,
          elapsedTime: 0,
          animationDuration: 750,
        });
    }
    update(t, e) {
      const r = this.getParent();
      if (e) {
        if (r.isLocal()) {
          if (true !== r.getTargetTick().dead) {
            // 0 == this.game.network.inputPacketManager.inputsLocked &&
            r.getTargetTick().aimingYaw = r.getFromTick().aimingYaw =
              this.game.inputPacketManager.getLastSentYaw();
          }
        }
        if (e.name !== this.lastName) {
          this.lastName = e.name;
          this.nameEntity.setString(e.name);
        }
        if (
          e.weaponName !== this.lastWeaponName ||
          e.weaponTier !== this.lastWeaponTier
        ) {
          this.updateWeapon(e);
        }
        this.healthBar.setVisible(e.health < e.maxHealth);
        if (e.zombieShieldMaxHealth > 0) {
          this.shieldBar.setVisible(e.zombieShieldHealth < e.zombieShieldMaxHealth);
        } else {
          this.shieldBar.setVisible(false);
        }
        void 0 !== e.invulnerable && this.updateInvulnerabilityIndicator(t, e);
      }
      super.update(t, e), this.nameEntity.setRotation(-r.getRotation());
    }
    updateInvulnerabilityIndicator(t, e) {
      if (1 == e.invulnerable) {
        let e = 16752543,
          r = 16777215;
        this.invulnerabilityAnimationProps.elapsedTime += t;
        let n = Math.min(
          this.invulnerabilityAnimationProps.elapsedTime /
            this.invulnerabilityAnimationProps.animationDuration,
          1,
        );
        this.invulnerabilityAnimationProps.isForward || (n = 1 - n);
        const i = (r >> 16) & 255,
          o = (r >> 8) & 255,
          s = 255 & r,
          a =
            ((i + (((e >> 16) & 255) - i) * n) << 16) +
            ((o + (((e >> 8) & 255) - o) * n) << 8) +
            (s + ((255 & e) - s) * n);
        this.base.setTint(a),
          this.weapon.setTint(a),
          (n >= 1 || n <= 0) &&
            ((this.invulnerabilityAnimationProps.isForward =
              !this.invulnerabilityAnimationProps.isForward),
            (this.invulnerabilityAnimationProps.elapsedTime = 0));
      } else this.base.setTint(16777215), this.weapon.setTint(16777215);
    }
    updateAntiClockwiseSwingingWeapon(t = 300, e = 100) {
      return (r, n) => {
        const i = this.game.util.interpolateYaw(
          n.getFromTick().aimingYaw,
          n.getTargetTick().aimingYaw,
        );
        if (
          (this.setRotation(i),
          r.firingTick &&
            (r.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone))
        ) {
          (this.lastFiringTick = r.firingTick), (this.lastFiringAnimationDone = !1);
          var o = this.game.renderer.replicator.getMsSinceTick(r.firingTick),
            s = Math.min(o / t, 1),
            a = Math.sin(s * Math.PI) * e;
          1 === s && (this.lastFiringAnimationDone = !0), this.setRotation(i - a);
        }
      };
    }
    updateBowWeapon(t = 500, e = 250) {
      return (r, n) => {
        const i = this.game.util.interpolateYaw(
          n.getFromTick().aimingYaw,
          n.getTargetTick().aimingYaw,
        );
        if ((this.setRotation(i), r.startChargingTick)) {
          this.lastFiringAnimationDone = false;
          let e = this.game.renderer.replicator.getMsSinceTick(r.startChargingTick),
            n = Math.min(e / t, 1);
          this.bowHands.setPositionY(10 * n);
        } else if (
          r.firingTick &&
          (r.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)
        ) {
          (this.lastFiringTick = r.firingTick), (this.lastFiringAnimationDone = !1);
          const t = this.game.renderer.replicator.getMsSinceTick(r.firingTick),
            n = Math.min(t / e, 1);
          1 === n && (this.lastFiringAnimationDone = !0),
            this.bowHands.setPositionY(10 - 10 * n);
        }
      };
    }
    updateDynamiteWeapon(t = 300, e = 100) {
      return (r, n) => {
        const i = this.game.util.interpolateYaw(
          n.getFromTick().aimingYaw,
          n.getTargetTick().aimingYaw,
        );
        if (
          (this.setRotation(i),
          r.firingTick &&
            (r.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone))
        ) {
          (this.lastFiringTick = r.firingTick), (this.lastFiringAnimationDone = !1);
          var o = this.game.renderer.replicator.getMsSinceTick(r.firingTick),
            s = Math.min(o / t, 1),
            a = Math.sin(s * Math.PI) * e;
          1 === s && (this.lastFiringAnimationDone = !0), this.weapon.setRotation(-a);
        }
      };
    }
    updateWeapon(t) {
      switch (
        ((this.lastWeaponName = t.weaponName),
        (this.lastWeaponTier = t.weaponTier),
        this.removeAttachment(this.weapon),
        this.removeAttachment(this.dormantArm),
        this.removeAttachment(this.bowHands),
        (this.bowHands = null),
        t.weaponName)
      ) {
        case "Pickaxe":
        case "Sword":
          let e = new SpriteNode(
            this.game,
            `./static/images/Entity/Player/Player${t.weaponName}Tier${t.weaponTier}.svg`,
          );
          e.setAnchor(0.5, 0.9),
            (this.weapon = e),
            (this.weaponUpdateFunc = this.updateAntiClockwiseSwingingWeapon(
              this.game.ui.toolData[t.weaponName].msBetweenFires[t.weaponTier - 1],
              100,
            ));
          break;
        case "Crossbow":
          let r = new SpriteNode(
              this.game,
              `./static/images/Entity/Player/PlayerCrossbowTier${t.weaponTier}.svg`,
            ),
            n = new SpriteNode(
              this.game,
              `./static/images/Entity/Player/PlayerCrossbowHandTier${t.weaponTier}.svg`,
            );
          n.setAnchor(1, 1),
            r.setAnchor(0.5, 1),
            (this.weapon = r),
            (this.bowHands = n),
            (this.weaponUpdateFunc = this.updateBowWeapon(
              this.game.ui.toolData[t.weaponName].msBetweenFires[t.weaponTier - 1],
              250,
            ));
          break;
        case "Dynamite":
          let i = new SpriteNode(
            this.game,
            `./static/images/Entity/Player/PlayerDynamiteHandTier${t.weaponTier}.svg`,
          );
          i.setAnchor(0.5, 0.9),
            (this.dormantArm = new SpriteNode(
              this.game,
              "./static/images/Entity/Player/PlayerEmptyDynamiteHand.svg",
            )),
            this.dormantArm.setAnchor(0.5, 1.35),
            this.addAttachment(this.dormantArm, 1),
            (this.weapon = i),
            (this.weaponUpdateFunc = this.updateDynamiteWeapon(250, 75));
          break;
        default:
          throw new Error(`Unknown player weapon: ${t.weaponName}`);
      }
      null !== this.bowHands && this.addAttachment(this.bowHands),
        this.addAttachment(this.weapon, 1);
    }
    updateDamageTint(t) {
      if (1 != t.invulnerable)
        return t.zombieShieldHealth > 0
          ? (this.base.setTint(16777215), void this.weapon.setTint(16777215))
          : void super.updateDamageTint(t);
    }
  },
  Resource: class extends Model {
    constructor(game, t) {
      super(game);
      this.base = new SpriteNode(this.game, `./static/images/Map/${t.model}.svg`);
      this.addAttachment(this.base, 1);
    }
    update(t, e) {
      e &&
        (void 0 !== e.hits && this.updateHit(e),
        Math.round(this.base.getRotation()) !== e.aimingYaw &&
          this.base.setRotation(e.aimingYaw)),
        super.update(t, e);
    }
    updateHit(t) {
      let e = 0,
        r = 0;
      for (let n = 0; n < t.hits.length / 2; n++) {
        const i = t.hits[2 * n + 0],
          o = t.hits[2 * n + 1],
          s = this.game.renderer.replicator.getMsSinceTick(i);
        if (s >= 250) continue;
        const a = Math.min(s / 250, 1),
          c = Math.sin((o * Math.PI) / 180),
          l = -1 * Math.cos((o * Math.PI) / 180);
        (e += 10 * c * Math.sin(a * Math.PI)), (r += 10 * l * Math.sin(a * Math.PI));
      }
      const n = Math.sqrt(e * e + r * r);
      n > 10 && ((e /= n), (r /= n), (e *= 10), (r *= 10)), this.base.setPosition(e, r);
    }
  },
  ArrowTower: class extends TowerModel {
    constructor(game) {
      super(game, "ArrowTower");
    }
  },
  MageTower: class extends TowerModel {
    constructor(game) {
      super(game, "MageTower");
    }
    update(t, e) {
      if ((super.update(t, e), e && e.firingTick)) {
        const t = this.game.renderer.replicator.getMsSinceTick(e.firingTick),
          r = 250,
          n = 0.4,
          i = Math.min(t / r, 1),
          o = 1 + Math.sin(i * Math.PI) * n;
        this.head.setScale(o);
      }
    }
    updateModel(t = 1) {
      if (t != this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          this.removeAttachment(this.head),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(this.currentTier))
        )
          throw new Error(`Unknown tier encountered for ${this.type} tower: ${t}`);
        (this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/${this.type}/${this.type}Tier${t}Base.svg`,
        )),
          (this.head = new SpriteNode(
            this.game,
            `./static/images/Entity/${this.type}/${this.type}Head.svg`,
          )),
          this.addAttachment(this.base, 2),
          this.addAttachment(this.head, 3);
      }
    }
  },
  Factory: class extends Model {
    constructor(game) {
      super(game);

      this.healthBar = new HealthBarModel(this.game);
      this.healthBar.setSize(82, 16);
      this.healthBar.setPivotPoint(41, -25);
      this.healthBar.setVisible(false);
      this.addAttachment(this.healthBar, 3);

      this.currentTier = null;

      this.updateModel();
    }
    update(t, e) {
      if (e) {
        this.updateModel(e.tier);
        this.updateHealthBar(e);
        /*
        e.partyId == this.game.ui.playerTick.partyId &&
          this.game.ui.components.uiBuildingBar.updateBuildingButtons(e)
          */
      }
      super.update(t, e);
    }
    updateModel(t = 1) {
      if (t !== this.currentTier) {
        this.currentTier = t;
        this.removeAttachment(this.base);
        if (![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
          throw new Error(`Unknown tier encountered for factory: ${t}`);
        this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/Factory/FactoryTier${t}Base.svg`,
        );
        this.addAttachment(this.base, 2);
      }
    }
    updateHealthBar(t) {
      this.healthBar.setVisible(t.health !== t.maxHealth);
    }
  },
  Projectile: class extends Model {
    constructor(game, t) {
      super(game);
      this.base = new SpriteNode(
        this.game,
        `./static/images/Entity/Projectile/${t.model}.svg`,
      );
      this.addAttachment(this.base);

      this.hasDeathFadeEffect = true;
      this.deathFadeEffect.fadeOutTime = 150;
      this.deathFadeEffect.maxScaleIncreasePercent = 0.2;
    }
  },
  Harvester: class extends Model {
    constructor(game) {
      super(game);
      this.healthBar = new HealthBarModel(this.game);
      this.healthBar.setSize(82, 16);
      this.healthBar.setPivotPoint(41, -75);
      this.healthBar.setVisible(false);
      this.addAttachment(this.healthBar, 3);
      this.currentTier = null;
      this.updateModel();
    }
    update(t, e) {
      e && (this.updateModel(e.tier), this.updateHealthBar(e));
      super.update(t, e);
    }
    updateModel(t = 1) {
      if (t !== this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for Harvester: ${t}`);
        (this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/Harvester/HarvesterBaseTier${t}.svg`,
        )),
          this.addAttachment(this.base, 2);
      }
    }
    updateHealthBar(t) {
      this.healthBar.setVisible(t.health !== t.maxHealth);
    }
  },
  HarvesterDrone: class extends Model {
    constructor(game) {
      super(game);
      this.healthBar = new HealthBarModel(this.game);
      this.healthBar.setSize(35, 10);
      this.healthBar.setPivotPoint(17.5, -24);
      this.healthBar.setVisible(false);
      this.addAttachment(this.healthBar, 3);
      this.currentTier = null;
      this.currentHarvestStage = void 0;
      this.stageColours = {
        0: "Green",
        1: "Green",
        2: "Red",
        3: "Yellow",
      };
      this.updateModel();
    }
    update(t, e) {
      e &&
        (this.updateModel(e.tier),
        this.updateHealthBar(e),
        void 0 !== e.currentHarvestStage &&
          this.updateHarvestStage(e.currentHarvestStage));
      super.update(t, e);
    }
    updateHarvestStage(t) {
      t != this.currentHarvestStage &&
        ((this.currentHarvestStage = t),
        this.removeAttachment(this.stageIndicator),
        (this.stageIndicator = new SpriteNode(
          this.game,
          `./static/images/Entity/Harvester/HarvesterDrone${this.stageColours[t]}.svg`,
        )),
        this.addAttachment(this.stageIndicator, 3));
    }
    updateModel(t = 1) {
      if (t !== this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for HarvesterDrone: ${t}`);
        (this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/Harvester/HarvesterDroneTier${t}.svg`,
        )),
          this.addAttachment(this.base, 2);
      }
    }
    updateHealthBar(t) {
      this.healthBar.setVisible(t.health !== t.maxHealth);
    }
  },
  DynamiteProjectile: class extends Model {
    constructor(game, t) {
      super(game);
      this.tier = t.tier;
      this.currentRotation = 0;
      this.base = new SpriteNode(
        this.game,
        `./static/images/Entity/Projectile/DynamiteProjectileTier${this.tier}.svg`,
      );
      this.addAttachment(this.base);
    }
    update(t, e) {
      if (e) {
        this.currentRotation += (540 * t) / 1e3;
        this.currentRotation %= 360;
        this.base.setRotation(this.currentRotation);
      }
    }
    onDie() {
      // if (1 == this.game.settings.specialEffectsDisabled) return;
      if (
        this.game.renderer.replicator.getMsSinceTick(
          this.game.renderer.replicator.currentTick.tick,
        ) > 500
      )
        return;
      const t = new GraphicsNode(this.game);
      this.game.renderer.groundLayer.addAttachment(t);
      const e = this.getParent().targetTick.position;
      let r = 0;
      const n =
        this.game.ui.toolData.Dynamite.projectileSplashDamageRange[
          this.getParent().targetTick.tier - 1
        ];
      t.update = (i) => {
        t.draw.clear(),
          t.draw.circle(e.x, e.y, r),
          t.draw.stroke({
            width: 10,
            color: 16777215,
            alpha: 0.1,
          }),
          (r += (n / 200) * i),
          r >= n &&
            (this.game.renderer.groundLayer.removeAttachment(t),
            this.game.renderer.renderingFilters.splice(
              this.game.renderer.renderingFilters.indexOf(t),
              1,
            ));
      };
      this.game.renderer.renderingFilters.push(t);
    }
  },
  RocketProjectile: class extends Model {
    constructor(game, t) {
      super(game);
      this.tier = t.tier;
      this.currentRotation = 0;
      this.base = new SpriteNode(
        this.game,
        "./static/images/Entity/Projectile/RocketProjectile.svg",
      );
      this.addAttachment(this.base);
    }
    onDie() {
      // if (1 == this.game.settings.specialEffectsDisabled) return;
      if (
        this.game.renderer.replicator.getMsSinceTick(
          this.game.renderer.replicator.currentTick.tick,
        ) > 500
      )
        return;

      const t = new GraphicsNode(this.game);
      this.game.renderer.groundLayer.addAttachment(t);

      const e = this.getParent().targetTick.position;
      let r = 0;
      const n = this.game.ui.buildingData.RocketTower.projectileAoeRadius[this.tier - 1];
      t.update = (i) => {
        t.draw.clear(),
          t.draw.circle(e.x, e.y, r),
          t.draw.stroke({
            width: 10,
            color: 16777215,
            alpha: 0.1,
          }),
          (r += (n / 100) * i),
          r >= n &&
            (this.game.renderer.groundLayer.removeAttachment(t),
            this.game.renderer.renderingFilters.splice(
              this.game.renderer.renderingFilters.indexOf(t),
              1,
            ));
      };
      this.game.renderer.renderingFilters.push(t);
    }
  },
  Wall: class extends Model {
    constructor(game) {
      super(game);
      this.healthBar = new HealthBarModel(this.game);
      this.healthBar.setSize(35, 10);
      this.healthBar.setPivotPoint(17.5, -8);
      this.healthBar.setVisible(false);
      this.addAttachment(this.healthBar, 3);
      this.currentTier = null;
      this.updateModel();
    }
    update(t, e) {
      e && (this.updateModel(e.tier), this.updateHealthBar(e));
      super.update(t, e);
    }
    updateModel(t = 1) {
      if (t !== this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for wall: ${t}`);
        this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/Wall/WallTier${t}.svg`,
        );
        this.addAttachment(this.base, 2);
      }
    }
    updateHealthBar(t) {
      this.healthBar.setVisible(t.health !== t.maxHealth);
    }
  },
  LargeWall: class extends Model {
    constructor(game) {
      super(game);
      this.healthBar = new HealthBarModel(this.game);
      this.healthBar.setSize(82, 16);
      this.healthBar.setPivotPoint(41, -25);
      this.healthBar.setVisible(!1);
      this.addAttachment(this.healthBar, 3);
      this.currentTier = null;
      this.updateModel();
    }
    update(t, e) {
      e && (this.updateModel(e.tier), this.updateHealthBar(e));
      super.update(t, e);
    }
    updateModel(t = 1) {
      if (t !== this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for LargeWall: ${t}`);
        this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/LargeWall/LargeWallTier${t}.svg`,
        );
        this.addAttachment(this.base, 2);
      }
    }
    updateHealthBar(t) {
      this.healthBar.setVisible(t.health !== t.maxHealth);
    }
  },
  Door: class extends Model {
    constructor(game) {
      super(game);
      this.healthBar = new HealthBarModel(this.game);
      this.healthBar.setSize(35, 10);
      this.healthBar.setPivotPoint(17.5, -8);
      this.healthBar.setVisible(false);
      this.addAttachment(this.healthBar, 3);
      this.currentTier = null;
      this.updateModel();
    }
    update(t, e) {
      e && (this.updateModel(e.tier), this.updateHealthBar(e), this.updateVisibility(e));
      super.update(t, e);
    }
    updateModel(t = 1) {
      if (t !== this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for door: ${t}`);
        (this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/Door/DoorTier${t}.svg`,
        )),
          this.addAttachment(this.base, 2);
      }
    }
    updateVisibility(t) {
      t.partyId == this.game.ui.playerTick.partyId
        ? this.base.setAlpha(0.5)
        : this.base.setAlpha(1);
    }
    updateHealthBar(t) {
      this.healthBar.setVisible(t.health !== t.maxHealth);
    }
  },
  SpikeTrap: class extends Model {
    constructor(fame) {
      super(game);
      this.currentTier = null;
      this.updateModel();
      this.spikeSprite = new SpriteNode(
        this.game,
        "./static/images/Entity/SpikeTrap/SpikeTrapSpike.svg",
      );
      this.spikeSprite.setVisible(false);
      this.game.renderer.projectiles.addAttachment(this.spikeSprite, 10);
    }
    onDie() {
      this.game.renderer.projectiles.removeAttachment(this.spikeSprite),
        (this.spikeSprite = null);
    }
    update(t, e) {
      e &&
        (void 0 !== e.position &&
          this.spikeSprite.setPosition(this.getPositionX(), this.getPositionY()),
        this.updateModel(e.tier),
        this.updateFiringAnimation(e));
      super.update(t, e);
    }
    updateModel(t = 1) {
      if (t !== this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for SpikeTrap: ${t}`);
        this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/SpikeTrap/SpikeTrapBaseTier${t}.svg`,
        );
        this.addAttachment(this.base, 2);
        this.base.setAlpha(0.5);
      }
    }
    updateFiringAnimation(t) {
      const e = this.game.renderer.replicator.getTickIndex();
      this.spikeSprite.setVisible(Math.abs(t.firingTick - e) < 10);
    }
  },
  CannonTower: class extends TowerModel {
    constructor(game) {
      super(game, "CannonTower");
    }
  },
  RocketTower: class extends TowerModel {
    constructor(game) {
      super(game, "RocketTower");
    }
  },
  Drill: class extends Model {
    constructor(game) {
      super(game);
      this.healthBar = new HealthBarModel(this.game);
      this.healthBar.setSize(82, 16);
      this.healthBar.setPivotPoint(41, -25);
      this.healthBar.setVisible(!1);
      this.addAttachment(this.healthBar, 4);
      this.currentRotation = 0;
      this.currentTier = null;
      this.updateModel();
    }
    update(t, e) {
      e &&
        (this.updateModel(e.tier),
        this.updateHealthBar(e),
        (this.currentRotation += (45 * e.tier * t) / 1e3),
        (this.currentRotation %= 360),
        this.drill.setRotation(this.currentRotation));
      super.update(t, e);
    }
    updateModel(t = 1) {
      if (t != this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.head),
          this.removeAttachment(this.drill),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for drill: ${t}`);
        (this.drill = new SpriteNode(
          this.game,
          "./static/images/Entity/Drill/Drill.svg",
        )),
          (this.head = new SpriteNode(
            this.game,
            `./static/images/Entity/Drill/DrillTier${t}Head.svg`,
          )),
          this.addAttachment(this.drill, 2),
          this.addAttachment(this.head, 3);
      }
    }
    updateHealthBar(t) {
      this.healthBar.setVisible(t.health !== t.maxHealth);
    }
  },
  SawTower: class extends TowerModel {
    constructor(game) {
      super(game, "SawTower");
      this.currentRotation = 0;
      this.extensionPosition = 0;
      this.lastExtensionPosition = void 0;
      this.arm = new GraphicsNode(this.game);
      this.arm.drawRect(-8, 0, 8, 48, {
        r: 0,
        g: 0,
        b: 0,
      });
      this.arm.setRotation(180);
      this.addAttachment(this.arm, 2);
      this.updateModel();
    }
    update(t, e) {
      e &&
        (this.updateModel(e.tier), this.updateAnimation(t, e), this.updateHealthBar(e));
      super.update(t, e);
    }
    updateModel(t = 1) {
      if (t != this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          this.removeAttachment(this.blade),
          this.removeAttachment(this.top),
          this.removeAttachment(this.brace),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for SawTower: ${t}`);
        (this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/SawTower/SawTowerTier${t}Base.svg`,
        )),
          (this.blade = new SpriteNode(
            this.game,
            "./static/images/Entity/SawTower/SawTowerBlade.svg",
          )),
          (this.top = new SpriteNode(
            this.game,
            `./static/images/Entity/SawTower/SawTowerTier${t}Top.svg`,
          )),
          this.top.setPositionY(-16),
          (this.brace = new SpriteNode(
            this.game,
            `./static/images/Entity/SawTower/SawTowerTier${t}Brace.svg`,
          )),
          this.blade.setPositionY(this.extensionPosition - 12 - 16);
        this.arm.draw.height = -this.extensionPosition;
        this.brace.setPositionY(this.extensionPosition - 16);
        this.addAttachment(this.base, 1);
        this.addAttachment(this.blade, 3);
        this.addAttachment(this.top, 4);
        this.addAttachment(this.brace, 5);
        this.brace.setAnchor(0.5, 1);
      }
    }
    updateHealthBar(t) {
      this.healthBar.setVisible(t.health !== t.maxHealth);
    }
    updateAnimation(t, e) {
      0 !== e.firingTick
        ? ((this.currentRotation += (720 * t) / 1e3),
          (this.currentRotation %= 360),
          this.blade.setRotation(this.currentRotation),
          (this.extending = !0))
        : (this.extending = !1),
        !0 === this.extending
          ? ((this.extensionPosition -= 4),
            this.extensionPosition < -64 && (this.extensionPosition = -64))
          : ((this.extensionPosition += 8),
            this.extensionPosition > 0 && (this.extensionPosition = 0)),
        this.extensionPosition !== this.lastExtensionPosition &&
          ((this.lastExtensionPosition = this.extensionPosition),
          this.blade.setPositionY(this.extensionPosition - 12 - 16),
          (this.arm.draw.height = -this.extensionPosition),
          this.brace.setPositionY(this.extensionPosition - 16));
    }
  },
  LightningTower: class extends TowerModel {
    constructor(game) {
      super(game, "LightningTower");
      this.targetBeams = new GraphicsNode(this.game);
      this.game.renderer.projectiles.addAttachment(this.targetBeams, 2);
      this.lastFiringTick = 0;
      this.hasFired = !1;
      this.branchTextures = [];
      this.currentRotation = 0;
      this.currentRotationSpeed = 0;
    }
    removedParentFunction() {
      this.game.renderer.projectiles.removeAttachment(this.targetBeams);
    }
    createLightningTexture(t, e) {
      const r = this.game.util.angleTo(t, e),
        n = Math.sqrt(this.game.util.measureDistance(t, e)),
        i = 2 * (2 + Math.floor(3 * Math.random()));
      this.targetBeams.draw.moveTo(t.x, t.y);
      let o = {
        x: t.x,
        y: t.y,
      };
      for (let t = 0; t <= i; t++)
        if (t == i) this.targetBeams.draw.lineTo(e.x, e.y);
        else if (t % 2 == 0) {
          const t = (r - (40 - Math.floor(10 * Math.random())) + 360) % 360,
            e = {
              x: o.x + Math.sin((t * Math.PI) / 180) * ((n / i) * 1.25),
              y: o.y - Math.cos((t * Math.PI) / 180) * ((n / i) * 1.25),
            };
          this.targetBeams.draw.lineTo(e.x, e.y), (o = e);
        } else {
          const t = (r + (40 - Math.floor(10 * Math.random())) + 360) % 360,
            e = {
              x: o.x + Math.sin((t * Math.PI) / 180) * ((n / i) * 1.25),
              y: o.y - Math.cos((t * Math.PI) / 180) * ((n / i) * 1.25),
            };
          this.targetBeams.draw.lineTo(e.x, e.y), (o = e);
        }
      this.targetBeams.draw.stroke({
        width: 3,
        color: 16777215,
      });
    }
    update(t, e) {
      e && (this.updateSpinningAnimation(t, e), this.updateFiringAnimation(t, e)),
        super.update(t, e);
    }
    updateSpinningAnimation(t, e) {
      this.game.renderer.replicator.getMsSinceTick(this.lastFiringTick) > 1e3
        ? (this.currentRotationSpeed = Math.max(
            0,
            this.currentRotationSpeed - (15 * t) / 1e3,
          ))
        : (this.currentRotationSpeed = Math.min(
            this.currentRotationSpeed + (36 * t) / 1e3,
            (720 * t) / 1e3,
          )),
        this.currentRotationSpeed > 0 &&
          ((this.currentRotation += this.currentRotationSpeed),
          (this.currentRotation %= 360),
          this.coil.setRotation(this.currentRotation));
    }
    clearLightning(t) {
      (this.hasFired = !1),
        this.targetBeams.draw.clear(),
        this.branchTextures.forEach((t) => {
          this.targetBeams.removeAttachment(t);
        }),
        (this.branchTextures = []);
    }
    updateFiringAnimation(t, e) {
      if (0 == e.firingTick) return;
      const r = this.game.renderer.replicator.getMsSinceTick(e.firingTick);
      if (e.firingTick !== this.lastFiringTick) {
        this.clearLightning();
        const t = this.parent.targetTick.position;
        this.targetBeams.setAlpha(1), (this.hasFired = !0);
        let r = {
          x: 0,
          y: 0,
        };
        const n = this.game.util.angleTo(t, {
          x: e.targetBeams[0],
          y: e.targetBeams[1],
        });
        (r.x += Math.sin((n * Math.PI) / 180) * (Math.floor(8 * Math.random()) + 22)),
          (r.y -= Math.cos((n * Math.PI) / 180) * (Math.floor(8 * Math.random()) + 22)),
          (r.x += t.x),
          (r.y += t.y);
        for (let t = 0; t < e.targetBeams.length; t += 2) {
          const n = {
            x: e.targetBeams[t],
            y: e.targetBeams[t + 1],
          };
          this.createLightningTexture(r, n), (r = n);
        }
        this.lastFiringTick = e.firingTick;
      } else if (1 == this.hasFired) {
        const t = Math.min(1, Math.max(0, r / 50));
        this.targetBeams.setAlpha(1 - t);
      }
      r >= 100 && 1 == this.hasFired && this.clearLightning();
    }
    updateModel(t = 1) {
      if (t != this.currentTier) {
        if (
          ((this.currentTier = t),
          this.removeAttachment(this.base),
          this.removeAttachment(this.coil),
          ![1, 2, 3, 4, 5, 6, 7, 8].includes(t))
        )
          throw new Error(`Unknown tier encountered for ${this.type} tower: ${t}`);
        (this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/${this.type}/${this.type}Tier${t}Base.svg`,
        )),
          (this.coil = new SpriteNode(
            this.game,
            `./static/images/Entity/${this.type}/${this.type}Tier${t}Coil.svg`,
          )),
          this.addAttachment(this.base, 2),
          this.addAttachment(this.coil, 3),
          this.coil.setRotation(this.currentRotation);
      }
    }
  },
  Zombie: class extends PlayerModel {
    constructor(game) {
      super(game);
      this.healthBar = new HealthBarModel({
        r: 183,
        g: 70,
        b: 20,
      });
      this.healthBar.setPosition(0, -5);
      this.healthBar.setScale(0.6);
      this.addAttachment(this.healthBar, 0);

      this.hasDeathFadeEffect = !0;
      this.deathFadeEffect.fadeOutTime = 100;
      this.deathFadeEffect.maxScaleIncreasePercent = 0.15;
    }
    update(t, e) {
      const r = this.getParent();
      e &&
        (void 0 === this.base && this.updateModel(e, r),
        this.healthBar.setVisible(e.health < e.maxHealth),
        void 0 !== e.yaw && (r.targetTick.aimingYaw = e.yaw)),
        super.update(t, e);
    }
    updateModel(t, e) {
      if (t.tier < 0 || t.tier > 10)
        throw new Error(`Invalid zombie tier received: ${t.tier}`);
      if (3 == t.tier)
        (this.base = new SpriteNode(
          this.game,
          `./static/images/Entity/Zombie/Zombie${t.colour}/Zombie${t.colour}Tier${t.tier}Base.svg`,
        )),
          (this.weaponLeft = new SpriteNode(
            this.game,
            `./static/images/Entity/Zombie/Zombie${t.colour}/Zombie${t.colour}Tier${t.tier}WeaponLeft.svg`,
          )),
          (this.weaponRight = new SpriteNode(
            this.game,
            `./static/images/Entity/Zombie/Zombie${t.colour}/Zombie${t.colour}Tier${t.tier}WeaponRight.svg`,
          )),
          this.weaponLeft.setAnchor(0.5, 0.5),
          this.weaponRight.setAnchor(0.5, 0.5),
          (this.weaponUpdateFunc = this.updateStabbingWeapon(500)),
          this.addAttachment(this.base, 2),
          this.addAttachment(this.weaponLeft, 1),
          this.addAttachment(this.weaponRight, 1);
      else {
        switch (
          ((this.base = new SpriteNode(
            this.game,
            `./static/images/Entity/Zombie/Zombie${t.colour}/Zombie${t.colour}Tier${t.tier}Base.svg`,
          )),
          (this.weapon = new SpriteNode(
            this.game,
            `./static/images/Entity/Zombie/Zombie${t.colour}/Zombie${t.colour}Tier${t.tier}Weapon.svg`,
          )),
          t.tier)
        ) {
          case 2:
          default:
            this.weapon.setAnchor(0.5, 0.5),
              (this.weaponUpdateFunc = this.updateAntiClockwiseSwingingWeapon(300, 100));
            break;
          case 4:
          case 5:
          case 6:
          case 7:
          case 8:
            this.weapon.setAnchor(0.5, 0.5),
              (this.weaponUpdateFunc = this.updateClockwiseSwingingWeapon(300, 100));
        }
        this.addAttachment(this.base, 2), this.addAttachment(this.weapon, 1);
      }
    }
  },
  /*
  SpellIndicator: class extends te {
    constructor(t) {
      super(),
        (this.spellIndicatorModel = new re()),
        this.spellIndicatorModel.setAlpha(0.1),
        this.addAttachment(this.spellIndicatorModel),
        (this.spellType = t.spellType),
        (this.radius = t.radius),
        (this.currentPulse = 0),
        (this.pulseSpeed = 1 * Math.PI),
        (this.minAlpha = 0.05),
        (this.maxAlpha = 0.12),
        (this.icons = {}),
        (this.iconOffsets = {}),
        (this.iconMaxOffset = 50),
        (this.iconSpawnTolerance = 0.1),
        (this.iconTotal = 10),
        (this.iconMoveRatePerSecond = 144);
      let e = {
          r: 216,
          g: 0,
          b: 39,
        },
        r = {
          r: 216,
          g: 77,
          b: 92,
        };
      "Rapidfire" === this.spellType &&
        ((e = {
          r: 255,
          g: 254,
          b: 119,
        }),
        (r = {
          r: 255,
          g: 255,
          b: 0,
        })),
        this.spellIndicatorModel.drawCircle(0, 0, this.radius, e, r, 8),
        (this.hasDeathFadeEffect = !0),
        (this.deathFadeEffect.fadeOutTime = 1e3),
        (this.deathFadeEffect.maxScaleIncreasePercent = 0);
    }
    update(t, e) {
      e && (this.updatePulse(t), this.updateIcons(t)), super.update(t, e);
    }
    updatePulse(t) {
      this.currentPulse += t / 1e3;
      const e = (Math.sin(this.currentPulse * this.pulseSpeed) + 1) / 2;
      this.spellIndicatorModel.setAlpha(
        this.minAlpha + (this.maxAlpha - this.minAlpha) * e,
      );
    }
    updateIcons(t) {
      for (let e = 0; e < this.iconTotal; e++) {
        if (!this.icons[e]) {
          if (Math.random() > this.iconSpawnTolerance) continue;
          (this.icons[e] = new oe(
            `./asset/images/Entity/Spells/${this.spellType}Icon.svg`,
          )),
            (this.iconOffsets[e] = 0);
          const t = Math.random() * Math.PI * 2,
            r = Math.cos(t) * Math.random() * this.radius,
            n = Math.sin(t) * Math.random() * this.radius;
          this.icons[e].setPosition(r, n),
            this.icons[e].setAlpha(0.5),
            this.addAttachment(this.icons[e]);
          continue;
        }
        const r = (this.iconMoveRatePerSecond / 1e3) * t;
        (this.iconOffsets[e] += r),
          this.icons[e].setPositionY(this.icons[e].getPositionY() - r),
          this.icons[e].setAlpha(
            0.5 - 0.5 * Math.min(1, this.iconOffsets[e] / this.iconMaxOffset),
          ),
          this.iconOffsets[e] >= this.iconMaxOffset &&
            (this.removeAttachment(this.icons[e]),
            delete this.icons[e],
            delete this.iconOffsets[e]);
      }
    }
  },
  ResourcePickup: class extends te {
    constructor(t) {
      super(),
        (this.resourceType = ["wood", "stone", "gold"][t.resourcePickupType]),
        (this.resourceType =
          this.resourceType.charAt(0).toUpperCase() + this.resourceType.slice(1));
      const e = new oe(`./asset/images/Entity/Harvester/${this.resourceType}Pickup.svg`);
      this.addAttachment(e, 1),
        (this.hasDeathFadeEffect = !0),
        (this.deathFadeEffect.fadeOutTime = 150),
        (this.deathFadeEffect.maxScaleIncreasePercent = 0.15),
        (this.deathFadeEffect.shouldUpdatePosition = !1);
    }
  },
  Visualiser: class extends te {
    constructor(t) {
      super(),
        (this.text = new Qt("↑", {
          fontFamily: "Hammersmith One",
          fontSize: 20,
        })),
        this.addAttachment(this.text),
        this.setRotation(t.yaw),
        (t.position.x += 24),
        (t.position.y += 24);
    }
  },
  */
};
