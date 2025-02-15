<script>
    let { game } = $props();

    let tabs = ["Your Party", "Open Parties", "Your Instances"];
    let currentTab = $state(tabs[0]);

    let parties = $state({});
    let currentParty = $state({});

    let partyMembers = $state({}); // $derived(game.ui.playerPartyMembers);
    let partyName = $state("");
    let partyShareKey = $state("");
    let partyLeader = $derived(partyMembers.find((t) => true === t.isLeader).uid);

    let isPlayerLeader = $derived(partyLeader == game.ui.playerTick?.uid);
    let isRequesting = $state(null);

    $effect(() => {
        game.network?.connected &&
            game.network.sendRpc({ name: "SetPartyName", partyName: partyName });
    });

    game.eventEmitter.on("UpdatePartyRpcReceived", (t) => {
        let currentParties = {};
        for (let r in t) {
            currentParties[t[r].partyId] = t[r];
        }
        parties = currentParties;
        currentParty = currentParties[game.ui.playerTick?.partyId];
    });
    game.eventEmitter.on("PartyMembersUpdatedRpcReceived", (t) => {
        partyMembers = t;
    });
    game.eventEmitter.on("PartyRequestMetRpcReceived", () => {
        isRequesting = null;
    });
    game.eventEmitter.on("PartyKeyRpcReceived", (t) => {
        partyShareKey = t.partyKey;
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

{#snippet Party()}
    {#if currentTab == "Your Party"}
        <div class="flex flex-col w-full h-full gap-2">
            {#each partyMembers as member}
                <div
                    class="flex flex-row justify-between w-full h-12 p-2 rounded-sm bg-white/10 text-xs text-white"
                >
                    <div class="flex flex-col">
                        <strong>{member.name}</strong>
                        <span class="opacity-70"
                            >{member.uid == partyLeader ? "Leader" : "Member"}</span
                        >
                    </div>
                    <div class="flex flex-row gap-2">
                        <div
                            class="{isPlayerLeader && member.uid !== partyLeader
                                ? ''
                                : 'disabled'} flex flex-row gap-2 items-center rounded-sm bg-black/30 pl-2 pr-2"
                        >
                            <input
                                type="checkbox"
                                bind:checked={member.canPlace}
                                onchange={() => {
                                    game.network.sendRpc({
                                        name: "TogglePartyPermission",
                                        permission: "Place",
                                        uid: parseInt(member.uid),
                                    });
                                }}
                            />
                            <p>Can build</p>
                        </div>
                        <div
                            class="{isPlayerLeader && member.uid !== partyLeader
                                ? ''
                                : 'disabled'} flex flex-row gap-2 items-center rounded-sm bg-black/30 pl-2 pr-2"
                        >
                            <input
                                type="checkbox"
                                bind:checked={member.canSell}
                                onchange={() => {
                                    game.network.sendRpc({
                                        name: "TogglePartyPermission",
                                        permission: "Sell",
                                        uid: parseInt(member.uid),
                                    });
                                }}
                            />
                            <p>Can sell</p>
                        </div>
                        <button
                            onclick={() => {
                                game.ui.pendingPopups.push({
                                    type: "confirmation",
                                    message: `Are you sure you want to kick <b>${member.name}</b> from your party?`,
                                    callback: () => {
                                        game.network.sendRpc({
                                            name: "KickMember",
                                            uid: parseInt(member.uid),
                                        });
                                    },
                                });
                            }}
                            class="{isPlayerLeader && member.uid !== partyLeader
                                ? ''
                                : 'disabled'} rounded-sm pl-2 pr-2 transition bg-accent-red hover:brightness-125"
                            >Kick</button
                        >
                    </div>
                </div>
            {/each}
        </div>
    {/if}
{/snippet}

{#snippet Parties()}
    {#if currentTab == "Open Parties"}
        {#if isRequesting}
            <div
                class="flex flex-col gap-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            >
                <p class="text-white">Requesting to join...</p>
                <button
                    onclick={() => {
                        game.network.sendRpc({
                            name: "CancelPartyRequest",
                        });
                    }}
                    class="p-2 rounded-sm text-white transition bg-accent-red hover:brightness-125"
                    >Cancel Request</button
                >
            </div>
        {/if}
        <div
            class="{isRequesting
                ? 'disabled'
                : ''} flex flex-row flex-wrap justify-between content-start w-full h-full transition"
        >
            {#if Object.keys(parties).length > 1 || currentParty.isOpen}
                {#each Object.values(parties) as party}
                    {@const isPlayersParty = game.ui.playerTick?.partyId == party.partyId}
                    {@const isFull = party.memberCount >= party.memberLimit}
                    {#if party.isOpen === true || party.isOpen === undefined}
                        <button
                            onclick={() => {
                                if (isPlayersParty) return;
                                isRequesting = party.partyId;
                                game.network.sendRpc({
                                    name: "JoinParty",
                                    partyId: party.partyId,
                                });
                            }}
                            class="{isPlayersParty ? 'focused' : ''} {isFull
                                ? 'disabled'
                                : ''} flex flex-col basis-49/100 h-16 mb-2 p-2 text-white rounded-sm transition bg-white/10 hover:bg-white/30"
                        >
                            <strong>{party.partyName}</strong>
                            <span class="opacity-70"
                                >{party.memberCount}/{party.memberLimit}</span
                            >
                        </button>
                    {/if}
                {/each}
                <!--
            {#if Object.keys(parties).length > 1 || currentParty.isOpen}
                <hr class="ml-auto mr-auto mt-2 mb-2 border-dashed w-full" />
            {/if}
            -->
            {:else if !currentParty.isOpen}
                <p
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70"
                >
                    No open parties
                </p>
            {/if}

            <!--
            <input
                onkeyup={(t) => {
                    t.stopPropagation();
                }}
                onkeydown={(t) => {
                    t.stopPropagation();
                }}
                class="relative w-full h-10 rounded-sm p-2 mt-2 text-center bg-white/10 text-white placeholder:text-white/50"
                placeholder="Join by party share key..."
            />
            -->
        </div>
    {/if}
{/snippet}

{#snippet AltManagement()}
    {#if currentTab == "Your Instances"}
        <div class="flex flex-col w-full p-2">
            <p
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70"
            >
                Coming soon...
            </p>
        </div>
    {/if}
{/snippet}

{#snippet PartyManagement()}
    <div class="flex flex-col basis-1/4 w-full pt-2 gap-2">
        <div class="relative flex flex-row basis-1/2 gap-2">
            <input
                class="{isPlayerLeader
                    ? ''
                    : 'disabled'} w-40 h-full rounded bg-white pl-2 pr-2 shadow"
                type="text"
                placeholder={currentParty.partyName || "verycoolpartyname"}
                bind:value={partyName}
            />
            <div class="flex flex-row grow h-full rounded bg-white pl-2 shadow">
                <input
                    class="grow pr-2 border-r-2 border-gray/10"
                    type="text"
                    maxlength="0"
                    placeholder="zombia.io/#/v1rotate/hawktuah"
                    value="http://zombia.io/#/{game.network.options.serverData
                        .id}/{partyShareKey}"
                    onfocus={({ target: _this }) => {
                        _this.select();
                    }}
                />
                <button
                    aria-label="Randomise party key"
                    class="relative w-12 h-12"
                    onclick={() => {
                        game.network.sendRpc({
                            name: "RandomisePartyKey",
                        });
                    }}
                >
                    <img
                        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 invert-100"
                        alt="Randomise party key"
                        src="/images/Ui/Icons/RefreshToggle.svg"
                    />
                </button>
            </div>
        </div>
        <div
            class="relative flex flex-row w-full basis-1/2 gap-2 text-white *:rounded-sm *:h-full *:basis-1/2 *:transition *:bg-accent-red *:hover:brightness-125"
        >
            <button
                class={currentParty.memberCount == 1 ? "disabled" : ""}
                onclick={() => {
                    game.ui.pendingPopups.push({
                        type: "confirmation",
                        message: "Are you sure you want to abandon your base?",
                        callback: () => {
                            game.network.sendRpc({
                                name: "LeaveParty",
                            });
                        },
                    });
                }}>Leave Party</button
            >
            <button
                class="{currentParty.isOpen ? 'focused' : ''} {isPlayerLeader
                    ? ''
                    : 'disabled'}"
                onclick={() => {
                    game.network.sendRpc({
                        name: "TogglePartyVisibility",
                    });
                }}>{currentParty.isOpen ? "Public" : "Private"}</button
            >
        </div>
    </div>
{/snippet}

{#if game.ui.isDisplayingMenu == "Parties"}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        onmouseup={(t) => {
            t.stopPropagation();
        }}
        onmousedown={(t) => {
            t.stopPropagation();
        }}
        class="absolute flex flex-col top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm w-[70vw] min-w-116 max-w-140 h-100 p-4 bg-black/30"
    >
        <button
            class="absolute text-white text-2xl top-2 right-4 rotate-45 transition opacity-70 hover:opacity-100"
            onclick={() => game.ui.hideMenu()}>+</button
        >
        <div class="basis-1/6">
            <h2 class="text-white mb-2">Parties</h2>
            {@render Tabs()}
        </div>
        <div
            class="relative basis-7/12 w-full bg-black/20 rounded-sm rounded-tl-none p-2 overflow-y-auto"
        >
            {@render Party()}
            {@render Parties()}
            {@render AltManagement()}
        </div>
        {@render PartyManagement()}
    </div>
{/if}

<style lang="postcss">
    @reference "../../../app.css";

    .active {
        @apply bg-black/20;
    }
    .focused {
        @apply bg-accent-green;
    }
    .disabled {
        pointer-events: none;
        opacity: 0.5 !important;
    }

    hr {
        text-align: center;
    }
</style>
