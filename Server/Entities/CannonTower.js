const Building = require("./Building.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const Util = require("../Util.js");

class CannonTower extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "CannonTower"
        }, props));
    }

    shoot(entity, server) {
        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);
        server.createEntity("CannonProjectile", {
            entityKnockback: buildingInfo.projectileEntityKnockback,
            knockbackRadius: buildingInfo.projectileKnockbackRadius,
            damages: {
                damageToPlayers: buildingInfo.damageToPlayers,
                damageToZombies: buildingInfo.damageToZombies,
                damageToNeutrals: buildingInfo.damageToNeutrals
            },
            homing: buildingInfo.projectileAbleToHome,
            lifetime: buildingInfo.projectileLifetime,
            model: "CannonProjectile",
            parentUid: this.uid,
            partyId: this.partyId,
            position: {
                x: this.getPosition(server).x * server.world.PixelToWorld + Math.sin(this.aimingYaw * Math.PI / 180) * 48,
                y: this.getPosition(server).y * server.world.PixelToWorld - Math.cos(this.aimingYaw * Math.PI / 180) * 48
            },
            speed: buildingInfo.projectileSpeed,
            target: entity.uid,
            tickMade: server.tick,
            yaw: this.aimingYaw
        });
    }
}

module.exports = CannonTower;