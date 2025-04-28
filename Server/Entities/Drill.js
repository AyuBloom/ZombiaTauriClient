const Building = require("./Building.js");
const BuildingInfo = require("../Info/BuildingInfo.js");
const Util = require("../Util.js");

class Drill extends Building {
    constructor(server, props = {}) {
        super(server, Object.assign({
            model: "Drill"
        }, props));
    }

    update(server) {
        super.update(server);

        if (server.gameMode == "scarcity") return;

        const thisParty = server.parties[this.partyId];
        const buildingInfo = BuildingInfo.getBuilding(server, this.model, this.tier);

        if (thisParty !== undefined) {
            for (let i in thisParty.members) {
                thisParty.members[i].gold += buildingInfo.goldPerSecond / (1000 / server.serverProperties.tickRate);
            }
        }

    }
}

module.exports = Drill;