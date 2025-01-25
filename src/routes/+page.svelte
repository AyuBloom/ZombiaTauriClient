<script>
    import Game from "$lib/Engine/Game.js";

    import Intro from "$lib/Components/Intro/Intro.svelte";
    import UI from "$lib/Components/UI/UI.svelte";

    /*
    import { invoke } from "@tauri-apps/api/core";

    let name = $state("");
    let greetMsg = $state("");

    async function greet(event) {
        event.preventDefault();
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        greetMsg = await invoke("greet", { name });
    }
    */

    const game = Game;
    game.init();

    window.game = game;
</script>

<Intro {game} />
<UI {game} />
