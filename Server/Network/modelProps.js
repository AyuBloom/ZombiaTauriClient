module.exports = {
    "ArrowProjectile": {
        name: "ArrowProjectile",
        index: 0,
        props: ["position", "yaw"],
        entityClass: "Projectile"
    },
    "CannonProjectile": {
        name: "CannonProjectile",
        index: 1,
        props: ["position", "yaw"],
        entityClass: "Projectile"
    },
    "DynamiteProjectile": {
        name: "DynamiteProjectile",
        index: 2,
        props: ["position", "tier", "yaw"],
        entityClass: "Projectile"
    },
    "MageProjectile": {
        name: "MageProjectile",
        index: 3,
        props: ["position", "yaw"],
        entityClass: "Projectile"
    },
    "RocketProjectile": {
        name: "RocketProjectile",
        index: 4,
        props: ["position", "tier", "yaw"],
        entityClass: "Projectile"
    },
    "ArrowTower": {
        name: "ArrowTower",
        index: 5,
        props: ["aimingYaw", "firingTick", "health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building"
    },
    "CannonTower": {
        name: "CannonTower",
        index: 6,
        props: ["aimingYaw", "firingTick", "health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building"
    },
    "LightningTower": {
        name: "LightningTower",
        index: 7,
        props: ["firingTick", "health", "lastDamagedTick", "maxHealth", "position", "targetBeams", "tier"],
        entityClass: "Building"
    },
    "MageTower": {
        name: "MageTower",
        index: 8,
        props: ["aimingYaw", "firingTick", "health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building"
    },
    "RocketTower": {
        name: "RocketTower",
        index: 9,
        props: ["aimingYaw", "firingTick", "health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building"
    },
    "SawTower": {
        name: "SawTower",
        index: 10,
        props: ["firingTick", "health", "lastDamagedTick", "maxHealth", "position", "tier", "yaw"],
        entityClass: "Building"
    },
    "Wall": {
        name: "Wall",
        index: 11,
        props: ["health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building"
    },
    "LargeWall": {
        name: "LargeWall",
        index: 12,
        props: ["health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building"
    },
    "Door": {
        name: "Door",
        index: 13,
        props: ["health", "lastDamagedTick", "maxHealth", "partyId", "position", "tier"],
        entityClass: "Building"
    },
    "SpikeTrap": {
        name: "SpikeTrap",
        index: 14,
        props: ["lastDamagedTick", "partyId", "position", "tier"],
        entityClass: "Building"
    },
    "Drill": {
        name: "Drill",
        index: 15,
        props: ["health", "lastDamagedTick", "maxHealth", "position", "tier"],
        entityClass: "Building"
    },
    "Harvester": {
        name: "Harvester",
        index: 16,
        props: ["droneCount", "health", "lastDamagedTick", "maxHealth", "position", "targetResourceUid", "tier", "yaw"],
        entityClass: "Building"
    },
    "HarvesterDrone": {
        name: "HarvesterDrone",
        index: 17,
        props: ["currentHarvestStage", "health", "lastDamagedTick", "maxHealth", "position", "tier", "yaw"],
        entityClass: "Npc"
    },
    "ResourcePickup": {
        name: "ResourcePickup",
        index: 18,
        props: ["position", "resourceAmount", "resourcePickupType"],
        entityClass: "ResourcePickup"
    },
    "Factory": {
        name: "Factory",
        index: 19,
        props: ["aggroEnabled", "health", "lastDamagedTick", "maxHealth", "partyId", "position", "tier", "warmingUp"],
        entityClass: "Building"
    },
    "Player": {
        name: "Player",
        index: 20,
        privateProps: ["aimingYaw", "dead", "firingTick", "invulnerable", "gold", "health", "lastDamagedTick", "lastPlayerDamages", "maxHealth", "name", "partyId", "position", "stone", "tokens", "wave", "weaponName", "weaponTier", "wood", "zombieShieldHealth", "zombieShieldMaxHealth"],
        publicProps: ["aimingYaw", "dead", "firingTick", "invulnerable", "health", "lastDamagedTick", "maxHealth", "name", "position", "weaponName", "weaponTier", "zombieShieldHealth", "zombieShieldMaxHealth"],
        entityClass: "Player"
    },
    "Tree1": {
        name: "Tree1",
        index: 21,
        props: ["aimingYaw", "hits", "position", "radius", "resourceType"],
        entityClass: "Resource"
    },
    "Tree2": {
        name: "Tree2",
        index: 22,
        props: ["aimingYaw", "hits", "position", "radius", "resourceType"],
        entityClass: "Resource"
    },
    "Stone1": {
        name: "Stone1",
        index: 23,
        props: ["aimingYaw", "hits", "position", "radius", "resourceType"],
        entityClass: "Resource"
    },
    "Stone2": {
        name: "Stone2",
        index: 24,
        props: ["aimingYaw", "hits", "position", "radius", "resourceType"],
        entityClass: "Resource"
    },
    "Zombie": {
        name: "Zombie",
        index: 25,
        props: ["colour", "maxHealth", "position", "tier", "yaw"],
        entityClass: "Zombie"
    },
    "SpellIndicator": {
        name: "SpellIndicator",
        index: 26,
        props: ["position", "radius", "spellType"],
        entityClass: "Spell"
    },
    "Visualiser": {
        name: "Visualiser",
        index: 27,
        props: ["position", "yaw"],
        entityClass: "Visualiser"
    },
};