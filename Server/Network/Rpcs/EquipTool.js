const ToolInfo = require("../../Info/ToolInfo.js");
const PacketIds = require("../PacketIds.json");

module.exports = EquipTool = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];

    const playerTool = playerEntity.tools.find(tool => tool.toolName == data.toolName);

    if (playerTool === undefined) return;

    const toolInfo = ToolInfo.getTool(data.toolName, playerTool.toolTier);

    if (toolInfo.canEquip !== true) return;

    playerEntity.weaponName = playerTool.toolName;
    playerEntity.weaponTier = playerTool.toolTier;
}