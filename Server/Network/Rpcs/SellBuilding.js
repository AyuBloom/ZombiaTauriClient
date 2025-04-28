const PacketIds = require("../PacketIds.json");
const BuildingInfo = require("../../Info/BuildingInfo.js");

module.exports = SellBuilding = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    if (playerParty.primaryBuilding == null) return;

    // Verify that the player has selling permissions
    if (playerEntity.canSell === false && playerEntity.developerMode == false) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You do not have the required permissions to sell this building(s)."
            }
        })
        return;
    }

    const resourcesRefunded = {
        gold: 0,
        wood: 0,
        stone: 0,
        tokens: 0
    };

    // Restrict players to only sell buildings of the same type
    let typeOfFirstBuilding;

    for (let uid of data.uids) {
        uid = parseInt(uid);

        const building = server.entities[uid];
        // Verify that the buiding exists
        if (building === undefined) continue;

        if (building.dead == true) continue;

        if (typeOfFirstBuilding == undefined) typeOfFirstBuilding = building.model;

        if (building.model !== typeOfFirstBuilding) continue;

        // Verify that the building is in the same party as the player
        if (building.partyId !== playerEntity.partyId) continue;

        // Verify that the building is a building
        if (building.entityClass !== "Building") continue;

        // Verify that the building is not the primary building
        if (building.model === "Factory") continue;

        // Verify that the position of the building is not too far from the player
        const distanceFromPlayer = server.serverProperties.maxPlayerBuildDistance;
        if (Math.abs(playerEntity.getPosition(server).x - building.getPosition(server).x) > distanceFromPlayer ||
            Math.abs(playerEntity.getPosition(server).y - building.getPosition(server).y) > distanceFromPlayer) {
                socket.sendMessage(PacketIds["PACKET_RPC"], {
                    name: "Failure",
                    response: {
                        failure: "You cannot sell buildings too far away."
                    }
                })
                continue;
            }

        server.debugLog(`[INFO] ${playerEntity.name} (${playerEntity.uid} - ${socket.ipAddress}) sold a ${building.model} at (${building.getPosition(server).x}, ${building.getPosition(server).y}) at tier ${building.tier}`);

        building.die(server);

        const resources = ["wood", "stone", "gold", "tokens"];
        const buildingTierInfo = BuildingInfo.getBuildingProp(building.model, "*");
        for (const resource of resources) {
            const resourceKey = `${resource}Costs`;
            if (buildingTierInfo[resourceKey]) {
                const rawRefund = buildingTierInfo[resourceKey].slice(0, building.tier).reduce((a, b) => a + b);
                resourcesRefunded[resource] ||= 0;
                resourcesRefunded[resource] += rawRefund;
            }
        }
    }

    if (server.gameMode == "scarcity") {
        const playerParty = server.parties[playerEntity.partyId];
        for (let prop in resourcesRefunded) playerParty.resources[prop] += Math.floor(resourcesRefunded[prop] * 0.75);

        for (let uid in playerParty.members) {
            server.entities[uid].gold = playerParty.resources.gold;
            server.entities[uid].stone = playerParty.resources.stone;
            server.entities[uid].wood = playerParty.resources.wood;
        }
    } else {
        for (let prop in resourcesRefunded) playerEntity[prop] += Math.floor(resourcesRefunded[prop] * 0.75);
    }
}