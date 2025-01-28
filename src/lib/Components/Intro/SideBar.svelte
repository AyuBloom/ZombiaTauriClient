<script>
    import servers from "$lib/Assets/servers.json";
    import { gameOptions } from "./Intro-shared.svelte.js";

    // let gameMode = $state("standard");

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
        gameOptions.selectedServer = defaultServer[gameOptions.mode];
    });
</script>

<div
    class="flex flex-col justify-between items-start hud-intro-sidebar max-w-48 bg-black/40 p-3"
>
    <div class="hud-intro-modes">
        <h2>Game Modes</h2>
        <select class="hud-intro-gamemode" bind:value={gameOptions.mode}>
            {#each Object.keys(sortedServers) as mode}
                <option value={mode}
                    >{mode.charAt(0).toUpperCase() + mode.slice(1)}</option
                >
            {/each}
        </select>
        <span class="text-white/50 text-xs">{descriptionForModes[gameOptions.mode]}</span>
    </div>
    <div class="hud-intro-main">
        <h2>Game Options</h2>
        <input
            class="hud-intro-name"
            placeholder="Player name..."
            bind:value={gameOptions.playerName}
        />
        <select class="hud-intro-servers" bind:value={gameOptions.selectedServer}>
            <!-- <option value="" selected disabled>Choose server...</option> -->
            {#each Object.entries(sortedServers) as [mode, countries]}
                {#if gameOptions.mode == mode}
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
            class="hud-intro-invite"
            placeholder="Invite link..."
            bind:value={gameOptions.psk}
        />
    </div>
    <div class="hud-intro-settings">
        <h2>Settings</h2>
    </div>
</div>

<style lang="postcss">
    @reference "tailwindcss/theme";

    div {
        @apply w-full;
    }
    h2 {
        @apply first:mb-4 relative text-xl font-bold text-white after:absolute after:-bottom-1 after:left-0 after:border after:border-white/30 after:w-12;
    }
    input,
    select {
        @apply w-full h-10 appearance-none mb-2 p-2 text-white text-xs bg-black/30 rounded-sm placeholder:text-white/30;
    }
</style>
