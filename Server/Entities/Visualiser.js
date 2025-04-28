const Entity = require("./Entity.js");
const RAPIER = require("@dimforge/rapier2d-compat");

class Visualiser extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "Visualiser",
            model: "Visualiser",
            uid: 0,
            yaw: 0
        }, props));
    }

    addToWorld(server) {
        super.addToWorld(server);

        const body = RAPIER.RigidBodyDesc.fixed()
            .setUserData({ uid: this.uid });

        this.physicsObject = server.world.createRigidBody(body);

        this.physicsObject.setTranslation({ x: this.position.x / server.world.PixelToWorld, y: this.position.y / server.world.PixelToWorld }, true);
        const collider = RAPIER.ColliderDesc.ball(0 / server.world.PixelToWorld)
            .setCollisionGroups(0xFFFF0000);

        server.world.createCollider(collider, this.physicsObject);

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();
    }
}

module.exports = Visualiser;