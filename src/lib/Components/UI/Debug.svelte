<script>
    let { game } = $props();
    let fps = $state(0);
    game.eventEmitter.on("RendererUpdated", () => {
        fps = game.renderer.replicator.getFps();
    });
</script>

<div>
    <p>{game.network.ping}ms</p>
    <p>{Math.round(fps)} FPS</p>
</div>

<style lang="postcss">
    div {
        font-family: "Hammersmith One";
    }
</style>
