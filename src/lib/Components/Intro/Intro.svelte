<script>
    import SideBar from "./SideBar.svelte";
    import Footer from "./Footer.svelte";
    import Leaderboard from "./Leaderboard.svelte";

    import { gameOptions, psk } from "$lib/Engine/shared.svelte.js";
    import servers from "$lib/Assets/servers.json";
    import { fade } from "svelte/transition";
    import { isMobile } from "pixi.js";

    const { game } = $props();
    let inGame = $state(false);

    // let introAnimation = $state(true);
    function connect() {
        /*
        if (!this.playElem.classList.contains("is-disabled")) {
            this.playElem.innerHTML = "<span class='hud-loading'></span>";
        }
        */
        game.network.setConnectionData(
            gameOptions.state.playerName,
            psk.value,
            servers.find((server) => server.id == gameOptions.state.selectedServer),
        );
        game.network.connect();
    }

    game.eventEmitter.once("EnterWorldResponse", (e) => {
        e.allowed && (inGame = true);
    });

    /* will try this when... i have time
    game.eventEmitter.once("EntityUpdate", ({ entities }) => {
        for (let uid in entities) {
            const entity = entities[uid];
            if (entity === true) continue;

            const { x, y } = game.renderer.worldToUi(entity.position);

        }
    });
    */

    window.gameOptions = gameOptions;
    gameOptions.start();
    $effect(() => {
        gameOptions.state && gameOptions.save();
    });

    $effect(() => {
        if (psk.value && psk.value.includes("zombia.io")) {
            psk.value = psk.value.split("/").pop();
        }
    });
</script>

{#if !inGame}
    <div out:fade={{ delay: 100 }} class="hud-intro absolute flex w-screen h-screen z-50">
        <SideBar />
        <div class="relative w-screen text-xl text-white">
            <button
                type="submit"
                class="{game.network.connecting || game.network.connected
                    ? 'disabled'
                    : ''} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-sm w-40 transition"
                onclick={connect}
            >
                <p class="font-bold text-3xl">Play</p>
                <hr class="w-full border mt-2 mb-2" />
                <span class="text-xl">{isMobile.any ? "Tap" : "Click"} to enter</span>
            </button>
            <Footer />
            <Leaderboard />
        </div>
    </div>
{/if}

<style lang="postcss">
    @reference "tailwindcss/theme";

    @keyframes moveBackground {
        0% {
            background-position: 0 0;
        }
        100% {
            background-position: 0 -24px;
        }
    }
    .hud-intro::before {
        @apply fixed top-0 bottom-0 left-0 right-0 bg-repeat -z-10;
        content: " ";
        background-image: url("/images/Map/Grass.svg");
        background-size: 24px;
        animation: moveBackground 1s linear infinite;
    }
    .hud-intro::after {
        @apply fixed top-0 bottom-0 left-0 right-0 bg-black/60 -z-10;
        content: " ";
    }
    .disabled {
        pointer-events: none;
        opacity: 0.5 !important;
    }
</style>
