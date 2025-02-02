<script>
    import Game from "$lib/Engine/Game.js";

    import Intro from "$lib/Components/Intro/Intro.svelte";
    import UI from "$lib/Components/UI/UI.svelte";
    import postcss from "postcss";

    const game = Game;
    game.init();

    window.game = game;
</script>

<Intro {game} />
<UI {game} />

<style lang="postcss">
    @reference "../app.css";

    :global {
        [data-tippy-root] {
            @apply bg-black/30 rounded-sm p-2;

            strong {
                @apply text-white;
            }
            span {
                @apply text-white/70 ml-2;
            }
        }
    }
</style>
