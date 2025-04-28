const Entity = require("./Entity.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const BuildingInfo = require("../Info/BuildingInfo.js");
const Util = require("../Util.js");

class Building extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            aimingYaw: 0,
            dead: false,
            entityClass: "Building",
            firingTick: 0,
            lastDamagedTick: 0,
            healthRegenStartTick: 0,
            height: 95.99,
            model: "ArrowTower",
            partyId: 0,
            position: {
                x: 0,
                y: 0
            },
            // Cells within range
            rangeCells: [],
            rangeCellsSorted: {},
            speedBuffed: false,
            tier: 1,
            width: 95.99,
            yaw: 0
        }, props));
    }

    addToWorld(server) {
        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);

        this.aimingYaw = this.yaw;
        this.width = buildingInfo.width;
        this.height = buildingInfo.height;
        this.health = buildingInfo.health;
        this.maxHealth = this.health;

        super.addToWorld(server);

        const body = RAPIER.RigidBodyDesc.fixed()
            .setUserData({ uid: this.uid })
            .setTranslation(this.position.x / server.world.PixelToWorld, this.position.y / server.world.PixelToWorld);

        this.physicsObject = server.world.createRigidBody(body)

        const collider = RAPIER.ColliderDesc.cuboid(this.width / server.world.PixelToWorld / 2, this.height / server.world.PixelToWorld / 2)
            .setActiveHooks(RAPIER.ActiveHooks.FILTER_CONTACT_PAIRS)
            .setCollisionGroups(0x0004000A);

        server.world.createCollider(collider, this.physicsObject);

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();

        this.tickMade = server.tick;
        this.ticksBeforeRegen = buildingInfo.msBeforeRegen / server.serverProperties.tickRate;

        this.updateRangeCells(server);
    }

    updateRangeCells(server) {
        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);
        const primaryBuilding = server.entities[server.parties[this.partyId].primaryBuilding];
        const thisPosition = this.getPosition(server);

        this.rangeCells.length = 0;
        this.rangeCellsSorted = {};

        if (buildingInfo.towerRadius !== undefined) {
            for (let x = thisPosition.x - buildingInfo.towerRadius / 48; x < thisPosition.x + buildingInfo.towerRadius / 48; x++) {
                for (let y = thisPosition.y - buildingInfo.towerRadius / 48; y < thisPosition.y + buildingInfo.towerRadius / 48; y++) {
                    let x2;
                    if (x < thisPosition.x) x2 = Math.floor(x);
                    else x2 = Math.ceil(x);

                    let y2;
                    if (y < thisPosition.y) y2 = Math.floor(y);
                    else y2 = Math.ceil(y);

                    let dist = Util.measureDistance(server, { x: x2, y: y2 }, this.getPosition(server));

                    if (dist > (buildingInfo.towerRadius / 48)**2) continue;

                    this.rangeCellsSorted[dist] ||= [];
                    this.rangeCellsSorted[dist].push(primaryBuilding.enemyHashGrid[x2][y2]);
                }
            }

            this.sortedCellDistances = [];
            for (let dist in this.rangeCellsSorted) {
                for (let cell of this.rangeCellsSorted[dist]) this.sortedCellDistances.push(cell);
                this.sortedCellDistances.push(null);
            }

        } else if (buildingInfo.range !== undefined) {
            for (let x = thisPosition.x - buildingInfo.range / 48; x < thisPosition.x + buildingInfo.range / 48; x++) {
                for (let y = thisPosition.y - buildingInfo.range / 48; y < thisPosition.y + buildingInfo.range / 48; y++) {
                    let x2;
                    if (x < thisPosition.x) x2 = Math.floor(x);
                    else x2 = Math.ceil(x);

                    let y2;
                    if (y < thisPosition.y) y2 = Math.floor(y);
                    else y2 = Math.ceil(y);

                    if (Util.measureDistance(server, { x: x2, y: y2 }, this.getPosition(server)) > (buildingInfo.range / 48)**2) continue;

                    this.rangeCells.push(primaryBuilding.enemyHashGrid[x2][y2]);
                }
            }
        }
    }

    die(server) {
        super.die(server);
        server.parties[this.partyId]?.updateBuilding(server, [this]);
    }

    hitResponse(server, entity) {
        this.healthRegenStartTick = server.tick + this.ticksBeforeRegen;
        server.entities[server.parties[this.partyId].primaryBuilding].hitResponse(server, entity);
    }

    update(server) {
        if (this.health <= 0) this.die(server);
        if (this.dead === true) return;

        // Ensure the Factory always updates first to update the enemy query
        const primaryBuilding = server.entities[server.parties[this.partyId].primaryBuilding];

        if (primaryBuilding.lastUpdateTickRan !== server.tick) primaryBuilding.update(server);

        super.update(server);

        // cheat
        // if (this.health !== undefined) this.health = Math.max(1, this.health);

        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);

        // Auto heal after some time
        if (this.healthRegenStartTick !== 0 && server.tick >= this.healthRegenStartTick) {
            this.health = Math.round((this.health + buildingInfo.healthRegenPerSecond / 1000 * server.serverProperties.tickRate) * 100) / 100;

            if (this.health >= this.maxHealth) {
                this.health = this.maxHealth;
                this.healthRegenStartTick = 0;
            }
        }

        let msBetweenFires = this.speedBuffed == false ? buildingInfo.msBetweenFires : buildingInfo.msBetweenFires / 2;

        // Prevent buildings from attacking right after being created
        if (server.tick - this.tickMade > msBetweenFires / server.serverProperties.tickRate &&
            server.tick - this.firingTick > msBetweenFires / server.serverProperties.tickRate &&
            primaryBuilding.foundEnemy == true) {
            // Logic for towers that are able to shoot projectiles
            if (typeof buildingInfo.towerRadius === "number") {
                this.fireRanged(server, buildingInfo);
            } else if (typeof buildingInfo.range === "number") {
                // Melee towers
                this.fireUnranged(server, buildingInfo);
            }
        }

        // The Rapidfire spell applies `speedBuffed` to buildings in range while it exists during its tick
        // then the tower clears it at the end of its tick
        this.speedBuffed = false;
    }

    fireUnranged(server, buildingInfo) {
        // Loop through the cells that are known to be within range
        let enemyUids = [];

        for (const cell of this.rangeCells) {
            for (const uid of cell) {
                if (enemyUids.includes(uid)) continue;

                const enemy = server.entities[uid];
                if (enemy !== undefined && Util.isFacing(this, enemy, buildingInfo.maxYawDeviation)) {
                    enemyUids.push(uid);
                }
            }
        }

        if (enemyUids.length <= 0) return this.firingTick = 0;
        else this.firingTick = server.tick;

        enemyUids.forEach(target => this.shoot?.(target, server));
    }

    fireRanged(server, buildingInfo) {
        let targetFound = false;
        let closestEnemyUid = 0;
        let closestEnemyDistance = Infinity;

        // Loop through the cells that are known to be within range
        for (const cell of this.sortedCellDistances) {
            if (cell == null) {
                if (targetFound == true) break;
                continue;
            }

            for (const uid of cell) {
                targetFound = true;

                const enemy = server.entities[uid];
                if (enemy == undefined) continue;
    
                const enemyPosition = enemy.getPosition(server);
                const thisPosition = this.getPosition(server);
    
                let distanceToEnemy = Util.measureDistance(server, thisPosition, enemyPosition);
                if (distanceToEnemy < closestEnemyDistance) {
                    closestEnemyUid = enemy.uid;
                    closestEnemyDistance = distanceToEnemy;
                }
            }
        }

        if (closestEnemyUid == 0) return;

        this.handleTargetAttack(server, server.entities[closestEnemyUid], buildingInfo);
    }

    handleTargetAttack(server, closestEnemy, buildingInfo) {
        this.aimingYaw = Math.floor(Util.angleTo(this.getPosition(server), closestEnemy.getPosition(server)));
        this.firingTick = server.tick;
        this.shoot?.(closestEnemy, server);
    }
}

module.exports = Building;