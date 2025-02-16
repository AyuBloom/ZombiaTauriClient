<script>
    let { game } = $props();
</script>

{#if game.ui.isDisplayingMenu == "Settings"}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        onmouseup={(t) => {
            t.stopPropagation();
        }}
        onmousedown={(t) => {
            t.stopPropagation();
        }}
        class="absolute flex flex-col top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm w-[70vw] min-w-110 max-w-140 h-100 p-4 bg-black/30"
    >
        <button
            class="absolute text-white text-2xl top-2 right-4 rotate-45 transition opacity-70 hover:opacity-100"
            onclick={() => game.ui.hideMenu()}>+</button
        >
        <h2 class="text-white mb-2">Settings</h2>
        <div class="flex flex-row grow w-full p-2 bg-black/20 rounded-sm rounded-tl-none">
            <button
                class="h-10 p-2 rounded text-white transition bg-accent-red hover:brightness-125"
                onclick={() => {
                    game.ui.pendingPopups.push({
                        type: "confirmation",
                        message: "Reload the game? Changes you made may not be saved.",
                        callback: () => {
                            location.reload();
                        },
                    });
                }}>Reload game</button
            >
        </div>
    </div>
{/if}
