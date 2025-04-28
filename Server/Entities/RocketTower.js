const Building = require("./Building.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const Util = require("../Util.js");

class RocketTower extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "RocketTower"
        }, props));

        this.attackingSide = -1;
    }

    shoot(entity, server) {
        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);

        let position = {
            x: this.getPosition(server).x * server.world.PixelToWorld + Math.sin(this.aimingYaw * Math.PI / 180) * 48,
            y: this.getPosition(server).y * server.world.PixelToWorld - Math.cos(this.aimingYaw * Math.PI / 180) * 48
        }

        if (this.attackingSide == -1) {
            this.attackingSide = 1;
            position.x += Math.sin((this.aimingYaw - 90) * Math.PI / 180) * 12;
            position.y -= Math.cos((this.aimingYaw - 90) * Math.PI / 180) * 12;
        } else {
            this.attackingSide = -1;
            position.x += Math.sin((this.aimingYaw + 90) * Math.PI / 180) * 12;
            position.y -= Math.cos((this.aimingYaw + 90) * Math.PI / 180) * 12;
        }

        server.createEntity("RocketProjectile", {
            splashRadius: buildingInfo.projectileAoeRadius,
            damages: {
                damageToPlayers: buildingInfo.damageToPlayers,
                damageToZombies: buildingInfo.damageToZombies,
                damageToNeutrals: buildingInfo.damageToNeutrals
            },
            entityKnockback: buildingInfo.projectileEntityKnockback,
            homing: buildingInfo.projectileAbleToHome,
            lifetime: buildingInfo.projectileLifetime,
            lowSpeed: buildingInfo.projectileLowSpeed,
            maxSpeed: buildingInfo.projectileMaxSpeed,
            lowSpeedTimeMs: buildingInfo.projectileLowSpeedTimeMs,
            model: "RocketProjectile",
            parentUid: this.uid,
            partyId: this.partyId,
            position,
            speed: 0,
            target: entity.uid,
            tickMade: server.tick,
            tier: this.tier,
            yaw: this.aimingYaw
        });
    }
}

module.exports = RocketTower;