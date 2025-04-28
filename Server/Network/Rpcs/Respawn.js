const PacketIds = require("../PacketIds.json");

module.exports = Respawn = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];

    if (playerEntity.dead !== true) return;

    playerEntity.respawning = true;
}