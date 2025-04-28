module.exports = TogglePartyVisibility = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    if (playerParty.leaderUid === playerEntity.uid) {
        playerParty.isOpen = !playerParty.isOpen;
    }
}