const Projectile = require("./Projectile.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const ToolInfo = require("../Info/ToolInfo.js");
const Util = require("../Util.js");

class CannonProjectile extends Projectile {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "Projectile",
            model: "CannonProjectile",
            parentUid: 0,
            radius: 16
        }, props))
    }

    onCollision(entity, server) {
        if (entity.partyId == this.partyId || this.dead == true) return;

        let damageToDeal = 0;
        let shouldKnockback = false;

        const partyPrimaryBuilding = server.entities[server.parties[this.partyId].primaryBuilding];

        switch (entity.entityClass) {
            case "Resource":
                return server.waitTicks(1, this.die.bind(this, server));
            case "Player":
                if (server.entities[this.parentUid].entityClass === "Building") {
                    if (partyPrimaryBuilding.checkEntityIsEnemy(server, entity) == false) break;
                }

                shouldKnockback = true;
                damageToDeal = this.damages.damageToPlayers;

                if (entity.invulnerable == true) damageToDeal = 0;
                break;
            case "Building":
                damageToDeal = this.damages.damageToBuildings;
                break;
            case "Zombie":
                shouldKnockback = true;
                damageToDeal = this.damages.damageToZombies;
                break;
            case "Neutral":
                shouldKnockback = true;
                damageToDeal = this.damages.damageToNeutrals;
                break;
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

        const shape = new RAPIER.Ball(this.knockbackRadius / server.world.PixelToWorld);

        const knockbackUids = [];
        server.world.intersectionsWithShape(this.getPosition(server), 0, shape, collider => {
            const entity = server.entities[collider._parent?.userData?.uid];
            if (entity !== undefined) {
                const partyPrimaryBuilding = server.entities[server.parties[this.partyId].primaryBuilding];

                if (partyPrimaryBuilding.checkEntityIsEnemy(server, entity) == true) knockbackUids.push(entity.uid);
            }
        });

        server.waitTicks(0, () => {
            for (const uid of knockbackUids) {
                const entity = server.entities[uid];
                if (server.entities[uid] !== undefined && entity.dead !== true) {
                    entity.physicsObject.applyImpulse({
                        x: Math.sin(this.yaw * Math.PI / 180) * this.entityKnockback,
                        y: -Math.cos(this.yaw * Math.PI / 180) * this.entityKnockback
                    }, true);

                    if (entity.acceleration !== undefined) entity.acceleration /= 2;
                }
            }
        });

        server.waitTicks(1, this.die.bind(this, server));
    }
}

module.exports = CannonProjectile;