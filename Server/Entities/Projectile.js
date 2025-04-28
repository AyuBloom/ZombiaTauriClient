const Entity = require("./Entity.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const Util = require("../Util.js");

class Projectile extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "Projectile",
            model: "Projectile",
            parentUid: 0,
            radius: 16
        }, props));
    }

    addToWorld(server) {
        super.addToWorld(server);

        const body = RAPIER.RigidBodyDesc.dynamic()
            // .setLinearDamping(server.world.PixelToWorld / 2)
            .setCcdEnabled(true)
            .setUserData({ uid: this.uid });

        if (this.model !== "RocketProjectile") {
            body.setLinvel(
                Math.sin(this.yaw * Math.PI / 180) * this.speed,
                -Math.cos(this.yaw * Math.PI / 180) * this.speed
            );
        }

        this.physicsObject = server.world.createRigidBody(body);

        this.physicsObject.setTranslation({ x: this.position.x / server.world.PixelToWorld, y: this.position.y / server.world.PixelToWorld }, true);
        const collider = RAPIER.ColliderDesc.ball(this.radius / server.world.PixelToWorld)
            .setCollisionGroups(0x00080007)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
            .setSensor(true);

        server.world.createCollider(collider, this.physicsObject);

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();

        server.waitTicks(this.lifetime / server.serverProperties.tickRate, this.die.bind(this, server));
    }

    onCollision(entity, server) {
        if (entity.partyId == this.partyId || this.dead == true || entity.health == undefined) return;
        if (entity.health <= 0) return;

        let damageToDeal = 0;
        let shouldKnockback = false;
        const partyPrimaryBuilding = server.entities[server.parties[this.partyId].primaryBuilding];
        let shouldDie = true;

        switch (entity.entityClass) {
            case "Resource":
                return server.waitTicks(1, this.die.bind(this, server));
            case "Player":
                if (server.entities[this.parentUid].entityClass === "Player") {
                    if (server.entities[this.parentUid].invulnerable == true) server.entities[this.parentUid].invulnerable = false;
                }

                if (server.entities[this.parentUid].entityClass === "Building" && partyPrimaryBuilding !== undefined) {
                    if (partyPrimaryBuilding.checkEntityIsEnemy(server, entity) == false) return;
                }

                shouldKnockback = true;
                damageToDeal = this.damages.damageToPlayers;

                if (entity.invulnerable == true) damageToDeal = 0;
                break;
            case "Building":
                if (server.entities[this.parentUid].entityClass === "Player") {
                    if (server.entities[this.parentUid].invulnerable == true) server.entities[this.parentUid].invulnerable = false;

                    // Scarcity mode allows player projectiles to pass through enemy buildings
                    if (server.gameMode == "scarcity") shouldDie = false;
                } else {
                    shouldDie = false;
                }

                damageToDeal = this.damages.damageToBuildings;
                break;
            case "Zombie":
                shouldKnockback = true;
                damageToDeal = this.damages.damageToZombies;

                if (server.gameMode == "scarcity" && server.entities[this.parentUid].entityClass === "Player") {
                    const factoryEntity = server.entities[entity.target];
                    if (factoryEntity !== undefined) {
                        if (this.partyId !== factoryEntity.partyId) {
                            shouldKnockback = false;
                            damageToDeal = 0;
                        }
                    }
                }
                break;
            case "Neutral":
                shouldKnockback = true;
                damageToDeal = this.damages.damageToNeutrals;
                break;
        }

        // Scarcity mode disables PvP
        if (server.gameMode == "scarcity" && server.entities[this.parentUid].entityClass === "Player" && entity.entityClass !== "Zombie") {
            damageToDeal = 0;
        }

        if (damageToDeal > 0) {
            if (server.entities[this.parentUid]?.model == "Player") {
                const parentPlayer = server.entities[this.parentUid];
    
                // Workaround for Proxies not recognising Array.push as a variable update
                let tempArray = parentPlayer.lastPlayerDamages;
                tempArray.push(entity.uid, damageToDeal);
                parentPlayer.lastPlayerDamages = tempArray;
            }

            entity.lastDamagedTick = server.tick;
            entity.health = Math.max(entity.health - damageToDeal, 0);
            entity.hitResponse?.(server, this);
        }

        if (shouldKnockback == true) {
            entity.physicsObject.applyImpulse({
                x: Math.sin(this.yaw * Math.PI / 180) * this.entityKnockback,
                y: -Math.cos(this.yaw * Math.PI / 180) * this.entityKnockback
            }, true);

            if (entity.acceleration !== undefined) entity.acceleration /= 2;
        }

        if (shouldDie == true) server.waitTicks(0, this.die.bind(this, server));
    }

    update(server) {
        if (this.dead == true) return;

        if (this.targetPosition !== undefined && this.model == "DynamiteProjectile" && server.entities[this.parentUid] !== undefined) {
            const distanceToPlayer = Util.measureDistance(server, this.getPosition(server), server.entities[this.parentUid].getPosition(server));
            const targetPositionToPlayer = Util.measureDistance(server, this.targetPosition, server.entities[this.parentUid].getPosition(server))

            // Make the dynamite die if it reaches the player's mouse position
            if (distanceToPlayer > targetPositionToPlayer + 2) return this.die(server);
        }

        if (this.homing == true && this.target !== undefined) {
            if (server.entities[this.target] == undefined ||
                server.entities[this.target].dead == true ||
                server.entities[this.target].health <= 0 ||
                server.entities[this.target].partyId == this.partyId
                ) {
                    this.target = undefined;
                    this.updateHoming(server);
                }
        }

        this.physicsObject.applyImpulse({
            x: Math.sin(this.yaw * Math.PI / 180) * this.speed / (1000 / server.serverProperties.tickRate),
            y: -Math.cos(this.yaw * Math.PI / 180) * this.speed / (1000 / server.serverProperties.tickRate)
        }, true);

        if (this.model === "RocketProjectile") {
            const timeSinceCreatedMs = (server.tick - this.tickMade) * server.serverProperties.tickRate;

            let speed = 0;
            if (timeSinceCreatedMs < this.lowSpeedTimeMs) {
                speed = this.lowSpeed;
            } else {
                speed = this.maxSpeed
            }

            this.physicsObject.setLinvel({
                x: Math.sin(this.yaw * Math.PI / 180) * (speed * server.serverProperties.tickRate / 1000) * server.world.PixelToWorld,
                y: -Math.cos(this.yaw * Math.PI / 180) * (speed * server.serverProperties.tickRate / 1000) * server.world.PixelToWorld
            })
        }
    }

    updateHoming(server) {
        if (this.target == undefined) return;
        let target = server.entities[this.target];

        if (target == undefined) return this.target = undefined;

        const partyPrimaryBuilding = server.entities[server.parties[this.partyId]?.primaryBuilding];

        if (partyPrimaryBuilding == undefined) return;

        if (target.model == "Player") {
            if (partyPrimaryBuilding.checkEntityIsEnemy(server, target) == false) return;
        }

        this.yaw = Math.floor(Util.angleTo(this.getPosition(server), target?.getPosition(server)));
    }
}

module.exports = Projectile;