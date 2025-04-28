const PacketIds = require("../PacketIds.json");
module.exports = PartyRequestResponse = (socket, server, data) => {
    if (server.entities[data.uid] === undefined) return;
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];
    const applicantEntity = server.entities[data.uid];

    // Ensure the player is the leader of their party
    if (playerEntity.uid !== playerParty.leaderUid) return;

    // Ensure the applicant requested to that party
    if (applicantEntity.partyRequestId !== playerEntity.partyId) return;

    applicantEntity.partyRequestSentTick = 0;
    applicantEntity.partyRequestId = 0;

    if (data.accepted === true) {
        const applicantParty = server.parties[applicantEntity.partyId];
        if (playerParty.memberCount < playerParty.memberLimit) {
            applicantParty.removeMember(server, applicantEntity);
            playerParty.addMember(server, applicantEntity);
        }
    }

    server.connectedSockets[applicantEntity.uid].sendMessage(PacketIds["PACKET_RPC"], {
        name: "PartyRequestMet"
    })
}