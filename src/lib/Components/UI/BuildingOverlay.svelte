<script>
    import GraphicsNode from "$lib/Models/GraphicsNode";
    import HarvesterSelectorModel from "$lib/Models/HarvesterSelectorModel";

    let { game } = $props();
    import { gameOptions } from "$lib/Engine/shared.svelte.js";

    let buildingData = $derived(game.ui.buildingData);
    let buildings = $derived(game.ui.buildings);

    const properties = {
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

    let isInit = false;
    let maxFactoryDistance = $state(0);

    let shiftDown = $state(false);

    let shouldDisplay = $state(false);

    let draw, harvesterSelectorModel;
    let shouldUpdateRanges = $state(true);
    let displayingHarvesterRange = $state(false);
    let numberOfRangesToDraw = $state(0);
    let lastRangeDrawTick = $state(0);

    let alignTop = $state(-999);
    let alignLeft = $state(-999);
    let overlay = $state();

    $effect(() => {
        if (shouldDisplay) {
            overlay.style.left = alignLeft + "px";
            overlay.style.top = alignTop + "px";
        }
    });

    let isMaxTier = $state(false);

    let isLeader = $derived(game.ui.playerPartyLeader == game.ui.playerTick?.uid);

    let aggro = $state("aggressive"); /* $derived(
        game.renderer.world.entities[game.ui.factory?.uid]?.targetTick.aggroEnabled
            ? "all"
            : "aggressive",
    ); */
    let droneCount = $state(0);

    let buildingUid = $state(0);
    let buildingId = $state("Harvester");
    let buildingTier = $state(0);

    function startWatching(t) {
        null !== buildingUid && stopWatching();
        game.ui.PlacementOverlay.cancelPlacing();
        buildingUid = t;

        if (buildings[t]) {
            if (game.renderer.world.entities[buildingUid]) {
                buildingId = buildings[t].type;
                buildingTier = buildings[t].tier;
                shouldUpdateRanges = true;
                update();
                shouldDisplay = true;
            } else {
                stopWatching();
            }
        }
    }

    function stopWatching() {
        if (buildingUid) {
            harvesterSelectorModel.setVisible(false);
            draw.clear();

            buildingUid = null;
            buildingId = null;
            buildingTier = null;

            displayingHarvesterRange = false;

            shouldDisplay = false;
            alignTop = -999;
            alignLeft = -999;
        }
    }

    function drawRange(t) {
        const e = buildings[t],
            r = game.renderer.world.entities[t];
        if ((numberOfRangesToDraw++, null == e || null == r)) return;
        const n = buildingData[e.type];
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

    function toggleHarvesterTargetDisplay(t) {
        t.stopPropagation();
        if (1 === t.which) {
            if (
                0 ==
                game.renderer.world.entities[buildingUid].targetTick.targetResourceUid
            ) {
                displayingHarvesterRange = true;
                shouldDisplay = false;
            } else {
                game.network.sendRpc({
                    name: "UpdateHarvesterTarget",
                    harvesterUid: buildingUid,
                    targetUid: 0,
                });
            }
            shouldUpdateRanges = true;
            update();
        }
    }
    function purchaseHarvesterDrone(t) {
        if (1 === t.which) {
            t.stopPropagation();
            game.network.sendRpc({
                name: "BuyHarvesterDrone",
                harvesterUid: buildingUid,
            });
        }
    }

    function update() {
        if (!buildingUid) return;

        const t = game.renderer.world.entities[buildingUid];
        if (!t) return stopWatching();

        const e = game.renderer.worldToScreen(t.getPositionX(), t.getPositionY()),
            r = buildingData[buildingId],
            n = buildings[buildingUid];
        if (!n) return stopWatching();

        if (shouldDisplay) {
            const offset =
                (r.gridHeight / 2) * 48 * (game.renderer.scale / window.devicePixelRatio);
            alignLeft = e.x - overlay.offsetWidth / 2;
            alignTop = e.y - offset - overlay.offsetHeight - 20;

            buildingId == "Factory" &&
                (aggro = t.targetTick.aggroEnabled ? "all" : "aggressive");

            isMaxTier =
                buildingTier >= t.tiers ||
                ("Factory" !== buildingId && buildingTier >= game.ui.factory.tier);
        }
        if (
            1 == shouldUpdateRanges &&
            lastRangeDrawTick !== game.renderer.replicator.currentTick.tick
        ) {
            numberOfRangesToDraw = 0;
            shouldUpdateRanges = false;
            lastRangeDrawTick = game.renderer.replicator.currentTick.tick;
            draw.clear();

            if ("Harvester" == r.name) {
                /*
                harvesterSetTargetElem.innerHTML =
                    0 == t.targetTick.targetResourceUid ? "Set Target" : "Clear Target";
                */
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
            } else {
                harvesterSelectorModel.setVisible(false);
                drawRange(buildingUid);
                if (game.inputPacketManager.shiftDown) {
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
        }
    }

    function onWorldMouseUp(t) {
        if ("Harvester" != buildingId) return stopWatching();
        if (0 == displayingHarvesterRange) return stopWatching();

        const e = game.renderer.world.entities[buildingUid],
            r = buildingData[buildingId].harvestRange[buildings[buildingUid].tier - 1],
            n = game.renderer.scenery,
            i = [],
            o = game.renderer.screenToWorld(
                game.ui.mousePosition.x,
                game.ui.mousePosition.y,
            );
        for (const t of n.attachments) {
            if ("Resource" == t.entityClass) {
                const n = Math.sqrt(game.util.measureDistance(t.getPosition(), o)),
                    s =
                        Math.sqrt(
                            game.util.measureDistance(t.getPosition(), e.getPosition()),
                        ) + t.targetTick.radius;
                n <= 120 && s <= r && i.push(t);
            }
        }
        if (0 != i.length) {
            i.sort((t, e) => {
                const r = game.util.measureDistance(o, t.getPosition()),
                    n = game.util.measureDistance(o, e.getPosition());
                return r < n ? -1 : r > n ? 1 : 0;
            });
            game.network.sendRpc({
                name: "UpdateHarvesterTarget",
                harvesterUid: buildingUid,
                targetUid: i[0].uid,
            });
            shouldDisplay = true;
            displayingHarvesterRange = false;
        }
    }

    function upgradeBuilding(t) {
        if (1 !== t.which && 69 !== t.which) return;
        if (!buildingUid) return;

        let e = new Set();
        e.add(buildingUid);

        if (game.inputPacketManager.shiftDown) {
            for (const t in buildings) {
                const r = buildings[t];
                if (r.type == buildingId && r.tier == buildingTier && t !== buildingUid) {
                    e.add(r.uid);
                }
            }
        }
        game.network.sendRpc({
            name: "UpgradeBuilding",
            uids: Array.from(e),
        });
    }
    function sellBuilding(t) {
        if (1 !== t.which && 84 !== t.which) return;
        if (!buildingUid || !game.ui.playerPartyCanSell) return;

        let e = new Set();
        e.add(buildingUid);

        if (game.inputPacketManager.shiftDown) {
            for (const t in buildings) {
                const r = buildings[t];
                if (r.type == buildingId && r.tier == buildingTier) {
                    e.add(r.uid);
                }
            }
        }
        if (e.size > 1) {
            game.ui.pendingPopups.push({
                type: "confirmation",
                message: `Are you sure you want to sell all <b>${buildingId}</b>s?`,
                callback: () => {
                    game.network.sendRpc({
                        name: "SellBuilding",
                        uids: Array.from(e),
                    });
                },
            });
        } else {
            game.network.sendRpc({
                name: "SellBuilding",
                uids: Array.from(e),
            });
        }
    }

    game.eventEmitter.on("EnterWorldResponse", (t) => {
        stopWatching();
        maxFactoryDistance = t.maxFactoryBuildDistance;

        if (isInit) return;
        isInit = true;

        harvesterSelectorModel = new HarvesterSelectorModel(game, {
            radius: 120,
        });

        game.renderer.groundLayer.addAttachment(harvesterSelectorModel, 10);
        harvesterSelectorModel.setVisible(false);

        draw = new GraphicsNode(game);
        game.renderer.groundLayer.addAttachment(draw, 10);

        numberOfRangesToDraw = 0;
        shouldUpdateRanges = true;
        lastRangeDrawTick = 0;
        draw.setAlpha(0.1);
    });

    game.eventEmitter.on("mouseUp", (t) => {
        if (game.ui.PlacementOverlay.isActive()) return;
        const e = game.renderer.world,
            r = game.renderer.screenToWorld(
                game.ui.mousePosition.x,
                game.ui.mousePosition.y,
            ),
            n = e.entityGrid.getCellIndices(r.x, r.y, {
                width: 1,
                height: 1,
            }),
            i = n.length > 0 && n[0];

        if (false === i) return;

        const o = e.entityGrid.getEntitiesInCell(i);
        for (const r in o) {
            const n = parseInt(r);

            if (n == buildingUid) return onWorldMouseUp(t);

            const i = e.entities[n].getTargetTick();
            for (const e in buildingData) {
                if (e == i.model) {
                    onWorldMouseUp(t);
                    return startWatching(n);
                }
            }
        }
        onWorldMouseUp(t);
    });

    game.eventEmitter.on("EntityUpdate", (t) => {
        if (null != buildingUid && void 0 !== t.entities[buildingUid]) {
            update();
        }
    });

    game.eventEmitter.on("CameraUpdate", () => {
        shouldUpdateRanges = true;
        update();
    });
    game.eventEmitter.on("BuildingsUpdated", () => {
        shouldUpdateRanges = true;
        update();
    });

    game.eventEmitter.on("27Up", stopWatching);
    game.eventEmitter.on("69Up", upgradeBuilding);
    game.eventEmitter.on("84Up", sellBuilding);

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
</script>

{#snippet BuildingStats()}
    {@const dataForThisBuilding = buildingData?.[buildingId]}
    <div class="stats bg-black/20 p-2 rounded-sm mb-2 mt-2">
        {#each Object.keys(properties) as property}
            {#if dataForThisBuilding?.[properties[property]]}
                <p class="relative h-6 w-full">
                    {property}
                    <strong class="current"
                        >{dataForThisBuilding[properties[property]][
                            buildingTier - 1
                        ]}</strong
                    >
                    {#if buildingTier < dataForThisBuilding.tiers && dataForThisBuilding[properties[property]][buildingTier - 1] != dataForThisBuilding[properties[property]][buildingTier]}
                        <span class="absolute left-[14.25rem] text-white/50">→</span>
                        <strong class="next"
                            >{dataForThisBuilding[properties[property]][
                                buildingTier
                            ]}</strong
                        >
                    {/if}
                </p>
            {/if}
        {/each}
    </div>
{/snippet}

{#snippet Buttons()}
    <div class="flex flex-col w-full gap-1">
        {#if buildingId == "Factory" && gameOptions.mode != "scarcity"}
            <button
                class="{isLeader ? '' : 'disabled'} bg-accent-purple"
                onclick={(t) => {
                    // if (1 !== t.which) return t.stopPropagation();
                    buildingUid &&
                        game.renderer.world.entities[buildingUid] &&
                        isLeader &&
                        game.network.sendRpc({
                            name: "TogglePrimaryAggro",
                        });
                }}>Attack {aggro} enemies</button
            >
        {/if}
        {#if buildingId == "Harvester"}
            <div class="flex flex-row w-full gap-1">
                <button
                    onclick={(t) => purchaseHarvesterDrone(t)}
                    class="flex-1 bg-accent-purple"
                    >Buy Drone ({@html game.util.createResourceCostString(
                        {
                            goldCosts: buildingData[buildingId].droneGoldCosts,
                        },
                        buildingTier,
                        1,
                        true,
                    ).elem})</button
                >
                <button
                    onclick={(t) => toggleHarvesterTargetDisplay(t)}
                    class="flex-1 bg-accent-gold"
                    >{0 ==
                    game.renderer.world.entities[buildingUid].targetTick.targetResourceUid
                        ? "Set"
                        : "Clear"} Target</button
                >
            </div>
        {/if}
        <div class="flex flex-col w-full gap-1">
            <button
                onclick={upgradeBuilding}
                class="flex-1 bg-accent-green after:content-['(E)']"
                >Upgrade ({@html game.util.createResourceCostString(
                    buildingData[buildingId],
                    isMaxTier ? buildingTier : buildingTier + 1,
                    /* n */ 1,
                    true,
                ).elem})</button
            >
            {#if buildingId != "Factory"}
                <button
                    onclick={sellBuilding}
                    class="flex-1 bg-accent-red after:content-['(T)']"
                    >Sell ({@html game.util.createResourceRefundString(
                        buildingData[buildingId],
                        buildingTier,
                        /* n */ 1,
                    )})</button
                >
            {/if}
        </div>
    </div>
{/snippet}

{#if shouldDisplay}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        class="parent absolute w-90 bg-black/30 rounded-sm p-4 z-40"
        bind:this={overlay}
        onmouseup={(t) => {
            t.stopPropagation();
        }}
        onmousedown={(t) => {
            t.stopPropagation();
        }}
    >
        <h2>{buildings[buildingUid]?.type.split(/(?=[A-Z])/).join(" ")}</h2>
        {#if buildingId == "Harvester"}
            <h3 class="absolute top-4 right-4">
                {game.renderer.world.entities[buildingUid].targetTick
                    .droneCount}/{buildingData?.[buildingId]?.maxDrones?.[
                    buildingTier - 1
                ]} Drones
            </h3>
        {/if}
        <h3>Tier <strong>{buildingTier}</strong></h3>
        <div>
            {@render BuildingStats()}
            {@render Buttons()}
        </div>
    </div>
{/if}

<style lang="postcss">
    @reference "tailwindcss/theme";

    .parent::after {
        content: " ";
        display: block;
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -6px;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid rgba(0, 0, 0, 0.3);
    }
    .disabled {
        pointer-events: none;
        opacity: 0.5 !important;
    }
    :global(.low) {
        @apply text-red-400;
    }
    .current {
        @apply absolute left-40;
    }
    .next {
        @apply absolute left-64;
    }
    h2 {
        @apply text-white text-xl;
    }
    h3 {
        @apply text-white/70;
    }
    p {
        @apply text-white/50;
    }
    strong {
        @apply text-white;
    }
    button {
        font-family: "Hammersmith One", Arial, Helvetica, sans-serif;
        @apply h-9 leading-9 pl-2 pr-2 text-white text-left text-xs shadow-sm rounded transition hover:brightness-125;
    }
    button::after {
        @apply absolute right-6 text-white/50;
    }
</style>
