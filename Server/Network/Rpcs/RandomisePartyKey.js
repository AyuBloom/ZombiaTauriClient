module.exports = RandomisePartyKey = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    if (playerEntity.timers["RandomisePartyKey"].active == true) return;

    // Only leaders can randomise the party key
    if (playerEntity.uid !== playerParty.leaderUid) return;

    playerParty.updatePartyKey(server);

    server.debugLog(`[INFO] ${playerEntity.name} (${playerEntity.uid} - ${socket.ipAddress}) randomised their party key`);

    playerEntity.timers["RandomisePartyKey"].active = true;
    playerEntity.timers["RandomisePartyKey"].lastTimerActive = server.tick;
}