const Entity = require("./Entity.js");
const RAPIER = require("@dimforge/rapier2d-compat");

class SpellIndicator extends Entity {
    constructor(server, props = {}) {
        super(server, Object.assign({
            entityClass: "Spell",
            model: "SpellIndicator",
            radius: 0,
            spellType: "Rapidfire",
            partyId: 0,
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
        const collider = RAPIER.ColliderDesc.ball(0)
            .setCollisionGroups(0xFFFF0000);

        server.world.createCollider(collider, this.physicsObject);

        delete this.position;
        this.cachedPosition = this.physicsObject.translation();
    }

    update(server) {
        if (this.spellType == "Rapidfire") {
            const shape = new RAPIER.Ball(this.radius / server.world.PixelToWorld);

            server.world.intersectionsWithShape(this.getPosition(server), 0, shape, collider => {
                const entity = server.entities[collider._parent?.userData?.uid];
                if (entity !== undefined) {
                    if (entity.entityClass !== "Building") return;
                    if (entity.partyId !== this.partyId) return;

                    entity.speedBuffed = true;
                }
            });
        }
    }
}

module.exports = SpellIndicator