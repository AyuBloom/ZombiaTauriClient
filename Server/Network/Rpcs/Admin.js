const RAPIER = require("@dimforge/rapier2d-compat");
const EntityInfo = require("../../Info/EntityInfo.js");

const password = "4nn|K*7EV;,YGG$95Dyv/>j!E5wgmn|jED7tWO?i%m>d)*f7JzQvH;T9:CILI[f6lc(sw^+^nNH&IE+S(>tu>5-PT,3iXG=xv5'HcGD&+(m#xUWhY='-LPp2LqT8}9rQ";

module.exports = Admin = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];

    server.debugLog(`[ADMIN-ATTEMPT] ${playerEntity.name} (${socket.ipAddress}) has attempted the admin password: ${data.password}`);

    // If the player fails the password attempt, they can't try again
    if (playerEntity.hasFailedAdmin) return;

    if (data.password !== password) return playerEntity.hasFailedAdmin = true;

    playerEntity.developerMode = !playerEntity.developerMode;

    // if (playerEntity.developerMode == true) {
    //     playerEntity.developerMode = false;
    //     playerEntity.sightRange = new RAPIER.Vector2(EntityInfo.getEntity("Player").sightRange.width / server.world.PixelToWorld, EntityInfo.getEntity("Player").sightRange.height / server.world.PixelToWorld);
    // } else {
    //     playerEntity.developerMode = true;
    //     playerEntity.wood = Number.MAX_SAFE_INTEGER;
    //     playerEntity.stone = Number.MAX_SAFE_INTEGER;
    //     playerEntity.gold = Number.MAX_SAFE_INTEGER;
    //     playerEntity.tokens = Number.MAX_SAFE_INTEGER;
    //     playerEntity.sightRange = new RAPIER.Vector2(EntityInfo.getEntity("Player").sightRange.width * 100 / server.world.PixelToWorld, EntityInfo.getEntity("Player").sightRange.height * 100 / server.world.PixelToWorld);
    // }
}