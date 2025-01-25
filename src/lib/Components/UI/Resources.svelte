<script>
    let { game } = $props();

    let resources = $state({});
    const types = ["wood", "stone", "gold", "tokens"];
    const src = {
        wood: "/images/Ui/Icons/Resources/Tree1.svg",
        stone: "/images/Ui/Icons/Resources/Stone1.svg",
        gold: "/images/Ui/Icons/Resources/Gold1.svg",
        tokens: "/images/Ui/Icons/Resources/Token1.svg",
    };

    function truncate(t, e) {
        const r = ["K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "D"];
        e = Math.pow(10, e);
        for (let n = r.length - 1; n >= 0; n--) {
            const i = Math.pow(10, 3 * (n + 1));
            if (i <= t) {
                if (1e3 == (t = Math.round((t * e) / i) / e) && n < r.length - 1) {
                    t = 1;
                    n++;
                }
                t += r[n];
                break;
            }
        }
        return t;
    }

    for (let e of types) {
        game.eventEmitter.on(`${e}CountUpdated`, () => {
            let t = Math.round(game.ui.playerTick[e]);
            t >= 1e4 && (t = truncate(t, 2));
            resources[e] = t;
            // this[`${e}Elem`].innerHTML = t
        });
    }
</script>

<div class="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-end">
    {#each Object.entries(resources) as [type, amount]}
        <div class="flex">
            <strong class="text-white mt-[0.0625rem] mr-1">{amount}</strong>
            <img src={src[type]} alt={type} class="w-6 h-6" />
        </div>
    {/each}
</div>

<style lang="postcss">
    strong {
        font-family: "Hammersmith One";
    }
</style>
