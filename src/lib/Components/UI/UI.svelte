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

    let { game } = $props();
</script>

<div class="hud fixed w-screen h-screen z-20">
    <!-- Top -->
    <Debug {game} />
    <MenuIcons {game} />
    <Leaderboard {game} />

    <!-- Bottom -->
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

    <!-- Dynamic -->
    <BuildingOverlay {game} />

    <DayNightOverlay {game} />
    <Respawn {game} />
</div>
