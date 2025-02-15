<script>
    import tippy from "tippy.js";

    import GraphicsNode from "$lib/Models/GraphicsNode";

    let { game } = $props();

    function tooltip(node, fn) {
        $effect(() => {
            const tooltip = tippy(node, fn());

            return tooltip.destroy;
        });
    }

    const consumablesData = $derived([
        ...Object.values(game.ui.spellData || {}),
        ...Object.values(game.ui.toolData || {}).filter((e) => e.class == "Potion"),
    ]);
    const isDisabled = $state({});

    let spellIndicatorModel;

    function startCasting(spell) {
        if (1 != game.ui.castingSpell) {
            game.ui.castingSpell = spell;

            spellIndicatorModel = new GraphicsNode(game);
            spellIndicatorModel.setAlpha(0.1);
            spellIndicatorModel.setVisible(true);
            spellIndicatorModel.drawCircle(
                0,
                0,
                game.ui.spellData[spell].radius,
                {
                    r: 120,
                    g: 120,
                    b: 120,
                },
                {
                    r: 255,
                    g: 255,
                    b: 255,
                },
                8,
            );
            game.renderer.uiLayer.addAttachment(spellIndicatorModel);

            updateSpellIndicator();
        }
    }
    function stopCasting() {
        if (game.ui.castingSpell) {
            game.ui.castingSpell = false;
            spellIndicatorModel.clear();
            spellIndicatorModel.setVisible(false);
            game.renderer.uiLayer.removeAttachment(spellIndicatorModel);

            spellIndicatorModel = null;
        }
    }
    function updateSpellIndicator() {
        if (null == spellIndicatorModel || !game.ui.castingSpell) return;

        const t = game.ui.mousePosition,
            e = game.renderer.screenToWorld(t.x, t.y),
            r = game.renderer.worldToUi(e.x, e.y);
        spellIndicatorModel.setPosition(r.x, r.y);
    }

    function onMouseUp(t) {
        if (game.ui.castingSpell) {
            const t = game.ui.mousePosition,
                e = game.renderer.screenToWorld(t.x, t.y);
            game.network.sendRpc({
                name: "CastSpell",
                spellName: game.ui.castingSpell,
                x: Math.floor(e.x),
                y: Math.floor(e.y),
            });
            stopCasting();
        }
    }

    game.eventEmitter.on("CameraUpdate", updateSpellIndicator);
    game.eventEmitter.on("mouseMoved", updateSpellIndicator);
    game.eventEmitter.on("27Up", stopCasting);
    game.eventEmitter.on("mouseUp", onMouseUp);

    game.eventEmitter.on("CastSpellResponseRpcReceived", (t) => {
        isDisabled[t.name] = true;
    });
    game.eventEmitter.on("ClearActiveSpellRpcReceived", (t) => {
        delete isDisabled[t.name];
    });
</script>

<div
    class="border-l-2 border-white/50 left-50 bottom-16 h-12 sm:left-44 sm:bottom-14 sm:h-10 absolute z-20"
>
    {#each consumablesData as consumable}
        {#if !isDisabled[consumable.name]}
            <button
                type="button"
                onclick={() => {
                    if (game.ui.playerTick?.gold > consumable.goldCosts) {
                        if (consumable.class == "Potion") {
                            game.network.sendRpc({
                                name: "BuyTool",
                                toolName: consumable.name,
                            });
                            if (
                                game.ui.playerTick?.health < game.ui.playerTick?.maxHealth
                            ) {
                                isDisabled[consumable.name] = true;
                                setTimeout(() => {
                                    delete isDisabled[consumable.name];
                                }, consumable.purchaseCooldown);
                            }
                        } else if (consumable.buffDurationMs) {
                            startCasting(consumable.name);
                        } else {
                            game.network.sendRpc({
                                name: "CastSpell",
                                spellName: consumable.name,
                                x: 0,
                                y: 0,
                            });
                        }
                    }
                }}
                use:tooltip={() => {
                    return {
                        content: `<strong>${consumable.name.split(/(?=[A-Z])/).join(" ")}</strong>`,
                        allowHTML: true,
                        animation: false,
                    };
                }}
                class="relative w-10 h-10 sm:w-8 sm:h-8 p-1 m-1 transition"
            >
                <img
                    class="w-8 h-8 sm:w-6 sm:h-6 transition opacity-70 hover:opacity-100"
                    alt={consumable.name}
                    src="/images/Ui/Icons/{consumable.class == 'Potion'
                        ? 'Potions'
                        : 'Spells'}/{consumable.name}.svg"
                />
            </button>
        {/if}
    {/each}
</div>
