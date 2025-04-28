const Entity = require("./Entity.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const Util = require("../Util.js");

class ResourcePickup extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "ResourcePickup",
            model: "ResourcePickup",
            radius: 5,
            resourceAmount: 0,
            resourceTypes: ["wood", "stone", "gold"],
            resourcePickupType: 0,
            targetPlayerUid: 0
        }, props));

        this.resourcePickupType = this.resourceTypes.indexOf(this.resourceType);
        this.playersInRange = [];
    }

    addToWorld(server) {
        super.addToWorld(server);

        const body = RAPIER.RigidBodyDesc.dynamic()
            .setLinearDamping(server.world.PixelToWorld / 2)
            .setUserData({ uid: this.uid });

        this.physicsObject = server.world.createRigidBody(body);

        this.physicsObject.setTranslation({ x: this.position.x / server.world.PixelToWorld, y: this.position.y / server.world.PixelToWorld }, true);
        const collider = RAPIER.ColliderDesc.ball(this.radius / server.world.PixelToWorld)
            .setCollisionGroups(0);

        server.world.createCollider(collider, this.physicsObject);

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();

        this.physicsObject.applyImpulse({
            x: Math.sin(this.yaw * Math.PI / 180),
            y: -Math.cos(this.yaw * Math.PI / 180)
        }, true);

        server.waitTicks(this.ticksUntilExpiry, () => {
            if (server.entities[this.uid] == undefined) return;

            this.die(server);
        });

        this.tickMade = server.tick;
    }

    update(server) {
        super.update(server);

        if (this.dead == true) return;

        // Don't let pickups be picked up right after they're spawned
        if (server.tick - this.tickMade < 1000 / server.serverProperties.tickRate) return;

        if (this.playersInRange.length == 1) {
            const entity = server.entities[this.playersInRange[0]];

            if (entity !== undefined && entity.dead !== true && Util.measureDistance(server, this.getPosition(server), entity.getPosition(server)) < this.pickupRange**2) {
                this.targetPlayerUid = this.playersInRange[0];
            }
        } else if (this.playersInRange.length > 1) {
            let closestPlayerDist = Infinity;
            let closestPlayerUid = 0;

            for (const uid of this.playersInRange) {
                const entity = server.entities[uid];
                if (entity == undefined || entity.dead == true) continue;

                const distToPlayer = Util.measureDistance(server, this.getPosition(server), entity.getPosition(server));

                if (distToPlayer < closestPlayerDist && distToPlayer < this.pickupRange**2) {
                    closestPlayerDist = distToPlayer;
                    closestPlayerUid = entity.uid;
                }
            }

            if (closestPlayerUid !== 0) this.targetPlayerUid = closestPlayerUid;
        }

        this.playersInRange.length = 0;

        // if (this.targetPlayerUid == 0) {
        //     const shape = new RAPIER.Ball(this.pickupRange);

        //     let playerEntities = [];

        //     server.world.intersectionsWithShape(this.getPosition(server), 0, shape, collider => {
        //         const entity = server.entities[collider._parent?.userData?.uid];
        //         if (entity !== undefined) {
        //             if (entity.model == "Player" && entity.dead !== true && entity.deadLastTick !== true) playerEntities.push(entity);
        //         }
        //     });

        //     if (playerEntities.length == 0) return;

        //     playerEntities.sort((player1, player2) => {
        //         const distThisToA = Util.measureDistance(this.getPosition(server), player1.getPosition(server));
        //         const distThisToB = Util.measureDistance(this.getPosition(server), player2.getPosition(server));

        //         if (distThisToA < distThisToB) {
        //             return -1;
        //         } else if (distThisToA > distThisToB) {
        //             return 1;
        //         }
        //         return 0;
        //     });

        //     this.targetPlayerUid = playerEntities[0].uid;
        if (this.targetPlayerUid !== 0) {
            const targetPlayer = server.entities[this.targetPlayerUid];
            if (targetPlayer == undefined || targetPlayer.dead == true) return;

            const distToPlayer = Math.sqrt(Util.measureDistance(server, this.getPosition(server), targetPlayer.getPosition(server)));

            if (distToPlayer < 0.5) {
                server.waitTicks(1, () => {
                    if (targetPlayer == undefined || targetPlayer?.entityClass !== "Player") return;
        
                    if (server.gameMode !== "scarcity") {
                        targetPlayer[this.resourceType] += this.resourceAmount;
                    }

                    this.die(server);
                });
                return;
            }

            this.yaw = Math.floor(Util.angleTo(this.getPosition(server), server.entities[this.targetPlayerUid].getPosition(server)));

            this.physicsObject.applyImpulse({
                x: Math.sin(this.yaw * Math.PI / 180),
                y: -Math.cos(this.yaw * Math.PI / 180)
            }, true);
        }
    }
}

module.exports = ResourcePickup;