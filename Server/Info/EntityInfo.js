const entityInfo = {
    "Player": {
        "speed": 192*2,
        "msBeforeRegen": 5000,
        "healthRegenPerSecond": 50,
        "radius": 24,
        "sightRange": {
            "height": 1080,
            "width": 1920
        }
    },
    "Tree": {
        "radius": 68
    },
    "Stone": {
        "radius": 52
    },
    "NeutralSpawn": {
        "maxNpcs": 3,
        "maxNpcSpawnRange": 400,
        "radius": 50,
        "timeBetweenNpcSpawns": 3000
    },
    "NeutralNpc": {
        "radius": 25,
        "speed": 64,
        "health": 250,
        "maxHealth": 250,
        "range": 30,
        "maxYawDeviation": 45,
        "damageToPlayers": 5,
        "msBetweenFires": 600,
        "maxDistanceFromSpawn": 1000,
    },
    "Zombie": {
        "scoreFactors": {
            // The values here are percentages of the base score of the zombies

            // The greater the tier difference between the zombie and the tower that hit the zombie, the more score the zombie is worth
            // This value is an array where the index is the tier difference (ex: tier 5 hits tier 2, tier difference of 3 is applied)
            "towerHits": [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],

            // The rate at which score decays the longer the zombie is alive
            "scoreDecay": 0.01
        },
        "colours": {
            "Grey": 1,
            "Green": 2,
            "Blue": 3,
            "Red": 4
        },
        "Grey": {
            "acceleration": [2, 2, 3, 2, 2, 2, 2, 2],
            "maxVelocity": [35, 35, 40, 40, 45, 50, 60, 65],
            "damageToBuildings": [5, 5, 5, 6, 6, 6, 7, 7],
            "damageToPlayers": [2, 2, 2, 2, 2, 3, 3, 4],
            "range": [16, 16, 16, 16, 16, 16, 16, 16],
            "msBetweenFires": [500, 500, 400, 500, 500, 500, 500, 400],
            "health": [120, 150, 180, 200, 220, 240, 250, 250],
            "radius": [18, 20, 20, 20, 22, 24, 24, 24],
            "baseScore": [100, 100, 100, 150, 150, 200, 200, 250]
        },
        "Green": {
            "acceleration": [4, 3, 3, 2, 2, 2, 2, 2],
            "maxVelocity": [35, 35, 40, 40, 45, 50, 60, 65],
            "damageToBuildings": [10, 12, 12, 15, 15, 25, 30, 30],
            "damageToPlayers": [5, 5, 6, 6, 7, 7, 8, 10],
            "range": [16, 16, 16, 16, 16, 16, 16, 16],
            "msBetweenFires": [500, 500, 400, 500, 500, 500, 500, 500],
            "health": [250, 250, 250, 260, 280, 300, 320, 350],
            "radius": [18, 20, 20, 20, 22, 24, 24, 24],
            "baseScore": [250, 250, 300, 400, 400, 400, 400, 400]
        },
        "Blue": {
            "acceleration": [5, 4, 3, 2, 2, 2, 2, 2],
            "maxVelocity": [35, 35, 40, 40, 45, 50, 60, 65],
            "damageToBuildings": [25, 30, 25, 30, 30, 45, 50, 50],
            "damageToPlayers": [10, 15, 15, 20, 25, 25, 30, 50],
            "range": [16, 16, 16, 16, 16, 16, 16, 16],
            "msBetweenFires": [400, 400, 400, 400, 400, 400, 400, 300],
            "health": [350, 375, 400, 400, 400, 500, 500, 600],
            "radius": [18, 20, 22, 22, 24, 26, 26, 26],
            "baseScore": [450, 500, 600, 600, 600, 700, 800, 850]
        },
        "Red": {
            "acceleration": [5, 4, 3, 2, 2, 2, 2, 2],
            "maxVelocity": [35, 35, 40, 40, 45, 50, 60, 65],
            "damageToBuildings": [60, 60, 60, 60, 70, 70, 75, 80],
            "damageToPlayers": [50, 80, 100, 100, 100, 100, 100, 100],
            "range": [16, 16, 16, 16, 16, 16, 16, 16],
            "msBetweenFires": [400, 400, 400, 400, 400, 400, 500, 600],
            "health": [750, 750, 800, 800, 800, 900, 900, 1100],
            "radius": [18, 20, 22, 22, 24, 26, 26, 26],
            "baseScore": [750, 750, 1000, 600, 800, 900, 800, 850]
        }
    }
};

exports.entityInfo = entityInfo;

exports.getEntity = (name, tier = 1) => {
    if (name === "*") return entityInfo;
    const entity = entityInfo[name];
    if (!entity) return;
    let obj = {};
    for (let i in entity) {
        if (Array.isArray(entity[i])) obj[i] = entity[i][tier - 1];
        else obj[i] = entity[i];
    }
    return obj;
}

exports.getZombie = (colour, tier = 1) => {
    const zombie = entityInfo["Zombie"][colour];
    if (!zombie) return;
    let obj = {};
    for (let i in zombie) {
        if (Array.isArray(zombie[i])) obj[i] = zombie[i][tier - 1];
        else obj[i] = zombie[i];
    }
    return obj;
}