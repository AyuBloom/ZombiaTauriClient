<script>
    import { fetch } from "@tauri-apps/plugin-http";

    let category = $state("wave");
    let time = $state("24h");
    let mode = $state("standard");

    let loading = $state(true);

    let topEntry = $state({});

    let loadedData = {};
    $effect(async () => {
        if (loadedData[category]?.[time]?.[mode]) {
            const data = loadedData[category][time][mode];

            topEntry = data[0];
            loading = false;
        } else {
            loading = true;

            const data = await fetch(
                `http://zombia.io/leaderboard/data?category=${category}&time=${time}&gameMode=${mode}`,
            ).then((t) => t.json());

            topEntry = data[0];
            loading = false;

            loadedData[category] ||= {};
            loadedData[category][time] ||= {};
            loadedData[category][time][mode] = data;
        }
    });
</script>

<div class="absolute top-4 left-4 z-40">
    <div class="text-white/50 text-sm mb-4">
        Top
        <select bind:value={category}>
            <option value="wave">wave</option>
            <option value="score">score</option>
        </select>
        for
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
    {#if !loading}
        <div class="text-white/50 text-sm">
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
                    <p><strong>{topEntry.score.toLocaleString()}</strong> score</p>
                {/if}
                <p>
                    &nbsp;- {new Date(topEntry.timeAchieved).toLocaleDateString()}
                </p>
                <p>
                    &nbsp;- v{topEntry.version}
                </p>
            </div>
        </div>
    {:else}
        <p class="text-white/50 text-sm">Loading...</p>
    {/if}
</div>

<style lang="postcss">
    @reference "tailwindcss/theme";

    select,
    strong {
        @apply text-white;
    }
    select {
        @apply rounded-none border-b inline bg-transparent appearance-none;
    }
</style>
