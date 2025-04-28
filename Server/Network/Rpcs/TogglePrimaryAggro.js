module.exports = TogglePrimaryAggro = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    // Scarcity mode disabled PvP, so aggro mode is disabled
    if (server.gameMode == "scarcity") return;

    // Only the leader can toggle the aggro
    if (playerParty.leaderUid !== playerEntity.uid) return;

    // A primary building must be placed
    if (playerParty.primaryBuilding == null) return;

    // Verify that the position of the building is not too far from the player
    const distanceFromPlayer = server.serverProperties.maxPlayerBuildDistance;
    if (Math.abs(playerEntity.getPosition(server).x - server.entities[playerParty.primaryBuilding].getPosition(server).x) > distanceFromPlayer ||
        Math.abs(playerEntity.getPosition(server).y - server.entities[playerParty.primaryBuilding].getPosition(server).y) > distanceFromPlayer) {
            return;
        }

    server.entities[playerParty.primaryBuilding].aggroEnabled = !server.entities[playerParty.primaryBuilding].aggroEnabled;
}