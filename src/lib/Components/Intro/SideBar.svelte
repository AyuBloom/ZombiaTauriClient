<script>
    import servers from "$lib/Assets/servers.json";
    import { gameOptions, psk } from "$lib/Engine/shared.svelte.js";

    const descriptionForModes = {
        standard:
            "Collect resources to build a base to defend against neverending zombies!",
        scarcity:
            "Start with a huge number of resources without being able to earn any more. PvP is disabled. Survive as long as you can!",
    };

    const defaultServer = {
        standard: "v01002",
        scarcity: "v01001",
    };

    const sortedServers = {};
    for (const server of servers) {
        sortedServers[server.gameMode] ||= {};
        sortedServers[server.gameMode][server.country] ||= {};
        sortedServers[server.gameMode][server.country][server.id] = server;
    }

    $effect(() => {
        gameOptions.state.selectedServer = defaultServer[gameOptions.state.mode];
    });
</script>

<div
    class="flex flex-col justify-between items-start hud-intro-sidebar max-w-48 bg-black/40 p-3"
>
    <div class="hud-intro-modes">
        <h2>Game Modes</h2>
        <select class="hud-intro-gamemode" bind:value={gameOptions.state.mode}>
            {#each Object.keys(sortedServers) as mode}
                <option value={mode}
                    >{mode.charAt(0).toUpperCase() + mode.slice(1)}</option
                >
            {/each}
        </select>
        <span class="sm:hidden text-white/50 text-xs"
            >{descriptionForModes[gameOptions.state.mode]}</span
        >
    </div>
    <div class="hud-intro-main">
        <h2>Game Options</h2>
        <input
            type="text"
            class="hud-intro-name"
            placeholder="Player name..."
            bind:value={gameOptions.state.playerName}
        />
        <select class="hud-intro-servers" bind:value={gameOptions.state.selectedServer}>
            {#each Object.entries(sortedServers) as [mode, countries]}
                {#if gameOptions.state.mode == mode}
                    {#each Object.entries(countries) as [country, servers]}
                        <optgroup label={country}>
                            {#each Object.entries(servers) as [id, server], index}
                                <option value={id}
                                    >{country} - {server.city} #{index + 1}</option
                                >
                            {/each}
                        </optgroup>
                    {/each}
                {/if}
            {/each}
        </select>
        <input
            type="text"
            class="hud-intro-invite"
            placeholder="Invite link..."
            bind:value={psk.value}
        />
    </div>
    <div class="hud-intro-settings">
        <h2>Settings</h2>
        {#each Object.keys(gameOptions.state.needsRestart) as setting}
            <div class="relative first:-mt-2">
                <input
                    type="checkbox"
                    onchange={location.reload()}
                    bind:checked={gameOptions.state.needsRestart[setting]}
                />
                <span class="text-white ml-1 text-xs">{setting}</span>
            </div>
        {/each}
    </div>
</div>

<style lang="postcss">
    @reference "tailwindcss/theme";

    @media only screen and (hover: none) {
    }

    div {
        @apply w-full;
    }
    h2 {
        @apply first:mb-4 relative text-xl font-bold text-white after:absolute after:-bottom-1 after:left-0 after:border after:border-white/30 after:w-12;
    }
    input[type="text"],
    select {
        @apply w-full h-10 appearance-none mb-2 p-2 text-white text-xs bg-black/30 rounded-sm placeholder:text-white/30;
    }
</style>
