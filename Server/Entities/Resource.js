const Entity = require("./Entity.js");
const EntityInfo = require("../Info/EntityInfo");
const RAPIER = require("@dimforge/rapier2d-compat");

class Resource extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "Resource",
            health: 1,
            hits: [],
            model: "Tree1",
            radius: 50,
            resourceType: "Tree",
            uid: 0,
            yaw: 0
        }, props));

        this.resourceType = this.model.substring(0, this.model.search(/(\d+)/));
        this.radius = EntityInfo.getEntity(this.resourceType).radius;
    }

    addToWorld(server) {
        super.addToWorld(server);

        const body = RAPIER.RigidBodyDesc.fixed()
            .setUserData({ uid: this.uid });

        this.physicsObject = server.world.createRigidBody(body);

        this.physicsObject.setTranslation({ x: this.position.x / server.world.PixelToWorld, y: this.position.y / server.world.PixelToWorld }, true);
        const collider = RAPIER.ColliderDesc.ball(this.radius / server.world.PixelToWorld)
            .setCollisionGroups(0x001000A);

        server.world.createCollider(collider, this.physicsObject);

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();

        this.physicsObject.sleep();
    }
}

module.exports = Resource;