const Building = require("./Building.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const RAPIER = require("@dimforge/rapier2d-compat");

class SpikeTrap extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "SpikeTrap"
        }, props));
    }

    update(server) {
        super.update(server);

        server.world.contactsWith(this.physicsObject.collider(0), collider => {
            let entity = server.entities[collider._parent?.userData?.uid];
            // The collider may not belong to an entity
            if (entity !== undefined && entity?.health !== undefined && entity.partyId !== this.partyId) {
                if (entity.health > 0) {
                    let buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);
            
                    switch (entity.model) {
                        case "Zombie":
                            let damageToDeal = buildingInfo.damageToZombies;
            
                            if (damageToDeal > 0) {
                                entity.lastDamagedTick = server.tick;
                                entity.health = Math.max(entity.health - damageToDeal, 0);
                                entity.hitResponse?.(server, this);
            
                                entity.acceleration = Math.min(15, entity.acceleration);
            
                                this.firingTick = server.tick;
                            }
                            break;
                    }
                }
            }
        });
    }

}

module.exports = SpikeTrap;