<script>
    import tippy from "tippy.js";

    let { game } = $props();

    let buildings = $state([]);

    const TOWER_KEYBINDS = {
        Wall: "1",
        Door: "2",
        LightningTower: "3",
        ArrowTower: "4",
        CannonTower: "5",
        SawTower: "6",
        RocketTower: "7",
        MageTower: "8",
        Drill: "9",
        Harvester: "0",
    };

    game.eventEmitter.on("BuildingDataReceived", () => {
        const t = game.ui.buildingData;
        buildings = [];
        for (const buildingData of Object.values(t)) {
            buildings.push({
                tower: buildingData.name,
                tier: 1, // buildingData.tier,
                keybind: TOWER_KEYBINDS[buildingData.name],
            });
        }
    });

    function tooltip(node, fn) {
        $effect(() => {
            const tooltip = tippy(node, fn());

            return tooltip.destroy;
        });
    }
</script>

<div
    style="scrollbar-width: none;"
    class="fixed flex flex-row left-1 bottom-1 w-screen overflow-x-auto scroll-p"
>
    {#each buildings as { tower, tier, keybind }}
        {#if tower !== "Factory" || game.ui.factory === null}
            <button
                class="{tower !== 'Factory' && game.ui.factory === null
                    ? 'disabled'
                    : ''} relative min-w-12 w-12 h-12 p-1 bg-black/30 m-1 rounded-sm transition hover:bg-black/10 hover:brightness-150"
                onclick={() => game.ui.PlacementOverlay.startPlacing(tower)}
                use:tooltip={() => {
                    return {
                        content: `<strong>${tower.split(/(?=[A-Z])/).join(" ")}</strong><span>${game.ui.buildingData[tower].built}/${game.ui.buildingData[tower].limit}</span>`,
                        allowHTML: true,
                        animation: false,
                    };
                }}
            >
                <img
                    class="w-10 h-10"
                    alt={tower}
                    src="/images/Ui/Buildings/{tower}/{tower}Tier{tier}.svg"
                />
                <span class="absolute bottom-0 right-1 font-bold text-xs text-white/70"
                    >{keybind}</span
                >
            </button>
        {/if}
    {/each}
</div>

<style lang="postcss">
    .disabled {
        pointer-events: none;
        opacity: 0.5 !important;
    }
</style>
