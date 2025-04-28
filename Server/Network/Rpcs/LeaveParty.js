module.exports = LeaveParty = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    // Players cannot leave parties if they're the only one in it
    if (playerParty.memberCount <= 1) return;

    playerParty.removeMember(server, playerEntity);
    server.createParty(playerEntity);
}