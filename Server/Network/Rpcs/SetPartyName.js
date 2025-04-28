module.exports = SetPartyName = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    data.partyName = data.partyName.substring(0, 16).replace(/<(?:.|\n)*?>/gm, "").trim();

    if (data.partyName.length <= 0) data.partyName = `Party-${playerParty.id}`;

    if (playerParty.leaderUid !== playerEntity.uid) return;

    if (playerParty.name == data.partyName) return;

    playerParty.name = data.partyName;

    server.debugLog(`[INFO] ${playerEntity.name} (${playerEntity.uid} - ${socket.ipAddress}) set their party name to: ${data.partyName}`);
}