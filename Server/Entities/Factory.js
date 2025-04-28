const Building = require("./Building.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const WaveData = require("../Info/WaveData.json");
const Util = require("../Util.js");
const mongoose = require("mongoose");
const RAPIER = require("@dimforge/rapier2d-compat");

const leaderboardEntrySchema = new mongoose.Schema({
    players: {
        type: Array,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    wave: {
        type: Number,
        required: true
    },
    partyId: {
        type: Number,
        required: true
    },
    partyName: {
        type: String,
        required: true
    },
    timeDead: {
        type: Number,
        required: true
    },
    version: {
        type: String,
        required: true
    },
    gameMode: {
        type: String,
        required: false
    },
    serverPopulation: {
        type: Number,
        required: true
    }
});

class Factory extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            // Object to hold aggression data
            // When a player hits a tower x times, the base will save the party ID and UID's of all players in the party
            aggressionData: {
                hitThreshold: 5,
                timeForHitToDecay: 30000,
                playerHits: {},
                partyHits: {},
                ipHits: {},
                partyIds: new Set(),
                playerUids: new Set(),
                playerIps: new Set()
            },
            aggroEnabled: false,
            lastUpdateTickRan: 0,
            model: "Factory",
            timedOut: false,
            warmingUp: true,
            wave: 0,
            waveCommenced: false,
            spawnedZombieUids: new Set()
        }, props));

        this.waveData = {};

        this.changedGridCells = new Set();

        if (server.gameMode == "scarcity") this.wave = Math.max(this.wave, 15);
    }

    addToWorld(server) {
        super.addToWorld(server);

        this.warmingUp = true;
        this.health = 1;
        
        // maxRange is the furthest out the tower with the biggest range (Rocket Tower) can see when placed at the maximum build distance

        // let maxRange = Math.ceil(Math.sqrt(server.serverProperties.maxFactoryBuildDistance**2 * 2) + (1000/48));
        // this number ends up being 47 but just for roundness ill make it 48

        this.maxRange = 48;

        // Spatial hash grid generation
        let gridSize = 1;

        let thisPosition = this.getPosition(server);
        this.enemyHashGrid = {};
        for (let x = thisPosition.x - this.maxRange; x < thisPosition.x + this.maxRange; x += gridSize) {
            this.enemyHashGrid[x] = {};
            for (let y = thisPosition.y - this.maxRange; y < thisPosition.y + this.maxRange; y += gridSize) {
                this.enemyHashGrid[x][y] = [];
            }
        }
    }

    hitResponse(server, entity) {
        this.healthRegenStartTick = server.tick + this.ticksBeforeRegen;

        // If the entity that hit the building is a projectile, treat it as if its parent player hit the building
        if (entity.parentUid !== undefined) entity = server.entities[entity.parentUid];

        if (entity.entityClass !== "Player") return;

        // If the player changes party, it should still update numbers for the original party
        const originalPartyId = entity.partyId;
        const playerIpAddress = server.connectedSockets[entity.uid].ipAddress;

        // Treatment for player uids
        this.aggressionData.playerHits[entity.uid] ||= 0;
        this.aggressionData.playerHits[entity.uid]++;

        if (this.aggressionData.playerHits[entity.uid] >= this.aggressionData.hitThreshold) this.aggressionData.playerUids.add(entity.uid);

        // Treatment for party ids
        this.aggressionData.partyHits[originalPartyId] ||= 0;
        this.aggressionData.partyHits[originalPartyId]++;

        if (this.aggressionData.partyHits[originalPartyId] >= this.aggressionData.hitThreshold) this.aggressionData.partyIds.add(originalPartyId);

        // Treatment for IP addresses
        this.aggressionData.ipHits[playerIpAddress] ||= 0;
        this.aggressionData.ipHits[playerIpAddress]++;

        if (this.aggressionData.ipHits[playerIpAddress] >= this.aggressionData.hitThreshold) this.aggressionData.playerIps.add(playerIpAddress);

        server.waitTicks(this.aggressionData.timeForHitToDecay / server.serverProperties.tickRate, () => {
            this.aggressionData.playerHits[entity.uid]--;

            if (this.aggressionData.playerHits[entity.uid] <= 0) {
                delete this.aggressionData.playerHits[entity.uid];
                this.aggressionData.playerUids.delete(entity.uid);
            }

            this.aggressionData.partyHits[originalPartyId]--;

            if (this.aggressionData.partyHits[originalPartyId] <= 0) {
                delete this.aggressionData.partyHits[originalPartyId];
                this.aggressionData.partyIds.delete(originalPartyId);
            }

            this.aggressionData.ipHits[playerIpAddress]--;

            if (this.aggressionData.ipHits[playerIpAddress] <= 0) {
                delete this.aggressionData.ipHits[playerIpAddress];
                this.aggressionData.playerIps.delete(playerIpAddress);
            }
        })
    }

    startWave(server) {
        const thisParty = server.parties[this.partyId];

        if (this.timedOut == true) {
            this.timedOut = false;
            return;
        }

        this.wave++;
        this.waveCommenced = true;

        // Determine all zombie info for the night

        /*
        This function finds which colour should be spawned based on the wave

        Wave 1:
        if wave - zombieColour.waveDuration <= 0, the chosen colour is the correct colour,
        if not, then the colour hasn't been found so we run it again with the next zombie colour
        and the subtracted value

        For example:
        Wave 1:
        checkColourInRange(1, 0)
        1 - 14 = -14, which is <= 0, so we have found our colour

        Wave 19:
        checkColourInRange(19, 0)
        19 - 14 = 5, which is not <= 0, so we have not found our colour. So we run again and increment the colour
        checkColourInRange(5, 1)
        5 - 14 = -9, which is <= 0, so we have found our colour!
        */

        // Find colour of zombie to spawn
        const checkColourInRange = (wave, colourIndex = 0) => {
            const zombieColour = Object.values(WaveData)[colourIndex];
            const WaveDataKeys = Object.keys(WaveData);

            // If the zombie colour can't be found, default to the previous colour (final zombies)
            if (zombieColour == undefined) {
                const wd = WaveData[WaveDataKeys[colourIndex - 1]];
                return {
                    waveInColour: ((wave - 1) % wd.waveDuration) + 1,
                    ...wd
                };
            }

            if (wave - zombieColour.waveDuration <= 0) return {
                waveInColour: wave,
                ...WaveData[WaveDataKeys[colourIndex]]
            }
            else return checkColourInRange(wave - zombieColour.waveDuration, colourIndex + 1);
        }

        this.waveData = checkColourInRange(this.wave);

        // Find tiers of zombies to spawn
        const tierPercentage = this.waveData.zombieTierCount / this.waveData.waveDuration * this.waveData.waveInColour;

        // The tierPercentage is usually a decimal, so we floor to find the low tier and ceil to find the high tier
        // and then the tier that is going to be spawned is chosen at random
        // for example 1.5 is floored to 1 and ceiled to 2 so both tier 1 and 2 spawn

        if (this.waveData.finalZombie == true) {
            this.waveData.tiersToSpawn = [6, 7, 8]
        } else {
            this.waveData.tiersToSpawn = [
                Math.max(1, Math.min(this.waveData.zombieTierCount, Math.floor(tierPercentage))),
                Math.max(1, Math.min(this.waveData.zombieTierCount, Math.ceil(tierPercentage)))
            ];
        }

        const ticksToSpawn = server.cycleData.nightLength / server.serverProperties.tickRate / 2;
        const ticksBetweenZombieSpawns = ticksToSpawn / this.waveData.zombieSpawnEventCount[this.waveData.waveInColour - 1]

        this.waveData.zombieSpawnTicks = [];

        for (let i = server.cycleData.cycleStartTick; i < server.cycleData.cycleStartTick + ticksToSpawn; i += ticksBetweenZombieSpawns) {
            this.waveData.zombieSpawnTicks.push(Math.round(i + 1));
        }

        for (let i = 0; i < 0; i++) {
            const position = this.calculateZombieSpawnPosition(server, thisParty.radialDistribution);
            const tier = this.waveData.tiersToSpawn[Math.floor(Math.random() * this.waveData.tiersToSpawn.length)];

            this.createZombie(server, this.waveData.colour, position, tier, this.waveData.finalZombie);
        }
    }

    endWave(server) {
        this.waveCommenced = false;
    }

    weightedRandomSector(distribution) {
        // TODO: optimise this
        const totalWeight = distribution.reduce((sum, weight) => sum + weight, 0);

        // If there is no weight, there are no buildings. If there are no buildings, spawn zombies in a random sector
        if (totalWeight <= 0) {
            return Math.random() * distribution.length;
        }

        const randomValue = Math.random() * totalWeight;

        let cumulativeWeight = 0;
        for (let i = 0; i < distribution.length; i++) {
            cumulativeWeight += distribution[i];
            if (randomValue <= cumulativeWeight) return i;
        }

        
        return distribution.length - 1; // Fallback
    }

    calculateZombieSpawnPosition(server, buildingDistribution) {
        const randomSector = this.weightedRandomSector(buildingDistribution);
        const sectorAngle = randomSector * (Math.PI / 180);

        // TODO: minDistance must depend on the buildings
        // They must spawn a bit further out than the furthest building
        const minDistance = 1400 / server.world.PixelToWorld;

        // Calculate spawn position based on angle and distance
        const spawnX = (this.getPosition(server).x + Math.cos(sectorAngle) * minDistance) * server.world.PixelToWorld;
        const spawnY = (this.getPosition(server).y + Math.sin(sectorAngle) * minDistance) * server.world.PixelToWorld;

        // Spawn the zombie in a random position within a circle
        const randomAngle = Math.random() * 2 * Math.PI;
        const x = Math.max(0, Math.min(server.serverProperties.mapSize.width, spawnX + Math.floor(Math.random() * 192) * Math.cos(randomAngle)));
        const y = Math.max(0, Math.min(server.serverProperties.mapSize.height, spawnY + Math.floor(Math.random() * 192) * Math.sin(randomAngle)));

        return { x, y };
    }

    async die(server) {
        this.sendLeaderboardToDatabase(server);

        const thisParty = server.parties[this.partyId];

        for (let uid in thisParty.allBuildings.buildings) {
            if (parseInt(uid) !== this.uid) thisParty.allBuildings.buildings[parseInt(uid)].die(server);
        }

        if (server.gameMode == "scarcity") {  
            thisParty.resetResourcesCount();
        }

        for (let uid in thisParty.members) {
            thisParty.members[uid].hasSentDead = false;
            thisParty.members[uid].die(server, "FactoryDied");
        }

        for (let uid in thisParty.members) {
            thisParty.members[uid].score = 0;
        }

        this.spawnedZombieUids.forEach(uid => {
            server.entities[uid].die(server, true);
        });

        super.die(server);
    }

    async sendLeaderboardToDatabase(server) {
        return new Promise(async (res, rej) => {
            const thisParty = server.parties[this.partyId];

            let partyScore = 0;

            const playersArray = Object.values(thisParty.members).filter(member => {
                return member.ipAddress !== "127.0.0.1"
            }).map(member => {
                partyScore += member.score;

                return {
                    uid: member.uid,
                    score: member.score,
                    wave: member.wave,
                    name: member.name,
                    ipAddress: server.connectedSockets[member.uid].ipAddress,
                    wood: member.wood,
                    stone: member.stone,
                    gold: member.gold,
                    tokens: member.tokens
                }
            });

            for (let uid in thisParty.partyMemberCache) {
                if (playersArray.length >= thisParty.memberLimit) break;

                if (thisParty.partyMemberCache[uid].ipAddress == "127.0.0.1") continue;

                playersArray.push(thisParty.partyMemberCache[uid]);

                partyScore += thisParty.partyMemberCache[uid].score;
            }

            if (playersArray.length <= 0) {
                res();
                return;
            }

            // If there's no score or no wave, don't waste the space
            if (partyScore == 0 || this.wave == 0) {
                res();
                return;
            }

            const leaderboardEntryModel = mongoose.model("leaderboardEntry", leaderboardEntrySchema, `leaderboard_v${server.gameVersion}`);

            const leaderboardEntry = new leaderboardEntryModel({
                players: playersArray,
                score: partyScore,
                wave: this.wave,
                partyId: thisParty.id,
                partyName: thisParty.name,
                timeDead: Date.now(),
                version: server.gameVersion,
                gameMode: server.gameMode,
                serverPopulation: Object.keys(server.connectedSockets).length
            });

            await leaderboardEntry.save();

            server.debugLog(`[LEADERBOARD-UPDATE] ${leaderboardEntry._id} has been saved to the leaderboard`);

            res();
        });
    }

    zombieDied(server, uid) {
        if (this.dead !== true) {
            const zombieEntity = server.entities[uid];
            const scoreDistributed = zombieEntity.tentativeScore;

            for (let memberUid in server.parties[this.partyId].members) {
                server.entities[memberUid].score += Math.round(scoreDistributed / server.parties[this.partyId].memberCount);
            }

            if (zombieEntity.killedByUid !== 0) {
                const killedByEntity = server.entities[zombieEntity.killedByUid];
                if (killedByEntity !== undefined && killedByEntity.model == "Player") killedByEntity.score += Math.round(scoreDistributed);
            }
        }

        this.spawnedZombieUids.delete(uid);
    }

    update(server) {
        // Ensure the Factory always updates first to update the enemy query
        if (this.lastUpdateTickRan == server.tick) return;

        this.lastUpdateTickRan = server.tick;

        if (this.warmingUp == true) {
            const timeToWarmUp = 2000;
            const healthStepToMax = this.maxHealth / (timeToWarmUp / server.serverProperties.tickRate);
            this.health = Math.min(this.maxHealth, this.health + healthStepToMax);

            if (server.tick - this.tickMade >= timeToWarmUp / server.serverProperties.tickRate) this.warmingUp = false;

            return;
        }

        super.update(server);

        if (this.dead === true) return;


        this.changedGridCells.forEach(e => {
            e.length = 0;
        })

        this.changedGridCells.clear();

        // The Factory does one massive query for all of the towers to boost performance

        this.foundEnemy = false;

        const shape = new RAPIER.Cuboid(this.maxRange, this.maxRange);
        server.world.intersectionsWithShape(this.getPosition(server), 0, shape, collider => {
            const entity = server.entities[collider._parent?.userData?.uid];
            if (entity !== undefined && entity.dead !== true) {
                if (this.checkEntityIsEnemy(server, entity) == true) {
                        this.foundEnemy = true;

                        let entityTopLeft;
                        let entityTopRight;
                        let entityBottomLeft;
                        let entityBottomRight;

                        let entityPosition = entity.getPosition(server);

                        if (entity.radius !== undefined) {
                            let radius = entity.radius / 48;
                            entityTopLeft = {
                                x: Math.floor(entityPosition.x - radius),
                                y: Math.floor(entityPosition.y - radius)
                            };
                            entityTopRight = {
                                x: Math.ceil(entityPosition.x + radius),
                                y: Math.floor(entityPosition.y - radius)
                            }
                            entityBottomLeft = {
                                x: Math.floor(entityPosition.x - radius),
                                y: Math.ceil(entityPosition.y + radius)
                            }
                            entityBottomRight = {
                                x: Math.ceil(entityPosition.x + radius),
                                y: Math.ceil(entityPosition.y + radius)
                            }
                        } else if (entity.height !== undefined && entity.width !== undefined) {
                            let height = entity.height / 48;
                            let width = entity.width / 48;
                            entityTopLeft = {
                                x: Math.floor(entityPosition.x - width),
                                y: Math.floor(entityPosition.y - height)
                            };
                            entityTopRight = {
                                x: Math.ceil(entityPosition.x + width),
                                y: Math.floor(entityPosition.y - height)
                            }
                            entityBottomLeft = {
                                x: Math.floor(entityPosition.x - width),
                                y: Math.ceil(entityPosition.y + height)
                            }
                            entityBottomRight = {
                                x: Math.ceil(entityPosition.x + width),
                                y: Math.ceil(entityPosition.y + height)
                            }
                        }

                        if (this.enemyHashGrid[entityTopLeft.x]?.[entityTopLeft.y] !== undefined) {
                            this.enemyHashGrid[entityTopLeft.x][entityTopLeft.y] ||= [];
                            this.enemyHashGrid[entityTopLeft.x][entityTopLeft.y].push(entity.uid);
                            this.changedGridCells.add(this.enemyHashGrid[entityTopLeft.x][entityTopLeft.y]);
                        }
                        if (this.enemyHashGrid[entityTopRight.x]?.[entityTopRight.y] !== undefined) {
                            this.enemyHashGrid[entityTopRight.x][entityTopRight.y] ||= [];
                            this.enemyHashGrid[entityTopRight.x][entityTopRight.y].push(entity.uid);
                            this.changedGridCells.add(this.enemyHashGrid[entityTopRight.x][entityTopRight.y]);
                        }
                        if (this.enemyHashGrid[entityBottomLeft.x]?.[entityBottomLeft.y] !== undefined) {
                            this.enemyHashGrid[entityBottomLeft.x][entityBottomLeft.y] ||= [];
                            this.enemyHashGrid[entityBottomLeft.x][entityBottomLeft.y].push(entity.uid);
                            this.changedGridCells.add(this.enemyHashGrid[entityBottomLeft.x][entityBottomLeft.y]);
                        }
                        if (this.enemyHashGrid[entityBottomRight.x]?.[entityBottomRight.y] !== undefined) {
                            this.enemyHashGrid[entityBottomRight.x][entityBottomRight.y] ||= [];
                            this.enemyHashGrid[entityBottomRight.x][entityBottomRight.y].push(entity.uid);
                            this.changedGridCells.add(this.enemyHashGrid[entityBottomRight.x][entityBottomRight.y]);
                        }
                    }
            }
            return true;
        }, undefined, 0x00040002);

        this.spawnZombies(server);
    }

    checkEntityIsEnemy(server, entity) {
        if (entity.partyId == this.partyId) return false;
        if (entity.deadLastTick == true) return false;

        if (entity.entityClass == "Zombie") return true;

        if (entity.entityClass == "Player") {
            if (this.aggroEnabled == true) return true;

            if (this.aggressionData.partyIds.has(entity.partyId) ||
                this.aggressionData.playerUids.has(entity.uid) ||
                this.aggressionData.playerIps.has(server.connectedSockets[entity.uid]?.ipAddress)
            ) return true;
        }

        return false;
    }

    spawnZombies(server) {
        if (this.dead == true) return;

        // Zombies can only be spawned during the night if the Factory was placed before the night started
        if (this.waveCommenced == false) return;

        // Zombies can only be spawned in the first half of the night
        if (server.tick - server.cycleData.cycleStartTick > server.cycleData.nightLength / server.serverProperties.tickRate / 2) return;

        if (this.waveData.zombieSpawnTicks.includes(server.tick)) {
            const thisParty = server.parties[this.partyId];

            let zombiesPerSpawnTick = this.waveData.zombiesSpawnedInWave[this.waveData.waveInColour - 1] / this.waveData.zombieSpawnEventCount[this.waveData.waveInColour - 1];

            // Some random offset every spawn tick
            zombiesPerSpawnTick += Math.round(Math.random() * 10) - 5;

            // More party members = more zombies
            let lastPosition = this.calculateZombieSpawnPosition(server, thisParty.radialDistribution);
            for (let i = 0; i < thisParty.memberCount * zombiesPerSpawnTick; i++) {
            // for (let i = 0; i < 4 * zombiesPerSpawnTick; i++) {
            // for (let i = 0; i < 0; i++) {
                let position = this.calculateZombieSpawnPosition(server, thisParty.radialDistribution);

                // Let there be a chance that more than one zombie spawns in the same place
                if (Math.random() < 0.2) position = lastPosition;

                const tier = this.waveData.tiersToSpawn[Math.floor(Math.random() * this.waveData.tiersToSpawn.length)];

                this.createZombie(server, this.waveData.colour, position, tier, this.waveData.finalZombie);

                lastPosition = position;
            }
        }
    }

    createZombie(server, colour, position, tier, finalZombie) {
        // find a random pathfind frequency between 2000 and 3000 milliseconds in increments of the server tick
        let pathfindFrequency = Math.floor(Math.random() * (3000 - 2000 + 1) / server.serverProperties.tickRate) * server.serverProperties.tickRate + 2000;

        server.waitTicks(Math.floor(Math.random() * 5), () => {
            if (this.dead !== true) {
                server.createEntity("Zombie", {
                    colour,
                    finalZombie,
                    pathfindFrequency,
                    position,
                    tier,
                    target: this.uid
                });
            }
        });
    }
}

module.exports = Factory;