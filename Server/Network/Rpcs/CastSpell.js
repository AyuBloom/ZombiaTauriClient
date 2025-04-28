const spellInfo = require("../../Info/SpellInfo.js");
const Util = require("../../Util.js");
const PacketIds = require("../PacketIds.json");

const checkPrimaryExists = (server, socket, playerParty) => {
    // Ensure the party has a primary building
    if (server.entities[playerParty.primaryBuilding] == undefined || server.entities[playerParty.primaryBuilding].dead == true) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You need a Factory to be able to cast this spell."
            }
        });

        return false;
    }
}

const checkSpellCooldownActive = (server, socket, playerParty, spellName) => {
    // Ensure the party hasn't timed out too recently
    if (playerParty.spells[spellName].cooldownActive == true) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You can't use this spell again yet."
            }
        })

        return true;
    }
}

module.exports = CastSpell = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    // Ensure the player is not dead
    if (playerEntity.dead == true) return;

    const spellData = spellInfo.getSpell(data.spellName);

    // Check if the spell exists
    if (spellData == undefined) return;

    // Check if the player can afford the spell
    if (!Util.canAfford(server, playerEntity, spellData)) {
        return socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You do not have enough resources to buy this spell."
            }
        })
    }

    let iconCooldownMs;
    let cooldownMs;

    // Behaviour depends on type of spell
    switch (data.spellName) {
        case "Timeout":
            {
                if (checkPrimaryExists(server, socket, playerParty) == false) return;

                if (checkSpellCooldownActive(server, socket, playerParty, data.spellName) == true) return;

                const primaryBuilding = server.entities[playerParty.primaryBuilding];

                primaryBuilding.timedOut = true;

                // --- End spell ---

                // Cooldown is customised so that the icon on the client disappears when the night starts
                const ticksToCycleEnd = server.cycleData.cycleEndTick - server.tick;
            
                if (server.cycleData.isDay == true) {
                    // If it's day when the timeout is being bought, the icon will only be
                    // on screen for the rest of the day
                    iconCooldownMs = ticksToCycleEnd * server.serverProperties.tickRate;
                } else {
                    // If it's night when the timeout is being bought, the icon will be
                    // on screen for the full duration of the night, plus the next day
                    iconCooldownMs = server.cycleData.dayLength + ticksToCycleEnd * server.serverProperties.tickRate;
                }
            
                // The spell becomes available when the next night begins
                if (server.cycleData.isDay == true) {
                    // If it's day when the timeout is being bought, the spell won't be available for:
                    // the rest of the day + the duration of the night + the duration of the next day
                    // then it becomes available as the next night starts
                    cooldownMs = (ticksToCycleEnd * server.serverProperties.tickRate) + server.cycleData.nightLength + server.cycleData.dayLength;
                } else {
                    // If it's night when the timeout is being bought, the spell won't be available for:
                    // the rest of the night + the duration of the next day + the duration of the next night + the duration of the day after
                    // then it becomes available as the next night starts
                    cooldownMs = (ticksToCycleEnd * server.serverProperties.tickRate) + (server.cycleData.dayLength * 2) + server.cycleData.nightLength;
                }
            }
            break;
        case "Rapidfire":
            {
                if (checkPrimaryExists(server, socket, playerParty) == false) return;

                // Ensure the buff is within the world confines
                if (data.x < 0 || data.x > server.serverProperties.mapSize.width ||
                    data.y < 0 || data.y > server.serverProperties.mapSize.height) return;

                // Verify that the position of the spell is not too far from the player
                const maxDistanceFromPlayer = server.serverProperties.maxPlayerSpellCastDistance - (spellData.radius / server.world.PixelToWorld);

                if (Math.abs(playerEntity.getPosition(server).x - (data.x / server.world.PixelToWorld)) > maxDistanceFromPlayer ||
                    Math.abs(playerEntity.getPosition(server).y - (data.y / server.world.PixelToWorld)) > maxDistanceFromPlayer)
                {
                        socket.sendMessage(PacketIds["PACKET_RPC"], {
                            name: "Failure",
                            response: {
                                failure: "You can't cast a spell that far away."
                            }
                        });
                        return;
                }

                if (checkSpellCooldownActive(server, socket, playerParty, data.spellName) == true) return;

                const towerBuffEntity = server.createEntity("SpellIndicator", {
                    position: {
                        x: data.x,
                        y: data.y
                    },
                    radius: spellData.radius,
                    spellType: "Rapidfire",
                    partyId: playerEntity.partyId
                });

                server.waitTicks(spellData.buffDurationMs / server.serverProperties.tickRate, () => {
                    towerBuffEntity.die(server);
                })

                // --- End spell ---

                // Tower buff can only be used once per day/night cycle.
                // If you use it during night, you'll need to wait until the next night starts to use it
                // If you use it during day, you can use it again when the next night starts
                const ticksToCycleEnd = server.cycleData.cycleEndTick - server.tick;

                // Icon only shows while the buff is being applied
                iconCooldownMs = spellData.buffDurationMs;

                // The spell becomes available when the next night begins
                if (server.cycleData.isDay == true) {
                    // If it's day when the buff is being bought, the spell won't be available for the rest of the day
                    // then it becomes available as the next night starts

                    cooldownMs = (ticksToCycleEnd * server.serverProperties.tickRate);
                } else {
                    // If it's night when the buff is being bought, the spell won't be available for:
                    // the rest of the night + the duration of the next day
                    // then it becomes available as the next night starts
                    cooldownMs = (ticksToCycleEnd * server.serverProperties.tickRate) + server.cycleData.dayLength;
                }
            }
            break;
    }

    playerParty.spells[data.spellName].cooldownExpiringTick = server.tick + cooldownMs / server.serverProperties.tickRate;
    playerParty.spells[data.spellName].cooldownIconExpiringTick = server.tick + iconCooldownMs / server.serverProperties.tickRate;

    for (let i in playerParty.members) {
        server.connectedSockets[i].sendMessage(PacketIds["PACKET_RPC"], {
            name: "CastSpellResponse",
            response: {
                name: data.spellName,
                iconCooldown: iconCooldownMs,
                cooldown: cooldownMs
            }
        })
    }

    // Set a purchase cooldown of a 2x day/night cycle for the party
    playerParty.spells[data.spellName].cooldownActive = true;

    server.waitTicks(cooldownMs / server.serverProperties.tickRate, () => {
        playerParty.spells[data.spellName].cooldownActive = false;
    })

    Util.deductResourceCosts(server, playerEntity, spellData);
}