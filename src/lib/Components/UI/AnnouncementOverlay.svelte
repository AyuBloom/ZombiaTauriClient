<script>
    let { game } = $props();

    $effect(() => {
        if (game.ui.announcement !== null) {
            setTimeout(() => {
                game.ui.announcement = null;
            }, game.ui.announcement.timeout);
        }
    });
</script>

{#if game.ui.announcement !== null}
    <p
        style="animation-duration: {game.ui.announcement.timeout}ms;"
        class="message fixed top-40 left-3/10 right-3/10 text-white text-2xl text-center z-40"
    >
        {game.ui.announcement.announcement}
    </p>
{/if}

<style lang="postcss">
    @keyframes hud-announcement-message {
        0% {
            transform: translateY(20px);
            opacity: 0;
        }
        20% {
            opacity: 1;
        }
        80% {
            opacity: 1;
        }
        100% {
            transform: translateY(-60px);
            opacity: 0;
        }
    }

    .message {
        font-family: "Hammersmith One", sans-serif;
        text-shadow:
            1px 1px #333,
            -1px 1px #333,
            1px -1px #333,
            -1px -1px #333;
        opacity: 0;
        animation-name: hud-announcement-message;
        animation-iteration-count: 1;
        animation-fill-mode: forwards;
        animation-timing-function: cubic-bezier(0, 0.42, 1, 0.58);
        -webkit-font-smoothing: antialiased;
    }
</style>
