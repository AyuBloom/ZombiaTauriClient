<script>
    let { game } = $props();

    import { slide } from "svelte/transition";
    import { expoInOut } from "svelte/easing";

    let isTyping = $state(false);

    let msgs = $state([]);
    let channels = ["All", "Party"];

    let msg = $state("");
    let channel = $state(0);

    game.eventEmitter.on("ReceiveChatMessageRpcReceived", (t) => {
        msgs.push({ ...t, date: Date.now() }); // <-- unsure if i want to add date
    });
    game.eventEmitter.on("13Up", () => {
        if (isTyping) {
            msg.trim().length > 0 &&
                game.network.sendRpc({
                    name: "SendChatMessage",
                    message: msg.trim(),
                    channel: channels[channel],
                });
            msg = "";
            isTyping = false;
        } else {
            isTyping = true;
        }
    });
    game.eventEmitter.on("27Up", () => {
        1 == isTyping && (isTyping = false);
    });
    game.eventEmitter.on("mouseDown", () => {
        1 == isTyping && (isTyping = false);
    });
</script>

{#if isTyping}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        onmouseup={(t) => {
            t.stopPropagation();
        }}
        onmousedown={(t) => {
            t.stopPropagation();
        }}
        transition:slide={{ axis: "x", easing: expoInOut, duration: 500 }}
        class="absolute top-0 left-0 h-60 w-80 p-2 rounded-br-md bg-black/40 text-white"
    >
        <div class="min-w-76">
            {#each msgs as { channel, message, date }}
                <p class="flex flex-row gap-1 relative mb-1">
                    <strong class="text-accent-red font-bold">[{channel}]&nbsp;</strong>
                    {message}
                    <!-- <span class="absolute opacity-70">{new Date(date).toLocaleDateString()}</span> -->
                </p>
            {/each}
        </div>
        <input
            class="absolute -ml-2 bottom-0 h-10 w-full border-t-2 border-white/20"
            onclick={(t) => {
                t.stopPropagation();
            }}
            bind:value={msg}
        />
    </div>
{/if}
