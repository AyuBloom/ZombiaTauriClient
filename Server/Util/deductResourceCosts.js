module.exports = deductResourceCosts = (server, playerEntity, costs) => {
    if (playerEntity.developerMode == true) return;

    const goldCosts = costs.goldCosts || 0;
    const stoneCosts = costs.stoneCosts || 0;
    const woodCosts = costs.woodCosts || 0;
    const tokensCosts = costs.tokensCosts || 0;

    if (server.gameMode == "scarcity") {
        const playerParty = server.parties[playerEntity.partyId];
        playerParty.resources.gold -= goldCosts;
        playerParty.resources.stone -= stoneCosts;
        playerParty.resources.wood -= woodCosts;

        for (let uid in playerParty.members) {
            server.entities[uid].gold = playerParty.resources.gold;
            server.entities[uid].stone = playerParty.resources.stone;
            server.entities[uid].wood = playerParty.resources.wood;
        }
    } else {
        playerEntity.gold -= goldCosts;
        playerEntity.stone -= stoneCosts;
        playerEntity.wood -= woodCosts;
    }
}