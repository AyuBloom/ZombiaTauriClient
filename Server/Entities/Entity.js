class Entity {
    constructor(server, props = {}) {
        Object.assign(this, {
            lastPosition: { x: 0, y: 0 },
            model: ""
        }, props);
    }

    addToWorld(server) {
        if (server.availableUids.length > 0) {
            this.uid = server.availableUids.shift();
        } else {
            this.uid = ++server.entitiesCount;
            if (this.uid > server.debuggingInfo.highestUid) server.debuggingInfo.highestUid = this.uid;
        }

        server.changedEntityProperties[this.uid] = {};
    }

    die(server) {
        if (this.socketDestroyed == undefined && this.dead == true) return;

        this.dead = true;
        if (this.health !== undefined) this.health = 0;

        server.waitTicks(1, server.removeEntity.bind(server, this.uid));
    }

    update(server) {}

    getPosition(server) {
        return this.cachedPosition;
    }
}

module.exports = Entity;