<script>
    let { game } = $props();
    let fps = $state(0);
    let isWebGL = $state(false);
    let isWebGPU = $state(false);
    game.eventEmitter.on("RendererUpdated", () => {
        fps = game.renderer.replicator.getFps();
        isWebGL = game.renderer.renderer.renderer instanceof PIXI.WebGLRenderer;
        isWebGPU = game.renderer.renderer.renderer instanceof PIXI.WebGPURenderer;
    });
</script>

<div>
    <p>{game.network.ping}ms</p>
    <p>{Math.round(fps)} FPS</p>
    <p>{isWebGL ? "WebGL" : isWebGPU ? "WebGPU" : "NOT WebGL/WebGPU"}</p>
</div>

<style lang="postcss">
    div {
        font-family: "Hammersmith One";
    }
</style>
