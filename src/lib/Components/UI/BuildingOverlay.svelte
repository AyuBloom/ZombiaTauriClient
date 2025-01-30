<script>
    import GraphicsNode from "$lib/Models/GraphicsNode";
    import HarvesterSelectorModel from "$lib/Models/HarvesterSelectorModel";

    import { fade } from "svelte/transition";

    let { game } = $props();
    import { gameOptions } from "../Intro/Intro-shared.svelte";

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

    let shiftDown = $state(false);
    let shouldDisplay = $state(false);
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
                // this.shouldUpdateRanges = true;
                // this.updateText();
                // this.show();
                update();
                shouldDisplay = true;
            } else {
                stopWatching();
            }
        }
    }

    function stopWatching() {
        if (buildingUid) {
            // harvesterSelectorModel.setVisible(false);
            // draw.clear();
            buildingUid = null;
            buildingId = null;
            buildingTier = null;

            // displayingHarvesterRange = false;
            shouldDisplay = false;
            alignTop = -999;
            alignLeft = -999;
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
        /*
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
        */
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

    game.eventEmitter.on("mouseUp", () => {
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

            // if (n == buildingUid) return s.onWorldMouseUp(t);

            const i = e.entities[n].getTargetTick();
            for (const e in buildingData) {
                if (e == i.model) {
                    // s.onWorldMouseUp(t);
                    return startWatching(n);
                }
            }
        }
        "Harvester" != buildingId && stopWatching();
        // s.onWorldMouseUp(t);
    });

    game.eventEmitter.on("EntityUpdate", (t) => {
        if (null != buildingUid && void 0 !== t.entities[buildingUid]) {
            update();
        }
    });

    game.eventEmitter.on("CameraUpdate", () => {
        // shouldUpdateRanges = true;
        update();
    });
    game.eventEmitter.on("BuildingsUpdated", () => {
        // shouldUpdateRanges = true;
        update();
    });

    game.eventEmitter.on("27Up", stopWatching);
    game.eventEmitter.on("69Up", upgradeBuilding);
    game.eventEmitter.on("84Up", sellBuilding);

    const t = (t) => {
        // shouldUpdateRanges = true;
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
                <button class="flex-1 bg-accent-purple">Buy Drone</button>
                <button class="flex-1 bg-accent-gold">Set Target</button>
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
            "Harvester" != buildingId && t.stopPropagation();
        }}
        onmousedown={(t) => {
            t.stopPropagation();
        }}
    >
        <h2>{buildings[buildingUid]?.type.split(/(?=[A-Z])/).join(" ")}</h2>
        {#if buildingId == "Harvester"}
            <h3 class="absolute top-4 right-4">
                {droneCount}/{buildingData?.[buildingId]?.maxDrones?.[buildingTier - 1]} Drones
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
