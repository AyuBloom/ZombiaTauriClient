const Building = require("./Building.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const Util = require("../Util.js");

class SawTower extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "SawTower"
        }, props));
    }

    update(server) {
        super.update(server);

        if (this.firingTick !== server.tick) this.firingTick = 0;
    }

    shoot(entityUid, server) {
        const entity = server.entities[entityUid];

        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);
        if (entity.partyId !== this.partyId) {
            switch (entity.entityClass) {
                case "Player":
                    {
                        let damageToDeal = buildingInfo.damageToPlayers / 1000 * server.serverProperties.tickRate;

                        if (entity.invulnerable == true) damageToDeal = 0;

                        if (damageToDeal > 0) {
                            entity.lastDamagedTick = server.tick;
                            entity.health = Math.max(entity.health - damageToDeal, 0);
                            entity.hitResponse?.(server, this);
                        }
                    }
                    break;
                case "Zombie":
                    {
                        let damageToDeal = buildingInfo.damageToZombies / 1000 * server.serverProperties.tickRate;

                        if (damageToDeal > 0) {
                            entity.lastDamagedTick = server.tick;
                            entity.health = Math.max(entity.health - damageToDeal, 0);
                            entity.hitResponse?.(server, this);
                        }
                    }
                    break;
            }
        }
    }
}

module.exports = SawTower;