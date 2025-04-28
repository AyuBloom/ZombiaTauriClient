const BuildingInfo = require("../../Info/BuildingInfo.js");
const Util = require("../../Util.js");
const PacketIds = require("../PacketIds.json");

module.exports = UpgradeBuilding = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    if (playerParty.primaryBuilding == null) return;

    // Cache failure messages that are sent so that the server doesn't send multiple of the same message for the same rpc
    const messagesSent = [];
    let buildings = [];

    for (let uid of data.uids) {
        uid = parseInt(uid);

        const building = server.entities[uid];
        // Verify that the buiding exists
        if (building === undefined) continue;

        // Verify that the building is in the same party as the player
        if (building.partyId !== playerEntity.partyId) continue;

        // Verify that the building is a building
        if (building.entityClass !== "Building") continue;

        const buildingInfo = BuildingInfo.getBuilding(server, building.model, building.tier + 1);

        // Verify that the player is able to afford upgrading the building
        if (!Util.canAfford(server, playerEntity, buildingInfo)) {
            const message = "You do not have enough resources to upgrade this building(s).";
            if (!messagesSent.includes(message)) {
                messagesSent.push(message);

                socket.sendMessage(PacketIds["PACKET_RPC"], {
                    name: "Failure",
                    response: {
                        failure: message
                    }
                })
            }
            continue;
        }

        // Verify that the building's tier cannot be higher than the primary building's tier
        if (building.model !== "Factory") {
            if (building.tier >= buildingInfo.tiers) {
                const message = "This is the highest tier you can reach!";
                if (!messagesSent.includes(message)) {
                    messagesSent.push(message);
                    socket.sendMessage(PacketIds["PACKET_RPC"], {
                        name: "Failure",
                        response: {
                            failure: message
                        }
                    })
                    continue;
                }
            }

            if (building.tier >= server.entities[playerParty.primaryBuilding].tier) {
                const message = "You must upgrade your factory first.";
                if (!messagesSent.includes(message)) {
                    messagesSent.push(message);

                    socket.sendMessage(PacketIds["PACKET_RPC"], {
                        name: "Failure",
                        response: {
                            failure: "You must upgrade your factory first."
                        }
                    })
                }
                continue;
            }
        } else {
            if (building.tier >= buildingInfo.tiers) {
                const message = "This is the highest tier you can reach!";
                if (!messagesSent.includes(message)) {
                    messagesSent.push(message);
                    socket.sendMessage(PacketIds["PACKET_RPC"], {
                        name: "Failure",
                        response: {
                            failure: message
                        }
                    })
                    continue;
                }
            }
        }

        // Verify that the position of the building is not too far from the player
        const maxDistanceFromPlayer = server.serverProperties.maxPlayerBuildDistance;
        if (Math.abs(playerEntity.getPosition(server).x - building.getPosition(server).x) > maxDistanceFromPlayer ||
            Math.abs(playerEntity.getPosition(server).y - building.getPosition(server).y) > maxDistanceFromPlayer) {
                socket.sendMessage(PacketIds["PACKET_RPC"], {
                    name: "Failure",
                    response: {
                        failure: "You cannot upgrade buildings too far away."
                    }
                })
                continue;
            }

        Util.deductResourceCosts(server, playerEntity, buildingInfo);

        building.tier++;

        if (buildingInfo.health !== undefined) {
            building.health = (building.health / building.maxHealth) * buildingInfo.health;
            building.maxHealth = buildingInfo.health;
        }

        building.updateRangeCells(server);

        building.upgrade?.(server);

        buildings.push(building);

        server.debugLog(`[INFO] ${playerEntity.name} (${playerEntity.uid} - ${socket.ipAddress}) upgraded a ${building.model} at (${building.getPosition(server).x}, ${building.getPosition(server).y}) to tier ${building.tier}`);
    }

    if (buildings.length > 0) playerParty.updateBuilding(server, buildings);
}