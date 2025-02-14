<script>
    import { fetch } from "@tauri-apps/plugin-http";
    import { flip } from "svelte/animate";
    import { fade } from "svelte/transition";

    let entries = $state(1);
    let category = $state("wave");
    let time = $state("24h");
    let mode = $state("standard");

    let loading = $state(true);

    let topEntries = $state([]);

    let loadedData = {};
    $effect(async () => {
        entries;
        if (loadedData[category]?.[time]?.[mode]) {
            const data = loadedData[category][time][mode];

            topEntries = data.slice(0, entries);
            loading = false;
        } else {
            loading = true;

            const data = await fetch(
                `http://zombia.io/leaderboard/data?category=${category}&time=${time}&gameMode=${mode}`,
            ).then((t) => t.json());

            topEntries = data.slice(0, entries);
            loading = false;

            loadedData[category] ||= {};
            loadedData[category][time] ||= {};
            loadedData[category][time][mode] = data;
        }
    });

    /*
    $effect(() => {
        console.log(topEntries.length + 1);
        if (entries > topEntries.length + 1) entries = topEntries.length + 1;
    });
    */
</script>

<div class="absolute top-4 left-4 z-40">
    <div class="text-white/50 text-sm mb-4">
        Top
        <input
            onkeydown={(e) => {
                e.preventDefault();
                return false;
            }}
            type="number"
            max="10"
            min="1"
            bind:value={entries}
        />
        <select bind:value={category}>
            <option value="wave">wave</option>
            <option value="score">score</option>
        </select>
        entries for
        <select bind:value={time}>
            <option value="24h">today</option>
            <option value="7d">this week</option>
            <option value="all">all time</option>
        </select>
        in
        <select bind:value={mode}>
            <option value="standard">standard</option>
            <option value="scarcity">scarcity</option>
        </select>
        :
    </div>
    <div class="flex flex-col flex-wrap h-[35vh]">
        {#if !loading}
            {#each topEntries as topEntry, i (topEntry)}
                <div
                    in:fade={{ duration: 200 }}
                    animate:flip={{ duration: 200 }}
                    class="text-white/50 text-sm mb-2 mr-2 overflow-x-hidden"
                >
                    <p>
                        {#each topEntry.players as playerName, index}
                            {#if index != 0}
                                <strong>&nbsp;{playerName}</strong>
                            {:else}
                                <strong>{playerName}</strong>
                            {/if}
                            {#if index != topEntry.players.length - 1}
                                -
                            {/if}
                        {/each}
                    </p>
                    <div class="flex flex-row">
                        {#if category == "wave"}
                            <p><strong>{topEntry.wave}</strong> waves</p>
                        {:else}
                            <p>
                                <strong>{topEntry.score.toLocaleString()}</strong> score
                            </p>
                        {/if}
                        <p>
                            &nbsp;- {new Date(topEntry.timeAchieved).toLocaleDateString()}
                        </p>
                        <p>
                            &nbsp;- v{topEntry.version}
                        </p>
                    </div>
                </div>
            {/each}
        {:else}
            <p class="text-white/50 text-sm">Loading...</p>
        {/if}
    </div>
</div>

<style lang="postcss">
    @reference "tailwindcss/theme";

    select,
    strong,
    input {
        @apply text-white;
    }
    select {
        @apply rounded-none border-b inline bg-transparent appearance-none;
    }
</style>
