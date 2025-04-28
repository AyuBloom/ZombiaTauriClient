const Projectile = require("./Projectile.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const ToolInfo = require("../Info/ToolInfo.js");
const Util = require("../Util.js");

class RocketProjectile extends Projectile {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "Projectile",
            model: "RocketProjectile",
            parentUid: 0,
            radius: 16,
            tier: 1
        }, props));
    }

    addToWorld(server) {
        super.addToWorld(server);

        // this.physicsObject.setLinvel({
        //     x: Math.sin(this.yaw * Math.PI / 180) * this.lowSpeed,
        //     y: -Math.cos(this.yaw * Math.PI / 180) * this.lowSpeed
        // });

        // server.waitTicks(this.lowSpeedTimeMs / server.serverProperties.tickRate, () => {
        //     if (this.dead == true) return;

        //     this.physicsObject.setLinvel({
        //         x: (Math.sin(this.yaw * Math.PI / 180) * this.maxSpeed),
        //         y: -(Math.cos(this.yaw * Math.PI / 180) * this.maxSpeed)
        //     });
        // })
    }

    update(server) {
        if (this.dead == true) return;

        this.updateHoming(server);

        const timeSinceCreatedMs = (server.tick - this.tickMade) * server.serverProperties.tickRate;

        let speed = 0;
        if (timeSinceCreatedMs < this.lowSpeedTimeMs) {
            speed = this.lowSpeed;
        } else {
            speed = this.maxSpeed;
        }

        this.physicsObject.setLinvel({
            x: Math.sin(this.yaw * Math.PI / 180) * speed,
            y: -Math.cos(this.yaw * Math.PI / 180) * speed
        })
    }

    die(server) {
        // Rocket explodes after dying and will damage entities within an area
        const shape = new RAPIER.Ball(this.splashRadius / server.world.PixelToWorld);

        server.world.intersectionsWithShape(this.getPosition(server), 0, shape, collider => {
            const entity = server.entities[collider._parent?.userData?.uid];
            const partyPrimaryBuilding = server.entities[server.parties[this.partyId].primaryBuilding];

            if (partyPrimaryBuilding.checkEntityIsEnemy(server, entity) == true) this.dealSplashDamage(server, entity);
        });

        super.die(server);
    }

    dealSplashDamage(server, entity) {
        if (entity.partyId == this.partyId) return;
        if (entity.health <= 0) return;

        let damageToDeal = 0;

        switch (entity.entityClass) {
            case "Player":
                damageToDeal = this.damages.damageToPlayers;

                if (entity.invulnerable == true) damageToDeal = 0;
                break;
            case "Building":
                damageToDeal = this.damages.damageToBuildings;
                break;
            case "Zombie":
                damageToDeal = this.damages.damageToZombies;
                break;
            case "Neutral":
                damageToDeal = this.damages.damageToNeutrals;
                break;
        }

        if (damageToDeal > 0) {
            entity.lastDamagedTick = server.tick;
            entity.health = Math.max(entity.health - damageToDeal, 0);
            entity.hitResponse?.(server, this);
        }
    }

    onCollision(entity, server) {
        const partyPrimaryBuilding = server.entities[server.parties[this.partyId].primaryBuilding];

        if (partyPrimaryBuilding.checkEntityIsEnemy(server, entity)) this.die(server);
    }
}

module.exports = RocketProjectile;