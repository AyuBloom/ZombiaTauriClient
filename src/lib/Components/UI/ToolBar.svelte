<script>
    let { game } = $props();

    let tools = $state({});

    game.eventEmitter.on("ToolDataReceived", () => {
        tools = {};
        const t = game.ui.toolData;
        //, e = document.getElementById("hud-top-bar-tools");
        // e.innerHTML = "";
        for (let r in t) {
            const n = t[r];
            if ("Tools" !== n.class) continue;
            tools[n.name] = false;
            /*
            const i = new ve(n.name);
            e.appendChild(i.element),
            i.init()
            */
        }
    });
    game.eventEmitter.on("81Up", () => {
        if (!game.ui.playerTick?.weaponName) return;

        const t = [];
        for (let toolName in tools) {
            false !== tools[toolName] && t.push(toolName);
        }
        let shouldEquip = t[0],
            foundCurrent = false;
        for (let n of t) {
            if (foundCurrent) {
                shouldEquip = n;
                break;
            }
            foundCurrent = n == game.ui.playerTick?.weaponName;
        }
        if (shouldEquip !== game.ui.playerTick?.weaponName) {
            game.network.sendRpc({
                name: "EquipTool",
                toolName: shouldEquip,
            });
        }
    });
    game.eventEmitter.on("SetToolRpcReceived", (t) => {
        for (const e of t)
            void 0 !== tools[e.toolName] && (tools[e.toolName] = e.toolTier);
    });
</script>

<div
    style="scrollbar-width: none;"
    class="absolute flex flex-row left-1 lg:bottom-16 bottom-14 w-screen overflow-x-auto scroll-p"
>
    {#each Object.entries(tools) as [toolName, toolTier]}
        <button
            type="button"
            onclick={() => {
                game.network.sendRpc({
                    name: "EquipTool",
                    toolName,
                });
            }}
            class="{toolTier
                ? ''
                : 'disabled'} relative lg:min-w-10 lg:w-10 lg:h-10 min-w-8 w-8 h-8 p-1 bg-black/20 m-1 rounded-sm transition hover:bg-black/10 hover:brightness-150"
        >
            {#if toolTier}
                <img
                    class="lg:w-8 lg:h-8 w-6 h-6"
                    alt={toolName}
                    src="/images/Ui/Icons/Tools/{toolName}Tier{toolTier}.svg"
                />
            {/if}
        </button>
    {/each}
</div>

<style lang="postcss">
    .disabled {
        pointer-events: none;
        opacity: 0.5 !important;
    }
</style>
