<script>
    let { game } = $props();

    const stats = {
        Range: "towerRadius",
        "Damage To Zombies": "damageToZombies",
        "Damage To Buildings": "damageToBuildings",
        "Damage To Players": "damageToPlayers",
        "Harvest Amount": "harvestAmount",
        "Firing Rate": "msBetweenFires",
        "Health Regen/sec": "healthRegenPerSecond",
        "Max Health": "health",
    };

    let toolData = $derived(game.ui.toolData);
    let tools = $state({});

    let currentHover = $state("");
    let description = $state("");

    let tabs = ["Tools", "Armour"];
    let currentTab = $state(tabs[0]);

    $effect(() => {
        console.log($state.snapshot(toolData));
    });

    game.eventEmitter.on("SetToolRpcReceived", (t) => {
        console.log(t);
        // ["Tools", "Armour"].indexOf(tools[e.toolName].class) > -1 &&
        for (const e of t) tools[e.toolName] = e.toolTier;
    });
</script>

{#snippet Tabs()}
    <div>
        {#each tabs as tab}
            <button
                class="{currentTab == tab
                    ? 'active'
                    : ''} bg-black/40 text-white/70 text-xs text-center p-2 pl-3 pr-3 transition first:rounded-tl-md last:rounded-tr-md hover:bg-black/20"
                onclick={() => (currentTab = tab)}>{tab}</button
            >
        {/each}
    </div>
{/snippet}

{#snippet Item(
    isBought,
    isMax,
    shouldDisplayTier,
    canAfford,
    { _class, name, tiers, goldCosts, _description },
)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        onmouseenter={() => {
            description = _description;
            currentHover = name;
        }}
        class="{isMax
            ? 'disabled'
            : ''} relative flex flex-row gap-2 h-16 w-full bg-white/10 rounded-md p-2"
    >
        <img
            class="w-12 h-12"
            alt={name}
            src="/images/Ui/Icons/{_class}/{name}{tiers > 0
                ? `Tier${0 == tools[name] ? 1 : shouldDisplayTier}`
                : ''}.svg"
        />
        <div class="flex flex-col -mt-1">
            <p class="text-white">{name.split(/(?=[A-Z])/).join(" ")}</p>
            <span class="text-[0.625rem] text-white/70">Tier {shouldDisplayTier}</span>
            <span
                class="{canAfford
                    ? 'can-afford'
                    : 'cannot-afford'} text-[0.625rem] transition"
                >{goldCosts[shouldDisplayTier - 1].toLocaleString()} gold</span
            >
        </div>
        {#if !isMax}
            <button
                onclick={() => {
                    game.network.sendRpc({
                        name: "BuyTool",
                        toolName: name,
                    });
                }}
                class="{canAfford
                    ? ''
                    : 'disabled'} absolute bottom-2 right-2 bg-accent-green text-white p-2 pt-1 pb-1 rounded transition hover:brightness-125"
                >{isBought ? "Upgrade" : "Buy"}</button
            >
        {/if}
    </div>
{/snippet}

{#snippet Stats()}
    {#if currentHover}
        {@const currentTier = tools[currentHover] || 0}
        {@const isBought = currentTier >= 1}
        <!-- {@const isMax = isBought && currentTier >= toolData[currentHover].tiers} -->
        <div class="flex flex-col gap-2 mt-4">
            {#each Object.entries(stats) as [name, prop]}
                {#if toolData[currentHover][prop]}
                    {@const currentTierStat =
                        toolData[currentHover][prop][currentTier - 1]}
                    {@const nextTierStat = toolData[currentHover][prop][currentTier]}
                    {@const isDifferent = nextTierStat != currentTierStat}
                    {@const isPercentage =
                        prop == "damageToBuildings" && currentHover == "Sword"}
                    {@const isMilisecond = prop == "msBetweenFires"}
                    <p class="text-white font-bold">{name}:</p>
                    <p class="-mt-1">
                        {#if isBought}
                            {#if isPercentage}
                                {currentTierStat * 100 + "%"}
                            {:else if isMilisecond}
                                {currentTierStat + "ms"}
                            {:else}
                                {currentTierStat}
                            {/if}
                        {/if}
                        {#if isBought && isDifferent}
                            <!-- && !isMax -->
                            &nbsp;→&nbsp;
                        {/if}
                        {#if isDifferent}
                            <!-- && !isMax -->
                            {#if isPercentage}
                                {nextTierStat * 100 + "%"}
                            {:else if isMilisecond}
                                {nextTierStat + "ms"}
                            {:else}
                                {nextTierStat}
                            {/if}
                        {/if}
                    </p>
                {/if}
            {/each}
        </div>
    {/if}
{/snippet}

{#if game.ui.isDisplayingMenu == "Shop"}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        onmouseup={(t) => {
            t.stopPropagation();
        }}
        onmousedown={(t) => {
            t.stopPropagation();
        }}
        class="absolute flex flex-col top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md w-[70vw] min-w-110 max-w-140 h-100 p-4 bg-black/30"
    >
        <button
            class="absolute text-white text-2xl top-2 right-4 rotate-45 transition opacity-70 hover:opacity-100"
            onclick={() => game.ui.hideMenu()}>+</button
        >
        <div class="basis-1/6">
            <h2 class="text-white mb-2">Shop</h2>
            {@render Tabs()}
        </div>
        <div
            onmouseleave={() => {
                description = "";
                currentHover = "";
            }}
            class="flex flex-row basis-5/6 w-full bg-black/20 rounded-md rounded-tl-none"
        >
            <div
                class="flex flex-col min-w-3/5 basis-3/5 w-full gap-2 p-2 overflow-y-auto"
            >
                {#each Object.values(toolData) as { class: _class, name, tiers, goldCosts, description: _description }}
                    {#if ["Tools", "Armour"].indexOf(_class) > -1}
                        {@const isBought = tools[name] >= 1}
                        {@const isMax = isBought && tools[name] >= tiers}
                        {@const shouldDisplayTier = isBought
                            ? isMax
                                ? tools[name]
                                : tools[name] + 1
                            : 1}
                        {@const canAfford =
                            goldCosts[shouldDisplayTier - 1] <= game.ui.playerTick?.gold}
                        {#if _class == currentTab}
                            {@render Item(isBought, isMax, shouldDisplayTier, canAfford, {
                                _class,
                                name,
                                tiers,
                                goldCosts,
                                _description,
                            })}
                        {/if}
                    {/if}
                {/each}
            </div>
            <div class="p-2 basis-2/5 text-white/70 text-xs">
                <p>{description}</p>
                {@render Stats()}
            </div>
        </div>
    </div>
{/if}

<style lang="postcss">
    @reference "../../../app.css";

    button {
        font-family: "Hammersmith One", Arial, Helvetica, sans-serif;
    }
    .active {
        @apply bg-black/20;
    }
    .disabled {
        pointer-events: none;
        opacity: 0.5 !important;
    }
    .can-afford {
        @apply text-white/70;
    }
    .cannot-afford {
        @apply text-accent-red/70;
    }
</style>
