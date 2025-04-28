const PacketIds = require("../PacketIds.json");

module.exports = CancelPartyRequest = (socket, server, data) => {
    // If the player has not requested to join a party
    const playerEntity = server.entities[socket.uid];

    if (playerEntity.partyRequestId === 0) return;

    // Players can only cancel requests 2 seconds after requesting
    if (server.tick - playerEntity.partyRequestSentTick < 2000 / server.serverProperties.tickRate) return;

    // Grab the leader of the party the request was cancelled to and send them an RPC to remove the popup
    // Ensure the party still exists
    if (server.parties[playerEntity.partyRequestId] !== undefined) {
        const partyLeader = server.entities[server.parties[playerEntity.partyRequestId].leaderUid];
        if (partyLeader !== undefined) {
            server.connectedSockets[partyLeader.uid].sendMessage(PacketIds["PACKET_RPC"], {
                "name": "PartyRequestCancelled",
                response: {
                    uid: socket.uid
                }
            })
        }
    }

    playerEntity.partyRequestSentTick = 0;
    playerEntity.partyRequestId = 0;

    socket.sendMessage(PacketIds["PACKET_RPC"], {
        name: "PartyRequestMet"
    })
}