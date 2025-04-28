const Entity = require("./Entity.js");
const EntityInfo = require("../Info/EntityInfo.js");
const ToolInfo = require("../Info/ToolInfo.js");
const RAPIER = require("@dimforge/rapier2d-compat");
const Util = require("../Util.js");
const PacketIds = require("../Network/PacketIds.json");

let defaultTools = [
    {
        "toolName": "Pickaxe",
        "toolTier": 1
    }
];

class Player extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            aimingYaw: 0,
            canPlace: true,
            canSell: true,
            canWalkThroughBuildings: false,
            dead: false,
            developerMode: false,
            entityClass: "Player",
            firingTick: 0,
            ghostMode: false,
            // A property to ensure the server doesn't spam the client with the Dead rpc
            hasSentDead: false,
            health: 500,
            // Object to keep track of inputs keys that are held down
            inputs: {
                aimingYaw: 0,
                movement: {
                    up: false,
                    down: false,
                    left: false,
                    right: false
                },
                mouseDown: false,
                falseSpaceReading: false,
                mousePosition: {
                    x: 0,
                    y: 0
                }
            },
            invulnerable: false,
            lastPlayerDamages: [],
            lastDamagedTick: 0,
            lastShieldHitTick: 0,
            maxHealth: 500,
            gold: 0,
            model: "Player",
            outOfSync: false,
            partyId: 0,
            // This is a property to track the tick that the party request was sent on, to prevent spamming
            partyRequestSentTick: 0,
            // This is a property to track the id that the player has requested, to ensure the player requested to the party that the response says it did
            partyRequestId: 0,
            radius: EntityInfo.getEntity("Player").radius,
            // This is a property to ensure that the respawn event occurs during the tick instead of asynchronously
            respawning: false,
            score: 0,
            // This is a property to make sure the server only removes the player from the world if the player is no longer connected
            socketDestroyed: false,
            stone: 500,
            // Timer object to store rate limiters
            timers: {
                "SendChatMessage": {
                    lastTimerActive: 0,
                    active: false,
                    delay: 500
                },
                "HealthPotion": {
                    lastTimerActive: 0,
                    active: false,
                    delay: 7500
                },
                "JoinParty": {
                    lastTimerActive: 0,
                    active: false,
                    delay: 3000
                },
                "TogglePartyPermission": {
                    lastTimerActive: 0,
                    active: false,
                    delay: 200
                },
                "RandomisePartyKey": {
                    lastTimerActive: 0,
                    active: false,
                    delay: 30000
                }
            },
            tokens: 0,
            tools: [],
            wave: 0,
            wood: 500,
            yaw: 0,
            zombieShieldHealth: 0,
            zombieShieldMaxHealth: 0
        }, props));

        if (server.gameMode == "scarcity") {
            defaultTools = [
                {
                    "toolName": "Pickaxe",
                    "toolTier": 7
                },
                {
                    "toolName": "Sword",
                    "toolTier": 7
                },
                {
                    "toolName": "Crossbow",
                    "toolTier": 7
                },
                {
                    "toolName": "Dynamite",
                    "toolTier": 7
                },
                {
                    "toolName": "ZombieShield",
                    "toolTier": 10
                }
            ]
        }

        this.tools = JSON.parse(JSON.stringify(defaultTools));

        // Assign the first available tools to the player class
        this.weaponName = defaultTools[0].toolName;
        this.weaponTier = defaultTools[0].toolTier;

        Object.values(this.tools).forEach(e => {
            if (e.toolName == "ZombieShield") {
                const toolInfo = ToolInfo.getTool("ZombieShield", e.toolTier);
                this.zombieShieldMaxHealth = this.zombieShieldHealth = toolInfo.health;
            }
        })

        this.previouslyKnownEntityUids = [];
        this.currentlyKnownEntityUids = [];
        this.brandNewEntityUids = [];

        this.deadLastTick = false;
    }

    addToWorld(server) {
        super.addToWorld(server);
        const body = RAPIER.RigidBodyDesc.dynamic()
            .setLinearDamping(server.world.PixelToWorld)
            .setUserData({ uid: this.uid });

        this.physicsObject = server.world.createRigidBody(body);

        this.sightRange = new RAPIER.Cuboid(EntityInfo.getEntity("Player").sightRange.width / server.world.PixelToWorld, EntityInfo.getEntity("Player").sightRange.height / server.world.PixelToWorld);

        this.physicsObject.setTranslation({ x: this.position.x / server.world.PixelToWorld, y: this.position.y / server.world.PixelToWorld }, true);

        const collider = RAPIER.ColliderDesc.ball(this.radius / server.world.PixelToWorld)
            .setCollisionGroups(0x0002000F);

        server.world.createCollider(collider, this.physicsObject);

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();

        const playerData = EntityInfo.getEntity("Player");
        this.movementSpeed = playerData.speed;
    }

    respawn(server) {
        const playerParty = server.parties[this.partyId];

        if (playerParty.primaryBuilding !== null) {
            this.physicsObject.setTranslation(server.entities[playerParty.primaryBuilding].getPosition(server));
        } else {
            const randomMapPosition = Util.randomMapPosition(server.serverProperties.mapSize);
            this.physicsObject.setTranslation({ x: randomMapPosition.x / server.world.PixelToWorld, y: randomMapPosition.y / server.world.PixelToWorld });
        }

        this.physicsObject.wakeUp();

        this.respawning = false;
        this.hasSentDead = false;
        this.dead = false;
        this.health = this.maxHealth;
        this.zombieShieldHealth = 0;
        this.zombieShieldMaxHealth = 0;

        if (server.gameMode !== "scarcity") {
            this.wood *= 0.75;
            this.stone *= 0.75;
            this.gold *= 0.75;
        }

        this.physicsObject.collider(0).setCollisionGroups(0x0002000F);

        // Newly respawned players can't collide with buildings and are invulnerable
        this.canWalkThroughBuildings = true;
        let deathTick = this.lastDeathTick;
        this.invulnerable = true;

        server.waitTicks(15000 / server.serverProperties.tickRate, () => {
            if (this.dead == false && this.lastDeathTick == deathTick) {
                this.canWalkThroughBuildings = false;
                this.invulnerable = false;
            }
        });

        server.connectedSockets[this.uid].sendMessage(PacketIds["PACKET_RPC"], {
            name: "Respawned"
        })

        let tools = [];
        for (let tool of this.tools) tools.push({ toolName: tool.toolName, toolTier: 0 });

        this.tools = JSON.parse(JSON.stringify(defaultTools));
        this.weaponName = defaultTools[0].toolName;
        this.weaponTier = defaultTools[0].toolTier;

        Object.values(this.tools).forEach(e => {
            if (e.toolName == "ZombieShield") {
                const toolInfo = ToolInfo.getTool("ZombieShield", e.toolTier);
                this.zombieShieldMaxHealth = this.zombieShieldHealth = toolInfo.health;
            }
        })

        Object.assign(tools, this.tools);

        server.connectedSockets[this.uid].sendMessage(PacketIds["PACKET_RPC"], {
            name: "SetTool",
            response: tools
        })
    }

    die(server, reason = "Killed") {
        if (this.socketDestroyed === true) super.die(server);
        else {
            this.health = 0;
            this.dead = true;
            this.lastDeathTick = server.tick;
            this.invulnerable = false;

            // Set a dead player to not collide with anything
            this.physicsObject.collider(0).setCollisionGroups(0);

            if (this.hasSentDead === false) {
                this.hasSentDead = true;

                const thisParty = server.parties[this.partyId];
                let partyScore = 0;

                for (let i in thisParty.members) {
                    partyScore += thisParty.members[i].score;
                }

                if (reason === "Killed" && thisParty.primaryBuilding !== null) {
                    this.tokens = 0;
                    reason = "KilledWithBase";
                }

                server.connectedSockets[this.uid].sendMessage(PacketIds["PACKET_RPC"], {
                    name: "Dead",
                    response: {
                        reason: reason,
                        wave: server.entities[thisParty.primaryBuilding]?.wave || 0,
                        score: this.score,
                        partyScore: partyScore
                    }
                });

                // If the Factory died, it will sum up the scores of all the party members and then clear,
                // clearing the score before it can count the scores will result in an inaccurate reading,
                // so the player only clears its own score if the Factory has not died
                if (reason !== "FactoryDied") this.score = 0;
            }
        }
    }

    update(server) {
        super.update(server);

        this.deadLastTick = !!this.dead;

        if (this.socketDestroyed === true) this.die(server);
        if (this.health <= 0 && this.dead !== true && this.developerMode === false) this.die(server);

        if (this.respawning === true) this.respawn(server);

        const thisParty = server.parties[this.partyId];

        if (thisParty !== undefined) {
            let tempWave = 0;
            if (thisParty.primaryBuilding !== null) {
                const partyPrimaryBuilding = server.entities[thisParty.primaryBuilding];
                tempWave = partyPrimaryBuilding.wave;
            }
            if (tempWave !== this.wave) this.wave = tempWave;
        }

        if (this.dead == true) return;

        const playerData = EntityInfo.getEntity("Player");
        const toolInfo = ToolInfo.getTool(this.weaponName, this.weaponTier);

        if (this.inputs.aimingYaw !== this.aimingYaw) this.aimingYaw = this.inputs.aimingYaw;

        if (Object.values(this.inputs.movement).includes(true)) {
            this.physicsObject.applyImpulse({
                x: Math.sin(this.yaw * Math.PI / 180) * this.movementSpeed / (1000 / server.serverProperties.tickRate),
                y: -Math.cos(this.yaw * Math.PI / 180) * this.movementSpeed / (1000 / server.serverProperties.tickRate)
            }, true);
        }

        if (this.inputs.mouseDown === true && server.tick - this.firingTick > toolInfo.msBetweenFires / server.serverProperties.tickRate) {
            this.firingTick = server.tick;

            switch (this.weaponName) {
                case "Pickaxe":
                case "Sword":
                    {
                        // Create shape to scan, that being the radius of the player + its tool's range
                        const shape = new RAPIER.Ball((this.radius + toolInfo.range) / server.world.PixelToWorld);
                        // Scan within the shape
                        server.world.intersectionsWithShape(this.getPosition(server), 0, shape, collider => {
                            // Make sure the collider detected is an entity
                            const entity = server.entities[collider._parent?.userData?.uid];
                            if (entity !== undefined) {
                                // Make sure the collider detected is not the player, and ensure the player is facing the collider
                                if (entity.uid !== this.uid && Util.isFacing(this, entity, toolInfo.maxYawDeviation, server) === true) this.hit(server, entity);
                            }
                            return true;
                        }, undefined, 0xffffffff)
                    }
                    break;
                case "Crossbow":
                    {
                        server.createEntity("ArrowProjectile", {
                            entityKnockback: toolInfo.projectileEntityKnockback,
                            damages: {
                                damageToBuildings: toolInfo.damageToBuildings,
                                damageToPlayers: toolInfo.damageToPlayers,
                                damageToZombies: toolInfo.damageToZombies,
                                damageToNeutrals: toolInfo.damageToNeutrals
                            },
                            homing: toolInfo.projectileAbleToHome,
                            lifetime: toolInfo.projectileLifetime,
                            model: "ArrowProjectile",
                            parentUid: this.uid,
                            partyId: this.partyId,
                            position: {
                                x: this.getPosition(server).x * server.world.PixelToWorld + Math.sin(this.aimingYaw * Math.PI / 180) * 64,
                                y: this.getPosition(server).y * server.world.PixelToWorld - Math.cos(this.aimingYaw * Math.PI / 180) * 64
                            },
                            speed: toolInfo.projectileSpeed,
                            tickMade: server.tick,
                            yaw: this.aimingYaw
                        });
                    }
                    break;
                case "Dynamite":
                    {
                        server.createEntity("DynamiteProjectile", {
                            entityKnockback: toolInfo.projectileEntityKnockback,
                            damages: {
                                damageToBuildings: toolInfo.damageToBuildings,
                                damageToPlayers: toolInfo.damageToPlayers,
                                damageToZombies: toolInfo.damageToZombies,
                                damageToNeutrals: toolInfo.damageToNeutrals
                            },
                            homing: toolInfo.projectileAbleToHome,
                            lifetime: toolInfo.projectileLifetime,
                            parentUid: this.uid,
                            partyId: this.partyId,
                            position: {
                                x: this.getPosition(server).x * server.world.PixelToWorld + Math.sin(this.aimingYaw * Math.PI / 180) * 64,
                                y: this.getPosition(server).y * server.world.PixelToWorld - Math.cos(this.aimingYaw * Math.PI / 180) * 64
                            },
                            speed: toolInfo.projectileSpeed,
                            targetPosition: {
                                x: Math.round(this.inputs.mousePosition.x / server.world.PixelToWorld),
                                y: Math.round(this.inputs.mousePosition.y / server.world.PixelToWorld)
                            },
                            tickMade: server.tick,
                            tier: this.weaponTier,
                            yaw: this.aimingYaw
                        });
                    }
                    break;
            }
        }

        // Auto heal after some time
        const ticksBeforeRegen = playerData.msBeforeRegen / server.serverProperties.tickRate;

        if (this.health < this.maxHealth && (server.tick >= this.lastDamagedTick + ticksBeforeRegen || this.developerMode === true)) {
            if (this.developerMode === true) {
                this.health = Math.min(this.maxHealth, this.health + playerData.healthRegenPerSecond / 250 * server.serverProperties.tickRate);
            } else {
                this.health = Math.min(this.maxHealth, this.health + playerData.healthRegenPerSecond / 1000 * server.serverProperties.tickRate);
            }
        }

        // Auto heal the shield after some time
        if (this.zombieShieldMaxHealth > 0) {
            const shieldInfo = ToolInfo.getTool("ZombieShield", this.tools.find(e => e.toolName == "ZombieShield").toolTier);
            
            if (this.zombieShieldHealth < this.zombieShieldMaxHealth) {
                const ticksBeforeRegen = shieldInfo.msBeforeRegen / server.serverProperties.tickRate;

                if (server.tick >= this.lastShieldHitTick + ticksBeforeRegen || this.developerMode === true) {
                    this.zombieShieldHealth = Math.min(this.zombieShieldMaxHealth, this.zombieShieldHealth + shieldInfo.healthRegenPerSecond / 1000 * server.serverProperties.tickRate);
                }
            }
        }

        // Clear any player timers that have expired
        for (let timer in this.timers) {
            if (this.timers[timer].active == false) continue;
            if (server.tick > this.timers[timer].lastTimerActive + this.timers[timer].delay / server.serverProperties.tickRate) this.timers[timer].active = false;
        }
    }

    hit(server, hitEntity) {
        if (this.partyId == hitEntity.partyId) return;

        if (hitEntity.entityClass !== "Resource") {
            if (hitEntity.health == undefined) return;
            if (hitEntity.health <= 0) return;
        }

        const currentTick = server.tick;
        const toolInfo = ToolInfo.getTool(this.weaponName, this.weaponTier);

        let damageToDeal = 0;

        switch (hitEntity.entityClass) {
            case "Resource":
                if (this.weaponName === "Pickaxe") {
                    // Workaround for Proxies not recognising Array.push as a variable update
                    let tempArray = hitEntity.hits;
                    tempArray.push(currentTick, Math.floor(Util.angleTo(this.getPosition(server), hitEntity.getPosition(server))));
                    hitEntity.hits = tempArray;

                    if (server.gameMode !== "scarcity") {
                        switch (hitEntity.resourceType) {
                            case "Tree":
                                this.wood += toolInfo.harvestAmount;
                                break;
                            case "Stone":
                                this.stone += toolInfo.harvestAmount;
                                break;
                        }
                    }
                }
                break;

            case "Building":
                if (this.invulnerable == true) this.invulnerable = false;
                if (this.weaponName == "Sword") damageToDeal = toolInfo.damageToBuildings * hitEntity.maxHealth;

                this.timers["HealthPotion"].active = true;
                this.timers["HealthPotion"].lastTimerActive = server.tick
                break;
            case "Player":
                if (this.invulnerable == true) this.invulnerable = false;
                damageToDeal = toolInfo.damageToPlayers;
                if (hitEntity.invulnerable == true) damageToDeal = 0;
                break;
            case "Zombie":
                if (this.invulnerable == true) this.invulnerable = false;
                damageToDeal = toolInfo.damageToZombies;

                if (server.gameMode == "scarcity") {
                    const factoryEntity = server.entities[hitEntity.target];
                    if (factoryEntity !== undefined) {
                        if (this.partyId !== factoryEntity.partyId) damageToDeal = 0;
                    }
                }
                break;
            case "Neutral":
            case "Npc":
                damageToDeal = toolInfo.damageToNeutrals;
            break;
        }

        // Scarcity mode disables PvP
        if (server.gameMode == "scarcity" && hitEntity.entityClass !== "Zombie") damageToDeal = 0;

        if (damageToDeal > 0) {
            // Workaround for Proxies not recognising Array.push as a variable update
            let tempArray = this.lastPlayerDamages;
            tempArray.push(hitEntity.uid, damageToDeal);
            this.lastPlayerDamages = tempArray;

            hitEntity.lastDamagedTick = currentTick;
            hitEntity.health = Math.max(hitEntity.health - damageToDeal, 0);
            hitEntity.hitResponse?.(server, this);
        }
    }

    hitResponse(server, entity) {
        server.entities[server.parties[this.partyId]?.primaryBuilding]?.hitResponse(server, entity);
    }
}

module.exports = Player;