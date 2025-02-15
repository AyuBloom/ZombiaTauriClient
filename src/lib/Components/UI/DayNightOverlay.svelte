<script>
    let { game } = $props();

    let dayLength = 0;
    let nightLength = 0;
    let cycleLength = 0;

    let overlayOpacity = $state(1);

    game.eventEmitter.on("UpdateDayNightCycleRpcReceived", (t) => {
        nightLength = t.nightLength;
        dayLength = t.dayLength;
        cycleLength = dayLength + nightLength;
    });

    game.eventEmitter.on("RendererUpdated", () => {
        const t = game.renderer.replicator.getTickIndex();
        let e = 0,
            r = 0,
            n = 0;

        1 == t % cycleLength < dayLength
            ? ((e = 1 - (dayLength - (t % cycleLength)) / dayLength),
              (n = e < 0.1 ? 0.5 * (1 - e / 0.1) : e > 0.8 ? ((e - 0.8) / 0.2) * 0.5 : 0))
            : ((e = 1),
              (r = 1 - (nightLength - ((t - dayLength) % cycleLength)) / nightLength),
              (n =
                  r < 0.2
                      ? 0.5 + (r / 0.2) * 0.5
                      : r > 0.8
                        ? 0.5 + 0.5 * (1 - (r - 0.8) / 0.2)
                        : 1));

        overlayOpacity = n.toString();
    });
</script>

<div
    class="absolute w-full h-full pointer-events-none -z-1 transition"
    style="opacity: {overlayOpacity}"
></div>

<style lang="postcss">
    div {
        background: rgba(17, 8, 56, 0.4);
    }
</style>
