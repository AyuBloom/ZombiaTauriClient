<script>
    import tippy from "tippy.js";

    let { game } = $props();

    const menus = [
        {
            name: "Shop",
            keybind: "B",
        },
        {
            name: "Parties",
            keybind: "P",
        },
        {
            name: "Settings",
            keybind: null,
        },
    ];

    function tooltip(node, fn) {
        $effect(() => {
            const tooltip = tippy(node, fn());

            return tooltip.destroy;
        });
    }
</script>

<div class="absolute flex flex-row right-[18.25rem] top-1">
    {#each menus as { name, keybind }}
        <button
            use:tooltip={() => {
                return {
                    content: `<strong>${name}</strong>`,
                    allowHTML: true,
                    animation: false,
                };
            }}
            onclick={() => game.ui.showMenu(name)}
            class="relative w-10 h-10 p-2 bg-black/30 m-1 rounded-sm transition hover:bg-black/10 hover:shadow-sm"
        >
            <img
                class="w-6 h-6 opacity-70 transition"
                alt={name}
                src="/images/Ui/Icons/{name}Icon.svg"
            />
            <span class="absolute bottom-0 right-1 font-bold text-[0.625rem] text-white"
                >{keybind}</span
            >
        </button>
    {/each}
</div>
