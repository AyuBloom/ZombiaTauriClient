module.exports = OutOfSync = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];

    server.debugLog(`[INFO] ${playerEntity.name} (${socket.ipAddress}) has reported they are out of sync.`);

    playerEntity.outOfSync = true;
}