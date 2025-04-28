const Building = require("./Building.js");

class Door extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "Door"
        }, props));
    }
}

module.exports = Door;