const EntityInfo = require("../../Info/EntityInfo.js");

module.exports = AdminCommand = (socket, server, data) => {
  if (server.entities[socket.uid].developerMode === false) return;

  const playerEntity = server.entities[socket.uid];

  switch (data.type) {
    case "BanPlayer":
      {
        const playerSocket = server.connectedSockets[data.uid];

        if (playerSocket == undefined) return;

        server.websiteWsServer?._send?.({
          type: "BanIpAddress",
          ipAddress: playerSocket.ipAddress,
          reason: data.reason,
          lastUsedName: playerEntity.name,
        });
      }
      break;
    case "KickPlayer":
      {
        const playerSocket = server.connectedSockets[data.uid];

        if (playerSocket == undefined || playerSocket?.readyState !== 1) return;

        playerSocket.close();
      }
      break;
    case "SkipToWave":
      {
        const playerPrimaryBuilding =
          server.entities[server.parties[playerEntity.partyId].primaryBuilding];
        if (playerPrimaryBuilding) playerPrimaryBuilding.wave = data.uid;
      }
      break;
    case "TeleportEntity":
      {
        const entity = server.entities[data.uid];

        if (entity == undefined) return;

        if (entity.entityClass == "Building" || entity.entityClass == "Resource") return;

        const position = { x: data.x, y: data.y };

        position.x = Math.max(
          0,
          Math.min(server.serverProperties.mapSize.width, position.x),
        );
        position.y = Math.max(
          0,
          Math.min(server.serverProperties.mapSize.height, position.y),
        );

        position.x /= server.world.PixelToWorld;
        position.y /= server.world.PixelToWorld;

        server.waitTicks(0, () => {
          entity.physicsObject.setTranslation(position, true);
        });
      }
      break;
    case "ZoomLevel":
      {
        const zoomLevel = data.uid / 100;
        playerEntity.zoomLevel = zoomLevel;
      }
      break;
    case "Eval":
      {
        // VERY RISKY!
        try {
          eval(data.reason);
        } catch (err) {
          server.debugLog(
            `[INFO] ${playerEntity.uid} had a problem with the eval admin command:\n${JSON.stringify(err)}`,
          );
        }
      }
      break;
    case "Ghost":
      {
        playerEntity.ghostMode = !playerEntity.ghostMode;

        server.waitTicks(1, () => {
          if (playerEntity.ghostMode == true) {
            playerEntity.physicsObject.collider(0).setCollisionGroups(0);
          } else {
            playerEntity.physicsObject.collider(0).setCollisionGroups(0x0002000f);
          }
        });
      }
      break;
    case "Spectator":
      {
        playerEntity.ghostMode = !playerEntity.ghostMode;

        server.waitTicks(1, () => {
          if (playerEntity.ghostMode == true) {
            playerEntity.physicsObject.collider(0).setCollisionGroups(0);
            playerEntity.scale = 0;
            playerEntity.movementSpeed = 1500;
          } else {
            playerEntity.physicsObject.collider(0).setCollisionGroups(0x0002000f);
            playerEntity.scale = 1;

            const playerData = EntityInfo.getEntity("Player");
            playerEntity.movementSpeed = playerData.speed;
          }
        });
      }
      break;
  }
};

module.exports = AdminCommand;
