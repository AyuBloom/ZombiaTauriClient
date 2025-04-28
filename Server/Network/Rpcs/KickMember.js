module.exports = KickMember = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];
    const kickedMemberEntity = server.entities[data.uid];

    if (kickedMemberEntity === undefined) return;

    // Developers can't be kicked
    if (kickedMemberEntity.developerMode == true) return;

    // Ensure the kicker is the leader of the party
    if (playerParty.leaderUid !== playerEntity.uid) return;

    // Ensure the kick-receiver is a member of the party
    if (kickedMemberEntity.partyId !== playerParty.id) return;

    // Ensure the player is not kicking themselves
    if (data.uid == playerEntity.uid) return;

    playerParty.removeMember(server, kickedMemberEntity);
    server.createParty(kickedMemberEntity);
}