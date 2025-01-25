<script>
    import GraphicsNode from "$lib/Models/GraphicsNode";
    import HarvesterSelectorModel from "$lib/Models/HarvesterSelectorModel";

    let { game } = $props();
    import { gameOptions } from "../Intro/Intro-shared.svelte";

    let shouldDisplay = $state(false);
    let alignTop = $state(0);
    let alignLeft = $state(0);
    let overlay = $state();

    $effect(() => {
        if (shouldDisplay) {
            overlay.style.left = alignLeft + "px";
            overlay.style.top = alignTop + "px";
        }
    });

    let isLeader = $state(false);

    let aggro = $state("aggressive");

    let buildingUid = null;
    let buildingId = null;
    let buildingTier = null;

    let maxFactoryDistance = 0;

    let numberOfRangesToDraw = 0;
    let shouldUpdateRanges = true;
    let lastRangeDrawTick = 0;

    let shiftDown = false;
    let displayingHarvesterRange = false;

    let harvesterSelectorModel = null;

    let draw = null;

    function isActive() {
        return !!buildingUid;
    }

    function drawRange(t) {
        const e = game.ui.buildings[t],
            r = game.renderer.world.entities[t];

        numberOfRangesToDraw++;

        if (null == e || null == r) return;

        const n = game.ui.buildingData[e.type];
        if ("Factory" == e.type) {
            const t = game.renderer.world.entityGrid.cellSize;
            draw.drawRect(
                e.x - maxFactoryDistance * t,
                e.y - maxFactoryDistance * t,
                e.x + maxFactoryDistance * t,
                e.y + maxFactoryDistance * t,
                {
                    r: 0,
                    b: 0,
                    g: 0,
                },
                {
                    r: 255,
                    b: 0,
                    g: 0,
                },
                12,
            );
        } else if (void 0 !== n.towerRadius)
            draw.drawCircle(
                e.x,
                e.y,
                n.towerRadius[e.tier - 1],
                1 == numberOfRangesToDraw
                    ? {
                          r: 200,
                          g: 160,
                          b: 0,
                      }
                    : {
                          r: 0,
                          g: 0,
                          b: 0,
                          a: 0,
                      },
                {
                    r: 255,
                    g: 200,
                    b: 0,
                },
                8,
            );
        else if (void 0 !== n.range && "SawTower" == e.type) {
            let t, r;
            0 == e.yaw
                ? ((t = {
                      x: e.x - n.maxYawDeviation[e.tier - 1],
                      y: e.y - n.range[e.tier - 1],
                  }),
                  (r = {
                      x: e.x + n.maxYawDeviation[e.tier - 1],
                      y: e.y - n.range[e.tier - 1],
                  }))
                : 90 == e.yaw
                  ? ((t = {
                        x: e.x + n.range[e.tier - 1],
                        y: e.y + n.maxYawDeviation[e.tier - 1],
                    }),
                    (r = {
                        x: e.x + n.range[e.tier - 1],
                        y: e.y - n.maxYawDeviation[e.tier - 1],
                    }))
                  : 180 == e.yaw
                    ? ((t = {
                          x: e.x + n.maxYawDeviation[e.tier - 1],
                          y: e.y + n.range[e.tier - 1],
                      }),
                      (r = {
                          x: e.x - n.maxYawDeviation[e.tier - 1],
                          y: e.y + n.range[e.tier - 1],
                      }))
                    : 270 == e.yaw &&
                      ((t = {
                          x: e.x - n.range[e.tier - 1],
                          y: e.y - n.maxYawDeviation[e.tier - 1],
                      }),
                      (r = {
                          x: e.x - n.range[e.tier - 1],
                          y: e.y + n.maxYawDeviation[e.tier - 1],
                      })),
                draw.drawTriangle(
                    {
                        x: e.x,
                        y: e.y,
                    },
                    t,
                    r,
                    {
                        r: 200,
                        g: 160,
                        b: 0,
                    },
                    {
                        r: 255,
                        g: 200,
                        b: 0,
                    },
                    8,
                );
        }
    }

    function stopWatching() {
        if (buildingUid) {
            harvesterSelectorModel.setVisible(false);
            draw.clear();

            /*
          element.style.left = "-1000px";
          element.style.top = "-1000px";
          upgradeElem.classList.remove("is-disabled");
          */

            buildingUid = null;
            buildingId = null;
            buildingTier = null;

            displayingHarvesterRange = false;
            shouldDisplay = false;
        }
    }

    function update() {
        if (!buildingUid) return;

        const t = game.renderer.world.entities[buildingUid];
        if (!t) return stopWatching();

        const e = game.renderer.worldToScreen(t.getPositionX(), t.getPositionY()),
            r = game.ui.buildingData[buildingId],
            n = game.ui.buildings[buildingUid];
        if (!n) return stopWatching();

        if (shouldDisplay) {
            const t =
                (r.gridHeight / 2) * 48 * (game.renderer.scale / window.devicePixelRatio);
            alignLeft = e.x - overlay.offsetWidth / 2;
            alignTop = e.y - t - overlay.offsetHeight - 20;
        }
        /*
      if (isVisible()) {
          const t = r.gridHeight / 2 * 48 * (dr.renderer.scale / window.devicePixelRatio);
          element.style.left = e.x - element.offsetWidth / 2 + "px",
          element.style.top = e.y - t - element.offsetHeight - 20 + "px"
      }
      */
        if (
            1 == shouldUpdateRanges &&
            lastRangeDrawTick !== game.renderer.replicator.currentTick.tick
        ) {
            shouldUpdateRanges = false;
            lastRangeDrawTick = game.renderer.replicator.currentTick.tick;
            draw.clear();
            numberOfRangesToDraw = 0;
            if ("Harvester" == r.name) {
                harvesterSetTargetElem.innerHTML =
                    0 == t.targetTick.targetResourceUid ? "Set Target" : "Clear Target";
                const e = r.harvestRange[n.tier - 1];
                draw.drawCircle(
                    n.x,
                    n.y,
                    e,
                    {
                        r: 200,
                        g: 160,
                        b: 0,
                    },
                    {
                        r: 255,
                        g: 200,
                        b: 0,
                    },
                    8,
                );
                harvesterSelectorModel.setVisible(true);
                const i = game.renderer.world.entities[t.targetTick.targetResourceUid];
                null == i
                    ? harvesterSelectorModel.setPosition(
                          t.getPositionX(),
                          t.getPositionY(),
                      )
                    : harvesterSelectorModel.setPosition(
                          i.getPositionX(),
                          i.getPositionY(),
                      );
                if (displayingHarvesterRange) {
                    const t = game.renderer.scenery;
                    for (const r of t.attachments) {
                        if ("Resource" !== r.entityClass) continue;
                        const t = r.targetTick;
                        if (
                            Math.sqrt(game.util.measureDistance(n, t.position)) +
                                t.radius <=
                            e
                        ) {
                            draw.drawCircle(
                                t.position.x,
                                t.position.y,
                                100,
                                {
                                    r: 0,
                                    g: 0,
                                    b: 0,
                                },
                                {
                                    r: 255,
                                    g: 0,
                                    b: 0,
                                },
                                8,
                            );
                        }
                    }
                }
            } else if (
                (harvesterSelectorModel.setVisible(false),
                drawRange(buildingUid),
                game.network.inputPacketManager.shiftDown)
            )
                for (let t in game.ui.buildings) {
                    if (
                        game.ui.buildings[t].type == buildingId &&
                        game.ui.buildings[t].uid !== buildingUid
                    ) {
                        drawRange(t);
                    }
                }
        }
    }

    function updateText() {
        if (!isActive()) return;
        if (!game.ui.buildings[buildingUid]) return stopWatching();

        const t = game.ui.buildingData[buildingId];
        const e = game.renderer.world.entities[buildingUid];

        (buildingId = game.ui.buildings[buildingUid].type),
            (buildingTier = game.ui.buildings[buildingUid].tier);

        if (!e) return stopWatching();

        if ("Factory" == buildingId && "scarcity" !== gameOptions.gameMode) {
            if (1 == e.targetTick.aggroEnabled) {
                aggro = "all";
            } else {
                aggro = "aggressive";
            }
            isLeader = game.ui.playerPartyLeader == game.renderer.world.localPlayer;
            /*
                  ? (aggroElem.classList.add("btn-red"),
                    aggroElem.classList.remove("btn-green"),
                    (aggroElem.innerHTML = "Attack all enemies"))
                  : (aggroElem.classList.add("btn-green"),
                    aggroElem.classList.remove("btn-red"),
                    (aggroElem.innerHTML = "Attack aggressive enemies")),
              (aggroElem.style.display = "block"),
              game.ui.playerPartyLeader == game.renderer.world.localPlayer
                  ? aggroElem.classList.remove("is-disabled")
                  : aggroElem.classList.add("is-disabled"))
                  */
        } else {
            aggroElem.style.display = "none";
        }

        if ("Harvester" == buildingId) {
            dualBtnElem.style.display = "block";
            harvesterDroneCountElem.style.display = "block";
            harvesterDroneCountElem.innerHTML = `${e.targetTick.droneCount}/${t.maxDrones[e.targetTick.tier - 1]} Drones`;
            if ("scarcity" == gameOptions.gameMode) {
                harvesterPurchaseDroneElem.classList.add("is-disabled");
                harvesterPurchaseDroneElem.innerHTML = "Buy Drone";
            } else if (e.targetTick.droneCount >= t.maxDrones[e.targetTick.tier - 1]) {
                harvesterPurchaseDroneElem.classList.add("is-disabled");
                harvesterPurchaseDroneElem.innerHTML = "Buy Drone";
            } else {
                harvesterPurchaseDroneElem.classList.remove("is-disabled");
                const e = game.util.createResourceCostString(
                    {
                        goldCosts: t.droneGoldCosts,
                    },
                    buildingTier,
                    1,
                    true,
                );
                harvesterPurchaseDroneElem.innerHTML = `Buy Drone (${e.elem})`;
            }
        } else {
            dualBtnElem.style.display = "none";
            harvesterDroneCountElem.style.display = "none";
        }
        const r =
            buildingTier >= t.tiers ||
            ("Factory" !== buildingId && buildingTier >= game.ui.factory.tier);

        nameElem.innerHTML = buildingId;
        tierElem.innerHTML = buildingTier;

        let n = 1;
        if (game.inputPacketManager.shiftDown)
            for (const t in game.ui.buildings) {
                const e = game.ui.buildings[t];
                if (
                    e.type == buildingId &&
                    e.tier == buildingTier &&
                    e.uid !== buildingUid
                )
                    n++;
            }
        r && upgradeElem.classList.add("is-disabled");
        const i = l.createResourceRefundString(t, buildingTier, n);
        ["Factory"].includes(buildingId)
            ? (sellElem.classList.add("is-disabled"),
              (sellElem.innerHTML = "<span>Can't sell</span>"))
            : dr.ui.playerPartyCanSell
              ? (sellElem.classList.remove("is-disabled"),
                (sellElem.innerHTML = `<span>Sell${dr.network.inputPacketManager.shiftDown ? " All" : ""} (${i})</span>`))
              : (sellElem.classList.add("is-disabled"),
                (sellElem.innerHTML = "<span>Need permission to sell</span>"));
        const o = l.createResourceCostString(
                t,
                r ? buildingTier : buildingTier + 1,
                n,
                !0,
            ),
            s = dr.ui.getFactory();
        r
            ? ["Factory"].includes(buildingId) ||
              (s.tier == buildingTier && s.tier >= dr.ui.buildingData.Factory.tiers)
                ? (upgradeElem.innerHTML = "<span>Maximum tier!</span>")
                : (upgradeElem.innerHTML = "<span>Upgrade your Factory</span>")
            : (upgradeElem.innerHTML = `<span>Upgrade ${dr.network.inputPacketManager.shiftDown ? "All " : ""} (${o.elem})</span>`);
        const a = {
            "Max Health": "health",
            Range: "towerRadius",
            "Harvest Range": "harvestRange",
            "Gold/Second": "goldPerSecond",
            "Firing Rate": "msBetweenFires",
            "Projectile Speed": "projectileSpeed",
            "Damage to Zombies": "damageToZombies",
            "Target Limit": "attackTargetLimit",
            "Max Drone Count": "maxDrones",
        };
        let c = "",
            u = "";
        for (let e in a)
            t[a[e]] &&
                ((c += `<p>${e}: <strong class="hud-stats-current">${t[a[e]][buildingTier - 1]}</strong></p>`),
                (u += `<p>${e}: <strong class="hud-stats-next">${t[a[e]][buildingTier - (buildingTier >= t.tiers ? 1 : 0)]}</strong></p>`));
        statsElem.innerHTML = `<div class="hud-stats-current hud-stats-values">${c}</div>\n        <div class="hud-stats-next hud-stats-values">${u}</div>`;
    }

    function upgradeBuilding() {}

    function sellBuilding() {}

    const t = (t) => {
        shouldUpdateRanges = true;
        if ("Up" == t && 1 == shiftDown) {
            shiftDown = false;
            update();
        } else if ("Down" == t && 0 == shiftDown) {
            shiftDown = true;
            update();
        }
    };
    game.eventEmitter.on("16Down", () => t("Down"));
    game.eventEmitter.on("16Up", () => t("Up"));

    game.eventEmitter.on("EnterWorldResponse", (t) => {
        if (!harvesterSelectorModel || !draw) {
            harvesterSelectorModel = new HarvesterSelectorModel(game, {
                radius: 120,
            });
            game.renderer.groundLayer.addAttachment(harvesterSelectorModel, 10);
            harvesterSelectorModel.setVisible(false);

            draw = new GraphicsNode(game);
            draw.setAlpha(0.1);
            game.renderer.groundLayer.addAttachment(draw, 10);
        }

        stopWatching();
        maxFactoryDistance = t.maxFactoryBuildDistance;
    });
    game.eventEmitter.on("EntityUpdate", (t) => {
        if (null != buildingUid && void 0 !== t.entities[buildingUid]) {
            update();
        }
    });
    game.eventEmitter.on("PlayerTickUpdated", updateText);
    game.eventEmitter.on("CameraUpdate", () => {
        shouldUpdateRanges = true;
        update();
    });
    game.eventEmitter.on("BuildingsUpdated", () => {
        shouldUpdateRanges = true;
        update();
        updateText();
    });

    game.eventEmitter.on("16Down", updateText);
    game.eventEmitter.on("16Up", updateText);
    game.eventEmitter.on("69Up", upgradeBuilding);
    game.eventEmitter.on("84Up", sellBuilding);
    game.eventEmitter.on("27Up", stopWatching);
</script>

{#if shouldDisplay}
    <div class="hud-tooltip-building" bind:this={overlay}>
        <h2 class="hud-building-name"></h2>
        <h3 class="harvester-drone-count"></h3>
        <h3>Tier <strong id="hud-building-tier" class="hud-building-tier"></strong></h3>
        <div class="hud-tooltip-body">
            <div id="hud-building-stats" class="hud-building-stats"></div>
            <div class="hud-building-actions">
                <button class="btn hud-building-aggro"></button>
                <div class="hud-building-dual-btn">
                    <button class="btn hud-building-harvester-drone">Buy Drone</button>
                    <button class="btn hud-building-harvester-set-target"
                        >Set Target</button
                    >
                </div>
                <button class="btn btn-green hud-building-upgrade"></button>
                <button class="btn btn-red hud-building-sell">Sell</button>
            </div>
        </div>
    </div>
{/if}
