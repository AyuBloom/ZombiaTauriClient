<script>
    let { game } = $props();

    let tabs = ["Your Party", "Open Parties"];
    let currentTab = $state(tabs[0]);

    let parties = $state({});
    let currentParty = $state({});

    let partyMembers = $state({}); // $derived(game.ui.playerPartyMembers);
    let partyName = $state("");
    let partyShareKey = $state("");
    let partyLeader = $derived(partyMembers.find((t) => true === t.isLeader).uid);

    let isPlayerLeader = $derived(game.ui.playerPartyLeader);
    let isRequesting = $state(null);

    $effect(() => {
        console.log($state.snapshot(partyName));
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
    game.eventEmitter.on("PartyRequestCancelledRpcReceived", () => {
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
                                // dr.ui.components.uiPopupOverlay.showConfirmation(`Are you sure you want to kick <b>${t.name}</b> from your party?`, 1e4, ( () => {
                                game.network.sendRpc({
                                    name: "KickMember",
                                    uid: parseInt(member.uid),
                                });
                                // })
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
            <p
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white z-40"
            >
                Requesting to join...
            </p>
        {/if}
        <div
            class="{isRequesting
                ? 'disabled'
                : ''} flex flex-row flex-wrap justify-between content-start w-full h-full transition"
        >
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
        </div>
    {/if}
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
        class="absolute flex flex-col top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm w-[70vw] min-w-110 max-w-140 h-100 p-4 bg-black/30"
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
        </div>
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
                            console.log("this works??");
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
                    class={isPlayerLeader ? "" : "disabled"}
                    onclick={() => {
                        /*
                  if (this.leaveElem.classList.contains("is-disabled"))
                      return;
                  let t = "Are you sure you want to leave your party?";
                  null !== dr.ui.factory && (t = "Are you sure you want to abandon your base?"),
                  dr.ui.components.uiPopupOverlay.showConfirmation(t, 1e4, ( () => {
                  */
                        game.network.sendRpc({
                            name: "LeaveParty",
                        });
                        // })
                    }}>Leave Party</button
                >
                <button
                    class={currentParty.isOpen ? "focused" : ""}
                    onclick={() => {
                        game.network.sendRpc({
                            name: "TogglePartyVisibility",
                        });
                    }}>{currentParty.isOpen ? "Public" : "Private"}</button
                >
            </div>
        </div>
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
</style>
