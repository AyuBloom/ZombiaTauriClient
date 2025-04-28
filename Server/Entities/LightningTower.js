const Building = require("./Building.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const Util = require("../Util.js");

class LightningTower extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "LightningTower",
            targetBeams: []
        }, props));
    }

    fireRanged(server, buildingInfo) {
        // recursively call a function
        // findTarget(lastTargetUid), starts at 0
        // on the first run it will find the closest enemy to the tower
        // on the second run it will find the closest enemy to the last target, etc.

        let enemyUids = [];

        const findTarget = lastTargetUid => {
            let closestEnemyUid = 0;
            let closestEnemyDistance = Infinity;
            let targetFound = false;

            for (const cell of this.sortedCellDistances) {
                if (cell == null) {
                    if (lastTargetUid == this.uid && targetFound == true) break;
                    continue;
                }
        
                for (const uid of cell) {
                    if (enemyUids.includes(uid)) continue;

                    const enemy = server.entities[uid];
                    if (enemy == undefined) continue;

                    targetFound = true;
        
                    const enemyPosition = enemy.getPosition(server);
                    const lastTarget = server.entities[lastTargetUid];
                    const lastTargetPosition = lastTarget.getPosition(server);
        
                    let distanceToEnemy = Util.measureDistance(server, lastTargetPosition, enemyPosition);

                    if (lastTargetUid !== this.uid && distanceToEnemy > (buildingInfo.maximumBeamBridgingDistance / server.world.PixelToWorld)**2) continue;

                    if (distanceToEnemy < closestEnemyDistance) {
                        closestEnemyUid = enemy.uid;
                        closestEnemyDistance = distanceToEnemy;
                    }
                }
            }

            if (closestEnemyUid !== 0) {
                enemyUids.push(closestEnemyUid);
                if (enemyUids.length < buildingInfo.attackTargetLimit) findTarget(closestEnemyUid);
            }
        }

        findTarget(this.uid);

        if (enemyUids.length <= 0) return;

        this.firingTick = server.tick;

        this.targetBeams = [];
        enemyUids.forEach(targetUid => {
            const target = server.entities[targetUid];

            this.targetBeams.push(target.getPosition(server).x * server.world.PixelToWorld, target.getPosition(server).y * server.world.PixelToWorld);
            
            switch (target.entityClass) {
                case "Player":
                    {
                        let damageToDeal = buildingInfo.damageToPlayers;

                        if (target.invulnerable == true) damageToDeal = 0;

                        if (damageToDeal > 0) {
                            target.lastDamagedTick = server.tick;
                            target.health = Math.max(target.health - damageToDeal, 0);
                            target.hitResponse?.(server, this);
                        }
                    }
                    break;
                case "Zombie":
                    {
                        let damageToDeal = buildingInfo.damageToZombies;

                        if (damageToDeal > 0) {
                            target.lastDamagedTick = server.tick;
                            target.health = Math.max(target.health - damageToDeal, 0);
                            target.hitResponse?.(server, this);
                        }
                    }
                    break;
            }
        });
    }
}

module.exports = LightningTower;