<script>
    let { game } = $props();

    let fps = $state(0);
    let frameTime = $state(0);
    let isWebGL = $state(false);
    let isWebGPU = $state(false);

    game.eventEmitter.on("EntityUpdate", (e) => {
        frameTime = e.averageServerFrameTime;
    });
    game.eventEmitter.on("RendererUpdated", () => {
        fps = game.renderer.replicator.getFps();

        isWebGL = game.renderer.renderer.renderer instanceof PIXI.WebGLRenderer;
        isWebGPU = game.renderer.renderer.renderer instanceof PIXI.WebGPURenderer;
    });
</script>

<div class="absolute bottom-24 left-2 text-white">
    <p class={frameTime > 50 ? "overloaded" : frameTime > 30 ? "stressed" : ""}>
        {game.network.ping}ms {frameTime > 50
            ? `(` + (50 - frameTime).toFixed(2) + `ms)`
            : ""}
    </p>
    <p class="sm:hidden">
        {Math.round(fps)} FPS - {isWebGL ? "WebGL" : isWebGPU ? "WebGPU" : "Canvas"}
    </p>
</div>

<style lang="postcss">
    @reference "../../../app.css";

    div {
        font-family: "Hammersmith One", Arial, Helvetica, sans-serif;
    }
    .stressed {
        @apply text-orange-400;
    }
    .overloaded {
        @apply text-accent-red;
    }
</style>
