<script>
    import Game from "$lib/Engine/Game.js";

    import Intro from "$lib/Components/Intro/Intro.svelte";
    import UI from "$lib/Components/UI/UI.svelte";

    const game = Game;
    game.init();

    window.game = game;
</script>

<Intro {game} />
<UI {game} />
