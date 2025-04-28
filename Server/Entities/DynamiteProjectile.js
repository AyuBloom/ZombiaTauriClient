const Projectile = require("./Projectile.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const ToolInfo = require("../Info/ToolInfo.js");
const Util = require("../Util.js");

class DynamiteProjectile extends Projectile {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "Projectile",
            model: "DynamiteProjectile",
            parentUid: 0,
            radius: 16
        }, props))
    }

    die(server) {
        // Dynamite explodes after dying and will damage entities within an area
        const toolInfo = ToolInfo.getTool("Dynamite", this.tier);
        const shape = new RAPIER.Ball(toolInfo.projectileSplashDamageRange / server.world.PixelToWorld);

        server.world.intersectionsWithShape(this.getPosition(server), 0, shape, collider => {
            const entity = server.entities[collider._parent?.userData?.uid];
            if (entity !== undefined && entity.dead !== true) {
                this.dealSplashDamage(server, entity);
            }
        });

        super.die(server);
    }

    update(server) {
        if (this.dead == true) return;

        if (this.targetPosition !== undefined && server.entities[this.parentUid] !== undefined) {
            const distanceToPlayer = Util.measureDistance(server, this.getPosition(server), server.entities[this.parentUid].getPosition(server));
            const targetPositionToPlayer = Util.measureDistance(server, this.targetPosition, server.entities[this.parentUid].getPosition(server))

            // Make the dynamite die if it reaches the player's mouse position
            if (distanceToPlayer > targetPositionToPlayer + 2) return this.die(server);
        }
    }

    dealSplashDamage(server, entity) {
        if (entity.partyId == this.partyId) return;

        let damageToDeal = 0;

        switch (entity.entityClass) {
            case "Player":
                if (server.entities[this.parentUid].invulnerable == true) server.entities[this.parentUid].invulnerable = false;

                damageToDeal = this.damages.damageToPlayers;

                if (entity.invulnerable == true) damageToDeal = 0;
                break;
            case "Building":
                if (server.entities[this.parentUid].invulnerable == true) server.entities[this.parentUid].invulnerable = false;

                damageToDeal = this.damages.damageToBuildings;
                break;
            case "Zombie":
                if (server.entities[this.parentUid].invulnerable == true) server.entities[this.parentUid].invulnerable = false;

                damageToDeal = this.damages.damageToZombies;

                if (server.gameMode == "scarcity") {
                    const factoryEntity = server.entities[entity.target];
                    if (factoryEntity !== undefined) {
                        if (this.partyId !== factoryEntity.partyId) damageToDeal = 0;
                    }
                }
                break;
            case "Neutral":
                damageToDeal = this.damages.damageToNeutrals;
                break;
        }

        // Scarcity mode disables PvP
        if (server.gameMode == "scarcity" && entity.entityClass !== "Zombie") {
            damageToDeal = 0;
        }

        if (damageToDeal > 0) {
            entity.lastDamagedTick = server.tick;
            entity.health = Math.max(entity.health - damageToDeal, 0);
            entity.hitResponse?.(server, this);

            let parentUid = this.parentUid;
            const parentPlayer = server.entities[parentUid];

                // Workaround for Proxies not recognising Array.push as a variable update
                let tempArray = parentPlayer.lastPlayerDamages;
                tempArray.push(entity.uid, damageToDeal);
                parentPlayer.lastPlayerDamages = tempArray;
        }
    }

    onCollision(entity, server) {
        if (server.gameMode == "scarcity") {
            if ((entity.entityClass == "Zombie" && server.entities[entity.target].partyId == this.partyId)
                || entity.entityClass == "Resource") this.die(server);
        } else {
            if (entity.partyId !== this.partyId) this.die(server);
        }
    }
}

module.exports = DynamiteProjectile;