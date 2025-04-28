const Util = require("../../Util.js");
const BuildingInfo = require("../../Info/BuildingInfo.js");
const PacketIds = require("../PacketIds.json");

module.exports = BuyHarvesterDrone = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];

    if (server.gameMode == "scarcity" && playerEntity.developerMode !== true) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "Harvester drones cannot be bought in Scarcity mode."
            }
        })
        return;
    }

    const harvesterEntity = server.entities[data.harvesterUid];

    if (harvesterEntity == undefined) return;

    if (harvesterEntity.model !== "Harvester") return;

    const buildingInfo = BuildingInfo.getBuilding(server, "Harvester", harvesterEntity.tier);

    if (harvesterEntity.partyId !== playerEntity.partyId) return;

    // Verify that the position of the building is not too far from the player
    const maxDistanceFromPlayer = server.serverProperties.maxPlayerBuildDistance;
    if (Math.abs(playerEntity.getPosition(server).x - harvesterEntity.getPosition(server).x) > maxDistanceFromPlayer ||
        Math.abs(playerEntity.getPosition(server).y - harvesterEntity.getPosition(server).y) > maxDistanceFromPlayer) {
            return;
    }

    // Verify that the player is able to afford upgrading the building
    if (!Util.canAfford(server, playerEntity, { goldCosts: buildingInfo.droneGoldCosts })) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You do not have enough resources to buy another drone."
            }
        })
        return;
    }

    if (harvesterEntity.droneCount >= buildingInfo.maxDrones & !playerEntity.developerMode) return;

    if (playerEntity.developerMode == false) {
        Util.deductResourceCosts(server, playerEntity, { goldCosts: buildingInfo.droneGoldCosts })
    }

    harvesterEntity.spawnDrone(server);
}