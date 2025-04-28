const Building = require("./Building.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const Util = require("../Util.js");

class MageTower extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "MageTower"
        }, props));
    }

    shoot(entity, server) {
        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);
        for (let i = -buildingInfo.projectileAngleDifference * buildingInfo.projectileCount / 2; i < buildingInfo.projectileCount / 2 * buildingInfo.projectileAngleDifference; i += buildingInfo.projectileAngleDifference) {
            server.createEntity("MageProjectile", {
                entityKnockback: buildingInfo.projectileEntityKnockback,
                damages: {
                    damageToPlayers: buildingInfo.damageToPlayers,
                    damageToZombies: buildingInfo.damageToZombies,
                    damageToNeutrals: buildingInfo.damageToNeutrals
                },
                homing: buildingInfo.projectileAbleToHome,
                lifetime: buildingInfo.projectileLifetime,
                model: "MageProjectile",
                parentUid: this.uid,
                partyId: this.partyId,
                position: { x: this.getPosition(server).x * server.world.PixelToWorld, y: this.getPosition(server).y * server.world.PixelToWorld },
                speed: buildingInfo.projectileSpeed,
                target: entity.uid,
                tickMade: server.tick,
                yaw: Math.floor((this.aimingYaw + i) % 360)
            });
        }
    }
}

module.exports = MageTower;