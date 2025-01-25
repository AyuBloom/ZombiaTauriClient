<script>
    import SideBar from "./SideBar.svelte";
    import Footer from "./Footer.svelte";
    import Leaderboard from "./Leaderboard.svelte";

    import { gameOptions } from "./Intro-shared.svelte.js";
    import servers from "$lib/Assets/servers.json";

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
            gameOptions.playerName,
            gameOptions.psk,
            servers.find((server) => server.id == gameOptions.selectedServer),
        );
        game.network.connect();
    }

    game.eventEmitter.once("EnterWorldResponse", (e) => {
        e.allowed && (inGame = true);
    });
</script>

{#if !inGame}
    <div class="hud-intro flex w-screen h-screen z-30">
        <SideBar />
        <div class="relative w-screen text-xl text-white">
            <button
                type="submit"
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition p-2 rounded-sm bg-green-600 hover:bg-green-500"
                onclick={connect}>Play</button
            >
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
</style>
