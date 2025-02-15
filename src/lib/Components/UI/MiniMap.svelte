<script>
    let { game } = $props();
    import { gameOptions } from "$lib/Engine/shared.svelte.js";

    import { innerWidth } from "svelte/reactivity/window";

    let BUILDING_BAR_WIDTH = $derived.by(() => {
        let defaultValue = 672;

        if (game.ui.factory) defaultValue -= 64;
        if (gameOptions.mode === "standard") defaultValue += 48;

        return defaultValue;
    });
    const MINIMAP_WIDTH = 160;
    let MOVE_WHEN = $derived(innerWidth.current < BUILDING_BAR_WIDTH + MINIMAP_WIDTH);

    let playerData = $state({});
    let buildingData = $state({});

    const COLOR_BY_INDEX = ["#0096FF", "#8473d4", "#2ee322", "#e69050"];

    game.eventEmitter.on("RendererUpdated", () => {
        for (const uid in playerData) {
            const player = playerData[uid],
                entity = game.renderer.world.entities[uid];
            if (!entity) {
                player.shouldShow = false;
                continue;
            }
            const n = (entity.getPositionX() / game.renderer.worldSize.x) * 100,
                i = (entity.getPositionY() / game.renderer.worldSize.y) * 100;
            // e.marker.setAttribute("data-index", e.index.toString());
            player.shouldShow = true;
            player.position.x = n;
            player.position.y = i;
        }
    });

    game.eventEmitter.on("PartyMembersUpdated", (data) => {
        const shouldDelete = {};
        for (const uid in playerData) {
            shouldDelete[uid] = true;
        }
        for (const i in data) {
            const index = parseInt(i),
                uid = data[i].uid;
            delete shouldDelete[uid];
            if (playerData[uid]) {
                playerData[uid].index = index;
            } else {
                /*
                const t = document.createElement("div");
                t.className = "hud-map-player",
                t.setAttribute("data-index", n),
                this.element.appendChild(t),
                */
                playerData[uid] = {
                    index,
                    position: {
                        x: null,
                        y: null,
                    },
                    shouldShow: false,
                };
            }
        }
        for (const uid in shouldDelete) {
            playerData[uid] && delete playerData[uid];
        }
    });
    /*
    game.eventEmitter.on("BuildingsUpdated", this.onBuildingsUpdate.bind(this));
    */
    game.eventEmitter.on("EnterWorldResponse", () => {
        // this.buildingElems[t].remove(),
        for (let t in buildingData) delete buildingData[t];
    });
</script>

<div
    style="bottom: {MOVE_WHEN ? '4rem' : '0.5rem'};"
    class="absolute right-1 w-36 h-36 sm:w-30 sm:h-30 bg-black/40 rounded-sm"
>
    {#each Object.values(playerData) as player}
        <div
            class="absolute w-1 h-1 -mt-[0.125rem] -ml-[0.125rem] rounded-full z-2"
            style="background: {COLOR_BY_INDEX[player.index]};display: {player.shouldShow
                ? 'block'
                : 'none'}; left: {player.position.x}%; top: {player.position.y}%;"
        ></div>
    {/each}
</div>

<style lang="postcss">
</style>
