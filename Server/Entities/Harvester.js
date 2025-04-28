const BuildingInfo = require("../Info/BuildingInfo.js");
const Building = require("./Building.js");

class Harvester extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            childDrones: {},
            droneCount: 0,
            model: "Harvester",
            targetResourceUid: 0
        }, props));
    }

    addToWorld(server) {
        super.addToWorld(server);

        this.physicsObject.setRotation(this.yaw * Math.PI / 180);

        const buildingInfo = BuildingInfo.getBuilding(server, "Harvester", this.tier);

        if (server.gameMode !== "scarcity") server.waitTicks(2000 / server.serverProperties.tickRate, () => {
            if (this.droneCount < buildingInfo.maxDrones) this.spawnDrone(server);
        });
    }

    die(server) {
        for (const childUid in this.childDrones) {
            server.entities[childUid].die(server, true);
        }

        super.die(server);
    }

    setTargetResourceUid(server, targetUid) {
        this.targetResourceUid = targetUid;

        for (let uid in this.childDrones) {
            this.childDrones[uid].setTargetResourceUid(server, targetUid);
        }
    }

    upgrade(server) {
        for (const childUid in this.childDrones) {
            server.entities[childUid].tier = this.tier;
        }
    }

    spawnDrone(server) {
        if (this.dead == true) return;

        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);

        const drone = server.createEntity("HarvesterDrone", {
            health: buildingInfo.droneHealth,
            healthRegenPercentPerSecond: buildingInfo.droneHealthRegenPercentPerSecond,
            msBeforeHealthRegen: buildingInfo.droneMsBeforeHealthRegen,
            parentUid: this.uid,
            partyId: this.partyId,
            position: { x: this.getPosition(server).x * server.world.PixelToWorld, y: this.getPosition(server).y * server.world.PixelToWorld },
            radius: buildingInfo.droneRadius,
            speed: buildingInfo.droneVelocity,
            targetResourceUid: this.targetResourceUid,
            tier: this.tier,
            yaw: Math.floor(Math.random() * 360)
        })

        this.childDrones[drone.uid] = drone;
        this.droneCount = Object.keys(this.childDrones).length;
    }
}

module.exports = Harvester;