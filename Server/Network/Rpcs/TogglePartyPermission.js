module.exports = TogglePartyPermission = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];

    if (playerEntity.timers["TogglePartyPermission"].active == true) return;

    const playerParty = server.parties[playerEntity.partyId];
    const memberEntity = server.entities[data.uid];

    if (memberEntity === undefined) return;

    // Can't remove permissions from developers
    if (memberEntity.developerMode == true) return;

    // Ensure that the player cannot change their own permissions
    if (playerEntity.uid === data.uid) return;

    // Ensure that the player toggling permissions is the leader
    if (playerParty.leaderUid !== playerEntity.uid) return;

    // Ensure the member is in the same party as the leader toggling permissions
    if (playerEntity.partyId !== memberEntity.partyId) return;

    memberEntity[`can${data.permission}`] = !memberEntity[`can${data.permission}`];
    playerParty.sendMemberList(server);

    playerEntity.timers["TogglePartyPermission"].active = true;
    playerEntity.timers["TogglePartyPermission"].lastTimerActive = server.tick;
}