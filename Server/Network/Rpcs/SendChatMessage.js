const PacketIds = require("../PacketIds.json");
const EntityInfo = require("../../Info/EntityInfo.js");
const RAPIER = require("@dimforge/rapier2d-compat");

module.exports = SendChatMessage = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];

    if (playerEntity.timers["SendChatMessage"].active == true) return;

    const playerParty = server.parties[playerEntity.partyId];

    data.message = data.message.substring(0, 140);

    const message = data.message;

    switch (data.channel) {
        case "All":
            {
                server.world.intersectionsWithShape(playerEntity.getPosition(server), 0, playerEntity.sightRange, collider => {
                    const entity = server.entities[collider._parent?.userData?.uid];
                    if (entity !== undefined && entity.entityClass === "Player") {
                        server.connectedSockets[entity.uid].sendMessage(PacketIds["PACKET_RPC"], {
                            name: "ReceiveChatMessage",
                            response: {
                                channel: data.channel,
                                name: playerEntity.name,
                                message
                            }
                        })
                    }
                });
            }
            break;
        case "Party":
            {
                for (const member of Object.values(playerParty.members)) {
                    server.connectedSockets[member.uid].sendMessage(PacketIds["PACKET_RPC"], {
                        name: "ReceiveChatMessage",
                        response: {
                            channel: data.channel,
                            name: playerEntity.name,
                            message
                        }
                    });
                }
            }
            break;
    }

    playerEntity.timers["SendChatMessage"].active = true;
    playerEntity.timers["SendChatMessage"].lastTimerActive = server.tick;

    server.debugLog(`[INFO] ${playerEntity.name} (${playerEntity.uid} - ${socket.ipAddress}) sent a message: ${message}`);
}