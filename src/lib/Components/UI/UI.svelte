<script>
    import Debug from "./Debug.svelte";
    import BuildingBar from "./BuildingBar.svelte";
    import Leaderboard from "./Leaderboard.svelte";
    import DayNightTicker from "./DayNightTicker.svelte";
    import MiniMap from "./MiniMap.svelte";
    import ToolBar from "./ToolBar.svelte";
    import DayNightOverlay from "./DayNightOverlay.svelte";
    import Respawn from "./Respawn.svelte";
    import Resources from "./Resources.svelte";
    import BuildingOverlay from "./BuildingOverlay.svelte";
    import MenuIcons from "./MenuIcons.svelte";
    import MenuShop from "./MenuShop.svelte";
    import Consumables from "./Consumables.svelte";
    import Chat from "./Chat.svelte";
    import MenuParties from "./MenuParties.svelte";
    import PipOverlay from "./PipOverlay.svelte";
    import AnnouncementOverlay from "./AnnouncementOverlay.svelte";
    import PopupOverlay from "./PopupOverlay.svelte";

    import { gameSettings } from "$lib/Engine/shared.svelte";
    import MenuSettings from "./MenuSettings.svelte";

    let { game } = $props();

    gameSettings.start();

    window.gameSettings = gameSettings;

    $effect(() => {
        gameSettings.state && gameSettings.save();
    });
</script>

<div class="hud absolute w-screen h-screen top-0 left-0 z-20">
    <!-- Top -->
    <Chat {game} />
    <MenuIcons {game} />
    <Leaderboard {game} />
    <AnnouncementOverlay {game} />

    <!-- Bottom -->
    <Debug {game} />
    <MiniMap {game} />
    <Consumables {game} />
    <ToolBar {game} />
    <BuildingBar {game} />

    <!-- Left -->

    <DayNightTicker {game} />

    <!-- Right -->
    <Resources {game} />

    <!-- Center -->
    <MenuShop {game} />
    <MenuParties {game} />
    <MenuSettings {game} />

    <!-- Dynamic -->
    <PipOverlay {game} />
    <PopupOverlay {game} />
    <BuildingOverlay {game} />

    <DayNightOverlay {game} />
    <Respawn {game} />
</div>
