<script>
    let { game } = $props();
    import { gameOptions } from "$lib/Engine/shared.svelte.js";

    import Long from "long";
    import { isMobile } from "pixi.js";

    // const MARGIN_TO_CENTER = 50;

    let data = $state([
        {
            uid: game.ui.playerTick?.uid,
            rank: "-",
            name: gameOptions.playerName || "Player",
            score: 0,
            wave: 0,
        },
    ]);
    game.eventEmitter.on("UpdateLeaderboardRpcReceived", (e) => {
        data = e;
    });
    /*
    window.addEventListener("resize", () => {
      const leaderboard = document.querySelector('.hud-leaderboard');
      const rect = leaderboard.getBoundingClientRect();
      const shouldTruncate = (innerHeight / 2 - MARGIN_TO_CENTER) < rect.height;
    });
    */
</script>

<div
    class="hud-leaderboard absolute w-72 top-0 right-0 text-xs bg-black/40 p-3 rounded-bl-md"
>
    <div>
        <span class="rank">Rank</span>
        <span class="name">Name</span>
        <span class="score">Score</span>
        <span class="wave">Wave</span>
    </div>
    {#each data as player, i}
        {#if !isMobile.any || i < 5}
            {@const shouldHighlight =
                player.uid == game.renderer.world.localPlayer ? "currentPlayer" : ""}
            <div>
                <span class="rank {shouldHighlight}">#{player.rank}</span>
                <strong class="name {shouldHighlight}">{player.name}</strong>
                <strong class="score {shouldHighlight}"
                    >{new Long(player.score).toNumber().toLocaleString()}</strong
                >
                <strong class="wave {shouldHighlight}">{new Long(player.wave)}</strong>
            </div>
        {/if}
    {/each}
</div>

<style lang="postcss">
    @reference "tailwindcss/theme";

    div > div {
        @apply relative mb-1 last:mb-0 pr-24 pl-10 h-5;
    }
    span {
        @apply text-white/70 text-[0.625rem];
    }
    strong {
        @apply text-white text-[0.625rem] font-normal;
    }
    span.currentPlayer {
        @apply text-yellow-500/70;
    }
    strong.currentPlayer {
        @apply text-yellow-500;
    }
    .rank {
        @apply absolute top-0 bottom-0 left-0;
    }
    .score {
        @apply absolute top-0 bottom-0 right-12;
    }
    .wave {
        @apply absolute top-0 bottom-0 right-0;
    }
</style>
