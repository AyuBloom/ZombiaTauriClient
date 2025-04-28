const Node = require("./Node.js");

class Grid {
    constructor(server, width, height, offset) {
        this.width = width;
        this.height = height;
        this.mapSize = {
            width: server.serverProperties.mapSize.width / server.world.PixelToWorld,
            height: server.serverProperties.mapSize.height / server.world.PixelToWorld
        }

        this.nodes = {};

        this.leftLimit = offset.x - this.width / 2;
        this.rightLimit = offset.x + this.width / 2 - 1;
        this.topLimit = offset.y - this.height / 2;
        this.bottomLimit = offset.y + this.height / 2 - 1;

        for (let x = offset.x - this.width / 2; x < offset.x + this.width / 2; x++) {
            if (x < 0 || x >= this.mapSize.width) continue;
            this.nodes[x] = {};
            for (let y = offset.y - this.height / 2; y < offset.y + this.height / 2; y++) {
                if (y < 0 || y >= this.mapSize.height) continue;
                this.nodes[x][y] = new Node(x, y);
            }
        }
    }

    containsNode(x, y) {
        return (this.nodes[x] !== undefined && this.nodes[x][y] !== undefined);
    }

    setWalkableAt(x, y, walkable) {
        const node = this.getNodeAt(x, y);
        node.walkable = !!walkable;
    }

    getNodeAt(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);

        // Ensure the x, y is in the map
        if (x < 0) x = 0;
        else if (x >= this.mapSize.width) x = this.mapSize.width - 1;

        if (y < 0) y = 0;
        else if (y >= this.mapSize.height) y = this.mapSize.height - 1;

        // Ensure the x, y is in the grid
        if (x < this.leftLimit) x = this.leftLimit;
        else if (x >= this.rightLimit) x = this.rightLimit;

        if (y < this.topLimit) y = this.topLimit;
        else if (y >= this.bottomLimit) y = this.bottomLimit;

        return this.nodes[x][y];
    }

    getNeighbours(node, checkDiagonals = false) {
        let neighbours = new Set();

        const left = this.getNodeAt(node.x - 1, node.y);
        if (left !== undefined && left.walkable == true) neighbours.add(left);
        const top = this.getNodeAt(node.x, node.y - 1);
        if (top !== undefined && top.walkable == true) neighbours.add(top);
        const right = this.getNodeAt(node.x + 1, node.y);
        if (right !== undefined && right.walkable == true) neighbours.add(right);
        const bottom = this.getNodeAt(node.x, node.y + 1);
        if (bottom !== undefined && bottom.walkable == true) neighbours.add(bottom);

        if (checkDiagonals == true) {
            const topLeft = this.getNodeAt(node.x - 1, node.y - 1);
            if (topLeft !== undefined && topLeft.walkable == true) neighbours.add(topLeft);
            const topRight = this.getNodeAt(node.x + 1, node.y - 1);
            if (topRight !== undefined && topRight.walkable == true) neighbours.add(topRight);
            const bottomLeft = this.getNodeAt(node.x - 1, node.y + 1);
            if (bottomLeft !== undefined && bottomLeft.walkable == true) neighbours.add(bottomLeft);
            const bottomRight = this.getNodeAt(node.x + 1, node.y + 1);
            if (bottomRight !== undefined && bottomRight.walkable == true) neighbours.add(bottomRight);
        }

        return Array.from(neighbours);
    }
}

module.exports = Grid;