const Building = require("./Building.js");

class Wall extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "Wall"
        }, props));
    }
}

module.exports = Wall;