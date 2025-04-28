const Building = require("./Building.js");

class LargeWall extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "LargeWall"
        }, props));
    }
}

module.exports = LargeWall;