<script>
    import { isMobile } from "pixi.js";

    let { game } = $props();

    let fps = $state(0);
    let frameTime = $state(0);
    let isWebGL = $state(null);
    let isWebGPU = $state(null);

    game.eventEmitter.on("EntityUpdate", (e) => {
        frameTime = e.averageServerFrameTime;

        if (isWebGL === null || isWebGPU === null) {
            isWebGL = game.renderer.renderer.renderer instanceof PIXI.WebGLRenderer;
            isWebGPU = game.renderer.renderer.renderer instanceof PIXI.WebGPURenderer;
        }
    });
    game.eventEmitter.on("RendererUpdated", () => {
        fps = game.renderer.replicator.getFps();
    });
</script>

<div class="absolute lg:bottom-28 bottom-24 left-2 text-white">
    <p class={frameTime > 50 ? "overloaded" : frameTime > 30 ? "stressed" : ""}>
        {game.network.ping}ms {frameTime > 50
            ? `(` + (50 - frameTime).toFixed(2) + `ms)`
            : ""}
    </p>
    {#if !isMobile.any}
        <p>
            {Math.round(fps)} FPS - {isWebGL ? "WebGL" : isWebGPU ? "WebGPU" : "Canvas"}
        </p>
    {/if}
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
