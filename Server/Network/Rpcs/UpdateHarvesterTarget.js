const Util = require("../../Util.js");
const BuildingInfo = require("../../Info/BuildingInfo.js");

module.exports = UpdateHarvesterTarget = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];

    const harvesterEntity = server.entities[data.harvesterUid];
    const targetResource = server.entities[data.targetUid];

    if (harvesterEntity == undefined) return;

    if (harvesterEntity.model !== "Harvester") return;

    if (harvesterEntity.partyId !== playerEntity.partyId) return;

    if (data.targetUid == 0) {
        harvesterEntity.setTargetResourceUid(server, 0);
        return;
    }

    if (targetResource == undefined) return;

    if (targetResource.entityClass !== "Resource") return;

    // Check range
    const harvesterBuildingInfo = BuildingInfo.getBuilding(server, "Harvester", harvesterEntity.tier);
    const distToTarget = Math.sqrt(Util.measureDistance(server, harvesterEntity.getPosition(server), targetResource.getPosition(server))) * server.world.PixelToWorld;

    if (distToTarget + targetResource.radius > harvesterBuildingInfo.harvestRange) return;

    harvesterEntity.setTargetResourceUid(server, data.targetUid);
}