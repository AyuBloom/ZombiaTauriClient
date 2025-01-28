<script>
    let { game } = $props();

    let resourceGains = $state({});
    let damages = $state({});

    function showDamage(uid, damage) {
        const tick = game.renderer.replicator.currentTick.tick;
        for (let damagedUid in damages) {
            if (
                damagedUid == uid &&
                damages[damagedUid].damage == damage &&
                damages[damagedUid].tick == tick
            ) {
                return;
            }
        }

        const entity = game.renderer.world.entities[uid];
        if (!entity) return;

        const position = game.renderer.worldToScreen(
            entity.getPositionX(),
            entity.getPositionY(),
        );

        const uuid = game.util.uuidv4();

        damages[uuid] = {
            tick,
            damage,
            position: {
                x: position.x, // - i.offsetWidth / 2,
                y: position.y, // - i.offsetHeight - 10,
            },
        };
        setTimeout(() => {
            delete damages[uuid];
        }, 500);
    }

    function showResourceGain(uid, type, delta) {
        if (Math.abs(delta) < 0.5) return;
        delta = Math.round(delta);

        const entity = game.renderer.world.entities[uid];
        if (!entity) return;

        const position = game.renderer.worldToScreen(
            entity.getPositionX(),
            entity.getPositionY(),
        );

        const uuid = game.util.uuidv4();

        resourceGains[uuid] = {
            gain: delta,
            type,
            position: {
                x: position.x, // s.x - i.offsetWidth / 2,
                y: position.y, // s.y - i.offsetHeight - 70 + 16 * Object.keys(this.resourceGainElems).length
            },
        };

        setTimeout(() => {
            delete resourceGains[uuid];
        }, 250);
    }

    game.eventEmitter.on("PlayerTickUpdated", () => {
        const t = game.ui.playerTick,
            e = game.ui.lastPlayerTick;

        if (!t || !e) return;

        if (
            game.renderer.replicator.getMsSinceTick(
                game.renderer.replicator.currentTick.tick,
            ) > 500
        )
            return;

        for (let e = 0; e < t.lastPlayerDamages.length; e += 2) {
            showDamage(t.lastPlayerDamages[e], t.lastPlayerDamages[e + 1]);
        }

        const r = ["gold", "wood", "stone", "tokens"];
        for (let n of r) {
            if ("gold" == n && t[n] > e[n]) continue;
            if (t[n] == e[n]) continue;

            const r = t[n] - e[n];
            showResourceGain(t.uid, n, r);
        }
    });
</script>

<div>
    {#each Object.values(resourceGains) as { gain, type, position }, i}
        <p
            class="pip -translate-x-1/2 -translate-y-full text-white"
            style="left: {position.x}px; top: {position.y - 60 + 16 * i}px"
        >
            {gain > 0 ? "+" + gain.toLocaleString() : gain.toLocaleString()}
            {type}
        </p>
    {/each}

    {#each Object.values(damages) as { damage, position }}
        <p
            class="pip -translate-x-1/2 -translate-y-full text-accent-red"
            style="left: {position.x}px; top: {position.y - 10}px"
        >
            {damage}
        </p>
    {/each}
</div>

<style lang="postcss">
    @reference "tailwindcss/theme";

    @keyframes pip-ascend {
        from {
            margin-top: 0;
            opacity: 1;
        }
        to {
            margin-top: -1.25rem;
            opacity: 0;
        }
    }
    .pip {
        @apply absolute text-xs;
        font-family: "Hammersmith One", sans-serif;
        text-shadow:
            1px 1px #333,
            -1px 1px #333,
            1px -1px #333,
            -1px -1px #333;
        opacity: 1;
        animation-name: pip-ascend;
        animation-duration: 500ms;
        animation-iteration-count: 1;
        animation-fill-mode: forwards;
    }
</style>
