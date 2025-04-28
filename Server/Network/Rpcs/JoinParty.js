const PacketIds = require("../PacketIds.json");
module.exports = JoinParty = (socket, server, data) => {
    // When a player requests to join a party, the server will send the application to the leader of the requested party.
    // The leader will then give a response of yes/no which is sent to the applicant

    const playerEntity = server.entities[socket.uid];

    if (playerEntity.timers["JoinParty"].active == true) return;

    const partyRequested = server.parties[data.partyId];

    if (partyRequested == undefined) return;

    // If the player is a dev, the player can instantly join the party
    if (playerEntity.developerMode == true) {
        server.parties[playerEntity.partyId].removeMember(server, playerEntity);
        partyRequested.addMember(server, playerEntity);

        playerEntity.canSell = true;
        playerEntity.canPlace = true;
        partyRequested.sendMemberList(server);

        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "PartyRequestMet"
        })
        return;
    }

    if (Math.max(server.tick, 30000 / server.serverProperties.tickRate) - playerEntity.partyRequestSentTick < 30000 / server.serverProperties.tickRate) return;

    if (playerEntity.partyId === data.partyId) return;

    if (partyRequested === undefined || partyRequested.isOpen == false || partyRequested.memberCount >= partyRequested.memberLimit) return;

    const partyRequestedLeaderSocket = server.connectedSockets[partyRequested.leaderUid];

    partyRequestedLeaderSocket.sendMessage(PacketIds["PACKET_RPC"], {
        name: "PartyRequest",
        response: {
            name: playerEntity.name,
            uid: playerEntity.uid
        }
    })

    playerEntity.partyRequestSentTick = server.tick;
    playerEntity.partyRequestId = data.partyId;
    let partyRequestSentTick = server.tick;
    server.waitTicks(30000 / server.serverProperties.tickRate, () => {
        if (playerEntity !== undefined && server.connectedSockets[playerEntity.uid] !== undefined) {
            if (playerEntity.partyRequestSentTick === partyRequestSentTick) {
                playerEntity.partyRequestSentTick = 0;
                playerEntity.partyRequestId = 0;
                server.connectedSockets[playerEntity.uid].sendMessage(PacketIds["PACKET_RPC"], {
                    name: "PartyRequestMet"
                })
            }
        }
    })

    playerEntity.timers["JoinParty"].active = true;
    playerEntity.timers["JoinParty"].lastTimerActive = server.tick;
}