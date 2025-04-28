module.exports = canAfford = (server, playerEntity, costs) => {
    if (playerEntity.developerMode == true) return true;

    let { gold, wood, stone } = playerEntity;

    if (server.gameMode == "scarcity") {
        const playerParty = server.parties[playerEntity.partyId];

        gold = playerParty.resources.gold;
        stone = playerParty.resources.stone;
        wood = playerParty.resources.wood;
    }

    const goldCosts = costs.goldCosts;
    const stoneCosts = costs.stoneCosts;
    const woodCosts = costs.woodCosts;

    return !(gold < goldCosts || wood < woodCosts || stone < stoneCosts);
}