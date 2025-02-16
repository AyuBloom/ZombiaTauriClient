<script>
    import tippy from "tippy.js";

    let { game } = $props();

    let buildings = $state([]);

    game.eventEmitter.on("BuildingDataReceived", () => {
        const t = game.ui.buildingData;
        buildings = [];
        for (const buildingData of Object.values(t)) {
            buildings.push(buildingData.name);
            if (void 0 !== buildingData.hotkey) {
                game.eventEmitter.on(
                    `${buildingData.hotkey.toString().charCodeAt(0)}Up`,
                    () => {
                        game.ui.PlacementOverlay.startPlacing(buildingData.name);
                    },
                );
            }
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
    class="absolute flex flex-row justify-between md:justify-normal left-1 bottom-1 w-screen overflow-x-auto scroll-p"
>
    {#each buildings as tower}
        {#if tower !== "Factory" || game.ui.factory === null}
            <button
                class="{tower !== 'Factory' && game.ui.factory === null
                    ? 'disabled'
                    : ''} relative lg:min-w-12 lg:w-12 lg:h-12 w-10 min-w-10 h-10 p-1 bg-black/30 m-1 rounded-sm transition hover:bg-black/10 hover:brightness-150"
                onmouseup={(t) => {
                    t.stopPropagation();
                }}
                onmousedown={(t) => {
                    t.stopPropagation();
                }}
                onclick={() => {
                    if (game.ui.PlacementOverlay.buildingType) {
                        game.ui.PlacementOverlay.cancelPlacing();
                    } else {
                        game.ui.PlacementOverlay.startPlacing(tower);
                    }
                }}
                use:tooltip={() => {
                    return {
                        content: `<strong>${tower.split(/(?=[A-Z])/).join(" ")}</strong><span>${game.ui.buildingData[tower].built}/${game.ui.buildingData[tower].limit}</span>`,
                        allowHTML: true,
                        animation: false,
                    };
                }}
            >
                <img
                    class="lg:w-10 lg:h-10 w-8 h-8"
                    alt={tower}
                    src="/images/Ui/Buildings/{tower}/{tower}Tier1.svg"
                />
                <span class="absolute bottom-0 right-1 font-bold text-xs text-white/70"
                    >{game.ui.buildingData[tower].hotkey}</span
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
