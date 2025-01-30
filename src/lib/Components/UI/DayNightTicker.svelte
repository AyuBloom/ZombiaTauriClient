<script>
    let { game } = $props();
    import { gameOptions } from "$lib/Components/Intro/Intro-shared.svelte.js";

    let TICKER_WIDTH = 130;

    let dayLength = 0;
    let nightLength = 0;
    let cycleLength = 0;

    let announcedNight = false;

    let defaultStartingWave = $derived(gameOptions.mode == "standard" ? 0 : 15);
    let cumulativeWave = $state(0);
    let nextWave = $state(0);

    $effect(() => {
        nextWave = defaultStartingWave + cumulativeWave;
    });

    let delta = $state(0);
    let deltaNext = $state(65);

    game.eventEmitter.on("UpdateDayNightCycleRpcReceived", (t) => {
        nightLength = t.nightLength;
        dayLength = t.dayLength;
        cycleLength = dayLength + nightLength;
    });

    game.eventEmitter.on("RendererUpdated", () => {
        if (null == cycleLength) return;
        const t = game.renderer.replicator.getTickIndex(),
            e = cycleLength - (t % cycleLength),
            r = t % cycleLength < dayLength;
        if (true === r) {
            let e = dayLength - (t % cycleLength);
            if (false === announcedNight && e <= dayLength / 5) {
                announcedNight = true;
                game.ui.announcement = {
                    announcement: "Night is fast approaching. Get to safety...",
                    timeout: (dayLength / 5) * game.renderer.replicator.msPerTick,
                };
            }
        } else if (false === r) {
            announcedNight = false;
        }
        const percentageOfCycle = e / cycleLength;
        delta = TICKER_WIDTH * percentageOfCycle - TICKER_WIDTH / 2;

        if (delta >= 0.5 && nextWave == game.ui.playerTick?.wave) cumulativeWave++;

        const percentageTillNextWave = 1 - percentageOfCycle;
        deltaNext = TICKER_WIDTH * percentageTillNextWave;
    });
</script>

<div
    class="absolute -left-12 top-1/2 -translate-y-1/2 w-[8.625rem] h-6 bg-black/30 rounded-sm -rotate-90"
>
    <div class="ticker" style="background-position: {delta}px 0;"></div>
    {#if nextWave != defaultStartingWave && game.ui.factory !== null}
        <div class="marker" style="right: {deltaNext + 4}px;">
            <div
                class="absolute text-left top-full left-1/2 -translate-x-1/2 rotate-90 text-white font-bold text-xs"
            >
                {nextWave}
            </div>
        </div>
    {/if}
</div>

<style lang="postcss">
    .ticker {
        position: absolute;
        width: 130px;
        height: 16px;
        top: 4px;
        left: 4px;
        background: url("/images/Ui/Icons/TimeBar.png") repeat-x;
        overflow-y: visible;
    }
    .ticker::after {
        content: " ";
        position: absolute;
        top: -2px;
        left: 64px;
        width: 2px;
        height: 20px;
        background: #fff;
    }
    .marker {
        position: absolute;
        top: 4px;
        width: 2px;
        height: 16px;
        background: #fff;
    }
</style>
