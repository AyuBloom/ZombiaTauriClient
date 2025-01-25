<script>
    let { game } = $props();

    let isDead = $state(false);
    let respawnText = $state("");

    game.eventEmitter.on("DeadRpcReceived", (t) => {
        isDead = true;

        let e = "a staggering";
        switch (
            (t.wave <= 5
                ? (e = "a disappointing")
                : t.wave <= 50
                  ? (e = "a fine")
                  : t.wave <= 100
                    ? (e = "a decent")
                    : t.wave <= 300
                      ? (e = "a strong")
                      : t.wave <= 1e3
                        ? (e = "an impressive")
                        : t.wave <= 2e4
                          ? (e = "a staggering")
                          : t.wave > 2e4 &&
                            (e = "an amazing (I sure hope you didn't cheat)"),
            t.reason)
        ) {
            case "FactoryDied":
                respawnText = `Your base was destroyed after ${e} ${parseInt(t.wave)?.toLocaleString()} waves and ${parseInt(t.score)?.toLocaleString()} score. Totalling ${parseInt(t.partyScore).toLocaleString()} score across your party.`;
                break;
            case "KilledWithBase":
                respawnText = `Your player got killed at wave ${parseInt(t.wave)?.toLocaleString()} with a score of ${parseInt(t.score)?.toLocaleString()}; but fear not! Your base remains.`;
                break;
            case "Killed":
                respawnText =
                    "Your player got killed. Too bad you don't have a base to return to.";
        }
        /*
    dr.ui.components.uiMenuGridParties.hide(),
    dr.ui.components.uiMenuGridSettings.hide(),
    dr.ui.components.uiMenuGridShop.hide(),
    dr.ui.components.uiMenuGridSpells.hide()
    */
    });
    game.eventEmitter.on("RespawnedRpcReceived", () => {
        isDead = false;
    });
</script>

{#if isDead}
    <div
        class="absolute w-1/2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs bg-black/40 p-4 rounded-sm z-40"
    >
        <div>{respawnText}</div>
    </div>
{/if}
