const BuildingInfo = require("../Info/BuildingInfo.js");
const Entity = require("./Entity");
const RAPIER = require("@dimforge/rapier2d-compat");
const Util = require("../Util.js");

class HarvesterDrone extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "Npc",
            currentHarvestStage: 0,
            chargingAtResource: false,
            harvestStages: { "idle": 0, "enroute": 1, "collecting": 2, "returning": 3 },
            health: 0,
            lastChargeTick: 0,
            lastDamagedTick: 0,
            model: "HarvesterDrone",
            parentUid: 0,
            resourcesCollected: {},
            shouldMaintainVelocity: false,
            targetResourceUid: 0,
            tier: 1,
            yaw: 0
        }, props));
    }

    die(server) {
        const parentHarvester = server.entities[this.parentUid];
        delete parentHarvester.childDrones[this.uid];
        parentHarvester.droneCount = Object.keys(parentHarvester.childDrones).length;

        const buildingInfo = BuildingInfo.getBuilding(server, parentHarvester.model, parentHarvester.tier);

        for (const resource in this.resourcesCollected) {
            server.createEntity("ResourcePickup", {
                resourceAmount: this.resourcesCollected[resource],
                resourceType: resource,
                ticksUntilExpiry: buildingInfo.resourcePickupDurationMs / server.serverProperties.tickRate,
                pickupRange: buildingInfo.resourcePickupPlayerPickupRange / server.world.PixelToWorld,
                position: { x: this.getPosition(server).x * server.world.PixelToWorld, y: this.getPosition(server).y * server.world.PixelToWorld },
                yaw: Math.floor(Math.random() * 360),
            });
        }

        super.die(server);
    }

    addToWorld(server) {
        this.maxHealth = this.health;

        super.addToWorld(server);

        const body = RAPIER.RigidBodyDesc.dynamic()
            .setLinearDamping(server.world.PixelToWorld / 2)
            .setUserData({ uid: this.uid });

        this.physicsObject = server.world.createRigidBody(body);

        this.physicsObject.setTranslation({ x: this.position.x / server.world.PixelToWorld, y: this.position.y / server.world.PixelToWorld }, true);
        const collider = RAPIER.ColliderDesc.ball(this.radius / server.world.PixelToWorld)
            .setCollisionGroups(0x00080007)
            .setSensor(true);

        server.world.createCollider(collider, this.physicsObject);

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();

        this.tickMade = server.tick;

        const parentHarvester = server.entities[this.parentUid];

        if (parentHarvester == undefined) return;

        if (this.targetResourceUid !== 0) this.currentHarvestStage = this.harvestStages["enroute"];

        this.generateRandomSpaceAroundTarget(server, parentHarvester.getPosition(server), 5);

        this.spawningTimeoutActive = true;
        server.waitTicks(1000 / server.serverProperties.tickRate, () => { this.spawningTimeoutActive = false; });
    }

    generateRandomSpaceAroundTarget(server, focusPoint, radius) {
        const angle = Math.random() * Math.PI * 2;
        let x = Math.random() * radius + (Math.cos(angle) * radius + focusPoint.x);
        let y = Math.random() * radius + (Math.sin(angle) * radius + focusPoint.y);

        x -= radius / 2;
        y -= radius / 2;

        this.randomTarget = {
            x: Math.max(0, Math.min(server.serverProperties.mapSize.width, x)),
            y: Math.max(0, Math.min(server.serverProperties.mapSize.height, y))
        };
    }

    setTargetResourceUid(server, targetResourceUid) {
        if (targetResourceUid == this.targetResourceUid) return;
        this.targetResourceUid = targetResourceUid;

        this.chargingAtResource = false;
        this.shouldMaintainVelocity = false;
        this.resourcesCollected = {};

        const parentHarvester = server.entities[this.parentUid];

        if (parentHarvester == undefined) return;

        if (targetResourceUid == 0) {
            this.generateRandomSpaceAroundTarget(server, parentHarvester.getPosition(server), 5);
            this.currentHarvestStage = this.harvestStages["idle"];
        } else {
            this.currentHarvestStage = this.harvestStages["enroute"];
        }
    }

    update(server) {
        super.update(server);

        this.deadLastTick = !!this.dead;

        if (this.health <= 0) this.die(server);

        if (this.dead === true) return;

        if (this.spawningTimeoutActive == true) {
            this.applyImpulseToYaw(server, this.speed);
        } else {
            this.updateMovement(server);
        }

        // Auto heal after some time
        const ticksBeforeRegen = this.msBeforeHealthRegen / server.serverProperties.tickRate;

        if (this.health < this.maxHealth && (server.tick >= this.lastDamagedTick + ticksBeforeRegen || this.developerMode === true)) {
            this.health = Math.min(this.maxHealth, this.health + (this.healthRegenPercentPerSecond / 1000 * server.serverProperties.tickRate) * this.maxHealth);
        }
    }

    updateMovement(server) {
        const parentHarvester = server.entities[this.parentUid];
        const buildingInfo = BuildingInfo.getBuilding(server, parentHarvester.model, parentHarvester.tier);
        const currentTick = server.tick;

        // If there is no target resource, idle around the harvester
        if (this.targetResourceUid == 0) {
            const distToTarget = Math.sqrt(Util.measureDistance(server, this.getPosition(server), this.randomTarget));
            if (distToTarget <= 1) this.generateRandomSpaceAroundTarget(server, parentHarvester.getPosition(server), 5);

            this.yaw = Math.floor(Util.angleTo(this.getPosition(server), this.randomTarget));

            this.applyImpulseToYaw(server, this.speed);
            return;
        }

        const targetResource = server.entities[this.targetResourceUid];
        const distToTargetResource = Math.sqrt(Util.measureDistance(server, this.getPosition(server), targetResource.getPosition(server)));

        switch (this.currentHarvestStage) {
            // If the drone is enroute to the target resource
            case this.harvestStages["enroute"]:
                {
                    // If the drone is close enough to start collecting, start collecting
                    if (distToTargetResource <= buildingInfo.droneCollectRange / server.world.PixelToWorld) {
                        this.currentHarvestStage = this.harvestStages["collecting"];

                        this.generateRandomSpaceAroundTarget(server, targetResource.getPosition(server), buildingInfo.droneCollectRange / server.world.PixelToWorld);
                    } else {
                        // If not, keep moving to the target
                        this.yaw = Math.floor(Util.angleTo(this.getPosition(server), targetResource.getPosition(server)));
            
                        this.applyImpulseToYaw(server, this.speed);
                    }
                }
                break;
            case this.harvestStages["collecting"]:
                {

                    // If it's been long enough since the last charge
                    if (currentTick - this.lastChargeTick > buildingInfo.droneChargeFrequency / server.serverProperties.tickRate) {
                        // If the drone is too close to the resource to charge, keep going straight until it's far enough away
                        if (distToTargetResource < buildingInfo.droneCollectRange / server.world.PixelToWorld) {
                            this.shouldMaintainVelocity = true;
                        } else {
                            this.lastChargeTick = currentTick;
                            this.chargingAtResource = true;
                            this.shouldMaintainVelocity = false;
                        }
                    }

                    if (this.shouldMaintainVelocity == true) {
                        this.applyImpulseToYaw(server, this.speed * 0.75);
                        break;
                    }

                    // If the drone is currently charging, charge at the resource until it's close enough to "hit" it,
                    // then update the resource's hit animation and take resources
                    if (this.chargingAtResource == true) {
                        if (distToTargetResource <= 1) {
                            this.chargingAtResource = false;

                            // Workaround for Proxies not recognising Array.push as a variable update
                            let tempArray = targetResource.hits;
                            tempArray.push(currentTick, Math.floor(Util.angleTo(this.getPosition(server), targetResource.getPosition(server))));
                            targetResource.hits = tempArray;

                            let resourceType = "wood";

                            switch (targetResource.resourceType) {
                                case "Tree":
                                    resourceType = "wood";
                                    break;
                                case "Stone":
                                    resourceType = "stone";
                                    break;
                            }

                            this.resourcesCollected[resourceType] ||= 0;

                            this.resourcesCollected[resourceType] += buildingInfo.droneCollectRate;

                            if (this.resourcesCollected[resourceType] >= buildingInfo.droneMaxResources) {
                                this.currentHarvestStage = this.harvestStages["returning"];

                                // The drone targets a random space in a circle below the harvester
                                let xOffset = 0;
                                let yOffset = 0;

                                switch (parentHarvester.yaw) {
                                    case 0:
                                        yOffset = 2.5;
                                        break;
                                    case 90:
                                        xOffset = -2.5;
                                        break;
                                    case 180:
                                        yOffset = -2.5;
                                        break;
                                    case 270:
                                        xOffset = 2.5;
                                        break;
                                }

                                let resourceOffsetPosition = {
                                    x: parentHarvester.getPosition(server).x + xOffset,
                                    y: parentHarvester.getPosition(server).y + yOffset
                                }
                                this.generateRandomSpaceAroundTarget(server, resourceOffsetPosition, 1);
                            }
                        } else {
                            this.yaw = Math.floor(Util.angleTo(this.getPosition(server), targetResource.getPosition(server)));

                            this.applyImpulseToYaw(server, this.speed * 2);
                        }
                    } else {
                    // If the drone is not charging, choose a random space to move towards until it's able to charge
                        const distToRandomSpace = Math.sqrt(Util.measureDistance(server, this.getPosition(server), this.randomTarget));

                        if (distToRandomSpace <= 1) this.generateRandomSpaceAroundTarget(server, targetResource.getPosition(server), buildingInfo.droneCollectRange / server.world.PixelToWorld);
            
                        this.yaw = Math.floor(Util.angleTo(this.getPosition(server), this.randomTarget));
            
                        this.applyImpulseToYaw(server, this.speed * 0.75);
                    }
                }
                break;
            case this.harvestStages["returning"]:
                {
                    const distToRandomSpace = Math.sqrt(Util.measureDistance(server, this.getPosition(server), this.randomTarget));

                    if (distToRandomSpace <= 1) {
                        for (const resource in this.resourcesCollected) {
                            server.createEntity("ResourcePickup", {
                                resourceAmount: this.resourcesCollected[resource],
                                resourceType: resource,
                                ticksUntilExpiry: buildingInfo.resourcePickupDurationMs / server.serverProperties.tickRate,
                                pickupRange: buildingInfo.resourcePickupPlayerPickupRange / server.world.PixelToWorld,
                                position: { x: this.getPosition(server).x * server.world.PixelToWorld, y: this.getPosition(server).y * server.world.PixelToWorld },
                                yaw: this.yaw,
                            });
                        }

                        this.resourcesCollected = {};
                        this.currentHarvestStage = this.harvestStages["enroute"];
                    }
        
                    this.yaw = Math.floor(Util.angleTo(this.getPosition(server), this.randomTarget));

                    this.applyImpulseToYaw(server, this.speed);
                }
                break;
        }
    }

    applyImpulseToYaw(server, speed) {
        this.physicsObject.applyImpulse({
            x: Math.sin(this.yaw * Math.PI / 180) * speed / (1000 / server.serverProperties.tickRate),
            y: -Math.cos(this.yaw * Math.PI / 180) * speed / (1000 / server.serverProperties.tickRate)
        }, true);
    }

    hitResponse(server, entity) {
        server.entities[server.parties[this.partyId].primaryBuilding].hitResponse(server, entity);
    }
}

module.exports = HarvesterDrone;