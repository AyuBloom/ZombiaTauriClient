<script>
    let { game } = $props();
</script>

{#if game.ui.isDisplayingMenu == "Shop"}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        onclick={(t) => t.stopPropagation()}
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md w-[70vw] h-100 bg-black/30"
    >
        <div></div>
    </div>
{/if}

<style lang="postcss">
</style>
