const Entity = require("./Entity.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const EntityInfo = require("../Info/EntityInfo.js");
const Util = require("../Util.js");

class Zombie extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            acceleration: 0,
            colour: "Grey",
            dead: false,
            entityClass: "Zombie",
            firingTick: 0,
            killedByUid: 0,
            lastDamagedTick: 0,
            lastPathUpdated: 0,
            lastPosition: { x: 0, y: 0 },
            lastPositionUpdatedTick: 0,
            model: "Zombie",
            movementMode: "Primary",
            pathfindFrequency: 3000,
            targetYaw: 0,
            targetPath: [0, 0],
            tier: 1,
            yaw: 0
        }, props));
    }

    die(server, factoryDied = false) {
        if (factoryDied == false) server.entities[this.target]?.zombieDied(server, this.uid);
        super.die(server);
    }

    addToWorld(server) {
        super.addToWorld(server);

        this.zombieInfo = EntityInfo.entityInfo.Zombie[this.colour];

        this.msBetweenFires = this.zombieInfo.msBetweenFires[this.tier - 1];
        this.radius = this.zombieInfo.radius[this.tier - 1];
        this.health = this.zombieInfo.health[this.tier - 1];
        this.maxHealth = this.zombieInfo.health[this.tier - 1];
        this.tickMade = server.tick;

        // The score gained from a zombie dying is affected in multiple ways
        // The more hits a zombie receives, the higher the score
        // The longer the zombie lives, the lower the score
        // If the zombie dies due to daytime, no score is given
        this.tentativeScore = this.zombieInfo.baseScore[this.tier - 1];
        this.baseScore = this.zombieInfo.baseScore[this.tier - 1];

        if (this.finalZombie == true) {
            let target = server.entities[this.target];

            let targetWave = Math.min(target.wave, 100);

            this.maxHealth = Math.round(this.maxHealth * (targetWave - 42));
            this.health = this.maxHealth;

            target = null;
        }

        this.physicsObject = server.world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
            .setLinearDamping(server.world.PixelToWorld / 2)
            .setUserData({ uid: this.uid })
            .setTranslation(this.position.x / server.world.PixelToWorld, this.position.y / server.world.PixelToWorld)
        );

        server.world.createCollider(
            RAPIER.ColliderDesc.ball(this.radius / server.world.PixelToWorld)
                .setCollisionGroups(0x0002000F),
            this.physicsObject
        );

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();

        this.lastPosition = this.cachedPosition;
        this.lastPositionUpdatedTick = server.tick;

        server.entities[this.target].spawnedZombieUids.add(this.uid);

        this.movementMode = "Primary";
        this.updatePath(server, true);
    }

    updatePath(server, overrideYaw = false) {
        const target = server.entities[this.target];
        const targetPosition = target.getPosition(server);

        if (this.movementMode == "Primary") {
            this.targetPath = [targetPosition.x, targetPosition.y];
    
            if (overrideYaw) {
                this.yaw = Math.floor(Util.angleTo(this.getPosition(server), targetPosition));
            }
            return;
        }
        const thisPosition = this.getPosition(server);

        // console.log(Math.sqrt(Util.measureDistance(thisPosition, this.targetPath)));

        // How far away (in cell count) the zombie has to be before it's forced to update its path
        // This number is the number of cells squared, to save performance
        const pathUpdateDistance = 1;

        if (
            // if it's been long enough since the last pathfind
            server.tick - this.pathfindFrequency / server.serverProperties.tickRate > this.lastPathUpdated ||
            // if the zombie is close to the current target
            (Util.measureDistance(server, thisPosition, { x: this.targetPath[0], y: this.targetPath[1] }) < pathUpdateDistance)
        ) {
            // console.log("update path");
            this.lastPathUpdated = server.tick;

            const targetParty = server.parties[target.partyId];
    
            let tentativePath = targetParty.findPath(this.getPosition(server), targetPosition, server);

            // if the path is the same as the stored path, don't change anything
            if (tentativePath == this.targetPath) return;

            this.targetPath = tentativePath;
    
            if (overrideYaw) {
                this.yaw = Math.floor(Util.angleTo(this.getPosition(server), { x: tentativePath[0], y: tentativePath[1] }));
            }

            // this.acceleration = Math.min(this.acceleration, 15);
        }
    }

    update(server) {
        super.update(server);

        if (this.health <= 0 && this.dead !== true || server.entities[this.target].dead == true) this.die(server);

        if (server.cycleData.isDay == true) {
            // apply damage during day
            this.health = Math.round((this.health - (server.serverProperties.tickRate / server.cycleData.dayLength * 2) * this.maxHealth) * 100) / 100;

            if (this.health <= 0) {
                // If the zombie dies from daylight, no score is distributed
                this.tentativeScore = 0;
                this.die(server);
            }
        }

        if (this.dead == true) return;

        // The longer the zombie is alive, the less score it gives
        const scoreDecay = EntityInfo.entityInfo.Zombie.scoreFactors.scoreDecay;
        const scoreDecayPerSecond = scoreDecay / 1000 * server.serverProperties.tickRate;

        const scoreDecrease = scoreDecayPerSecond * this.baseScore;
        this.tentativeScore -= scoreDecrease;

        if (this.movementMode == "Primary" && server.tick - this.tickMade > 3000 / server.serverProperties.tickRate) {
            /*
            To begin with, zombies will move directly to the primary building
            There are a few things that make them switch to using pathing instead:
            1. If a zombie meets an obstruction -> this is done in the server.world.contactsWith function call
            2. If a zombie is kept in the same place for long enough
            */
            const currentPosition = this.getPosition(server);

            if (server.tick - this.lastPositionUpdatedTick > 5000 / server.serverProperties.tickRate) {
                const dist = Util.measureDistance(server, currentPosition, this.lastPosition);
    
                if (dist < 0.01) {
                    this.movementMode = "Pathfind";
                }

                this.lastPositionUpdatedTick = server.tick;
                this.lastPosition = currentPosition;
            }
        }

        this.updatePath(server);

        let lastYaw = this.yaw;
        this.targetYaw = Util.angleTo(this.getPosition(server), { x: this.targetPath[0], y: this.targetPath[1] });

        if (Math.abs((this.targetYaw - lastYaw + 180) % 360 - 180) > 30) {
            this.acceleration = Math.min(10, this.acceleration);
        }

        this.smoothenYaw(server);

        if (this.acceleration < this.zombieInfo.maxVelocity[this.tier - 1]) {
            this.acceleration += this.zombieInfo.acceleration[this.tier - 1];
        }

        this.physicsObject.applyImpulse({
            x: Math.sin(this.yaw * Math.PI / 180) * this.acceleration / (1000 / server.serverProperties.tickRate),
            y: -Math.cos(this.yaw * Math.PI / 180) * this.acceleration / (1000 / server.serverProperties.tickRate)
        }, true);

        let attackedEntity = false;

        if (server.tick - this.firingTick > this.msBetweenFires / server.serverProperties.tickRate) {
            // TODO: this function is REALLY slow.
            // Calling it every tick that the zombie can fire is really bad
            // I need an alternative to this. I've tried intersectionsWithShape but it still takes a long time
            // even if I use make it use no collision groups.
            server.world.contactsWith(this.physicsObject.collider(0), collider => {
                let entity = server.entities[collider._parent?.userData?.uid];

                if (this.movementMode == "Primary" && server.tick - this.tickMade > 3000 / server.serverProperties.tickRate) {
                    this.movementMode = "Pathfind";
                }

                // The collider may not belong to an entity
                if (entity !== undefined && entity?.health !== undefined && entity?.ghostMode !== true) {
                    switch (entity.entityClass) {
                        case "Player":
                            attackedEntity = true;
                            this.damagePlayer(server, entity);
                            // if (entity.dead !== true) this.acceleration = Math.min(5, this.acceleration);
                            break;
                        case "Building":
                            attackedEntity = true;
                            this.damageBuilding(server, entity);
                            // this.acceleration = Math.min(5, this.acceleration);
                            break;
                        case "Zombie":
                            // this.acceleration = Math.min(30, this.acceleration);
                            break;
                    }
                }

                entity = null;
            })
        }

        if (attackedEntity == true) {
            this.firingTick = server.tick;
        }
    }

    smoothenYaw(server) {
        const maxRotationSpeed = 15;
    
        const diff = 180 - Math.abs(Math.abs(this.yaw - this.targetYaw) - 180);

        let dir = (this.targetYaw - this.yaw + 180 + 360) % 360 - 180;
        dir = dir < 0 ? -1 : 1;

        // Adjust rotation based on maxRotationSpeed
        if (diff > maxRotationSpeed) {
            this.yaw = (this.yaw + maxRotationSpeed * dir + 360) % 360;
        } else {
            this.yaw = this.targetYaw; // Set the yaw to the targetYaw when close enough
        }
      
        // Ensure yaw remains within the range of 0 to 360 degrees
        if (this.yaw < 0) {
            this.yaw += 360;
        }

        this.yaw = Math.floor(this.yaw);
    }

    damagePlayer(server, entity) {
        let damageToBeDealt = this.zombieInfo.damageToPlayers[this.tier - 1];

        if (server.gameMode == "scarcity" && server.entities[this.target]?.partyId !== entity.partyId) {
            damageToBeDealt = entity.maxHealth + entity.zombieShieldMaxHealth;

            if (entity.invulnerable == true) entity.invulnerable = false;
        }


        if (entity.invulnerable == true) return;

        if (entity.zombieShieldMaxHealth > 0) {
            // Store original shield health value
            let shieldHealthBeginning = entity.zombieShieldHealth;
            // Subtract health from shield to the minimum of 0
            entity.zombieShieldHealth = Math.max(0, entity.zombieShieldHealth - damageToBeDealt);

            // Any damage that was applied to the shield is subtracted from the damage
            // that still needs to be dealt, and any remaining damage is dealt to the player
            damageToBeDealt -= shieldHealthBeginning - entity.zombieShieldHealth;

            entity.lastShieldHitTick = server.tick;
        }

        entity.health = Math.max(0, entity.health - damageToBeDealt);
        entity.lastDamagedTick = server.tick;
        entity.hitResponse?.(server, this);
    }

    damageBuilding(server, entity) {
        let damageToBeDealt = this.zombieInfo.damageToBuildings[this.tier - 1];

        if (this.finalZombie == true) {
            damageToBeDealt = Math.min(Math.round(damageToBeDealt * (server.entities[this.target].wave - 42)), 1000);
        }

        entity.lastDamagedTick = server.tick;
        entity.health = Math.max(0, entity.health - damageToBeDealt);
        entity.hitResponse?.(server, this);
    }

    hitResponse(server, entity) {
        if (this.health <= 0) this.killedByUid = entity.uid;

        let attackingEntity = entity;

        if (entity.parentUid !== undefined) {
            attackingEntity = server.entities[entity.parentUid];
        }

        const colourTier = EntityInfo.entityInfo.Zombie.colours[this.colour];
        const tierDifference = Math.abs((attackingEntity.tier || 1) - colourTier);
        const scoreMultiplier = EntityInfo.entityInfo.Zombie.scoreFactors.towerHits[tierDifference];

        const scoreIncrease = scoreMultiplier * this.baseScore;

        this.tentativeScore += scoreIncrease;
    }
}

module.exports = Zombie;