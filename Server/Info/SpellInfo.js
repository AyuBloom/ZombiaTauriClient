const spellInfo = {
    "Timeout": {
        "name": "Timeout",
        "description": "Use this spell to prevent zombies from spawning for one night.",
        "goldCosts": 10000,
        "woodCosts": 0,
        "stoneCosts": 0
    },
    "Rapidfire": {
        "name": "Rapidfire",
        "description": "This spell will temporarily increase the attack speed of towers in a selected area.",
        "buffDurationMs": 10000,
        "radius": 300,
        "goldCosts": 5000,
        "woodCosts": 0,
        "stoneCosts": 0
    }
}

exports.getSpell = (name, tier = 1) => {
    if (name === "*") return spellInfo;
    const spell = spellInfo[name];
    if (!spell) return;
    let obj = {};
    for (let i in spell) {
        if (Array.isArray(spell[i])) obj[i] = spell[i][tier - 1];
        else obj[i] = spell[i];
    }
    return obj;
}