<script>
    import { flip } from "svelte/animate";
    import { fade, fly } from "svelte/transition";

    let { game } = $props();

    let shouldDisplay = $state({});

    let failures = $derived(
        Object.values(shouldDisplay).filter((e) => e.type == "failure"),
    );
    let confirmations = $derived(
        Object.values(shouldDisplay).filter((e) => e.type == "confirmation"),
    );

    $effect(() => {
        if (game.ui.popup === undefined && game.ui.pendingPopups[0] !== undefined) {
            game.ui.popup = game.ui.pendingPopups.shift();
        }
    });

    $effect(() => {
        if (game.ui.popup !== undefined) {
            const key = game.ui.popup.message;

            switch (game.ui.popup.type) {
                case "failure":
                    if (!(game.ui.popup.message in shouldDisplay)) {
                        shouldDisplay[key] = game.ui.popup;
                        setTimeout(() => {
                            delete shouldDisplay[key];
                        }, 6000);
                    }
                    game.ui.popup = undefined;
                    break;
                case "confirmation":
                    if (!(game.ui.popup.message in shouldDisplay)) {
                        shouldDisplay[key] = game.ui.popup;
                        shouldDisplay[key].timeoutCallback = () => {
                            delete shouldDisplay[key];
                            game.ui.popup = undefined;
                        };
                        shouldDisplay[key].timeout = setTimeout(
                            shouldDisplay[key].timeoutCallback,
                            15000,
                        );
                    }
                    break;
                default:
                    console.log("what the fuck is THIS?", game.ui.popup);
            }
        }
    });
</script>

<div>
    {#each failures as failure, i (failure)}
        <p
            in:fade={{ duration: 200 }}
            out:fly={{ y: -50 }}
            animate:flip={{ duration: 200 }}
            style="top: calc(55% + {(20 * i) / 16}rem)"
            class="absolute w-full text-center transition text-white text-xs pointer-events-none"
        >
            {failure.message}
        </p>
    {/each}

    {#each confirmations as confirmation}
        <div
            transition:fade={{ duration: 200 }}
            class="absolute w-full h-full backdrop-blur-xs z-50"
        >
            <div
                class="absolute w-2/5 left-3/10 top-1/2 -translate-y-1/2 rounded-sm bg-black/30 p-4"
            >
                <p class="text-white text-xs">{@html confirmation.message}</p>
                <div class="float-right font-bold">
                    <button
                        onclick={() => {
                            confirmation.callback();
                            clearTimeout(confirmation.timeout);
                            confirmation.timeoutCallback();
                        }}
                        class="text-accent-green hover:brightness-125">&check;</button
                    >
                    <button
                        onclick={() => {
                            clearTimeout(confirmation.timeout);
                            confirmation.timeoutCallback();
                        }}
                        class="text-accent-red hover:brightness-125">&cross;</button
                    >
                </div>
            </div>
        </div>
    {/each}
</div>
