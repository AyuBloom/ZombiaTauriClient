const ToolInfo = require("../../Info/ToolInfo.js");
const PacketIds = require("../PacketIds.json");
const Util = require("../../Util.js");

const handleHealthPotion = (server, socket, playerEntity, toolInfo) => {
    // Players are restricted to heal once per few seconds
    if (playerEntity.timers["HealthPotion"].active == true) return;

    // Can't buy the health potion unless the player has been damaged
    if (playerEntity.health == playerEntity.maxHealth) return;

    playerEntity.health = playerEntity.maxHealth;

    // TODO: maybe put this somewhere other than the Failure rpc
    socket.sendMessage(PacketIds["PACKET_RPC"], {
        name: "Failure",
        response: {
            failure: "You've purchased and used the Health Potion."
        }
    });

    Util.deductResourceCosts(server, playerEntity, toolInfo);

    // Set timers
    playerEntity.timers["HealthPotion"].active = true;
    playerEntity.timers["HealthPotion"].lastTimerActive = server.tick;
}

module.exports = BuyTool = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerTool = playerEntity.tools.find(e => e.toolName == data.toolName);

    // If the player doesn't own the tool already
    if (playerTool == undefined) {
        const toolInfo = ToolInfo.getTool(data.toolName, 1);

        // Instantly fail if the tool doesn't exist
        if (toolInfo === undefined) return;

        if (!Util.canAfford(server, playerEntity, toolInfo)) {
            socket.sendMessage(PacketIds["PACKET_RPC"], {
                name: "Failure",
                response: {
                    failure: "You do not have enough resources to purchase this item."
                }
            })
            return;
        }

        if (toolInfo.name == "HealthPotion") return handleHealthPotion(server, socket, playerEntity, toolInfo);

        // Upgrading the armour must change the shield health data
        if (toolInfo.class == "Armour") {
            switch (toolInfo.name) {
                case "ZombieShield":
                    playerEntity.zombieShieldMaxHealth = playerEntity.zombieShieldHealth = toolInfo.health;
                    break;
            }
        }

        Util.deductResourceCosts(server, playerEntity, toolInfo);

        playerEntity.tools.push({
            toolName: data.toolName,
            toolTier: 1
        })
        
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "SetTool",
            response: [
                {
                    "toolName": data.toolName,
                    "toolTier": 1,
                }
            ]
        })
    }

    // If the player already owns the tool
    else {
        // No need to check if the tool exists because this block of code can't be reached unless the player already has the tool and has been certified
        const toolInfo = ToolInfo.getTool(data.toolName, playerTool.toolTier + 1);

        if (playerTool.toolTier >= toolInfo.tiers) {
            socket.sendMessage(PacketIds["PACKET_RPC"], {
                name: "Failure",
                response: {
                    failure: "You have met the maximum tier for this item!"
                }
            })
            return;
        }

        if (!Util.canAfford(server, playerEntity, toolInfo)) {
            socket.sendMessage(PacketIds["PACKET_RPC"], {
                name: "Failure",
                response: {
                    failure: "You do not have enough resources to purchase this item."
                }
            })
            return;
        }

        // Update data in the player's toolset
        playerTool.toolTier++;

        if (playerEntity.weaponName === data.toolName) playerEntity.weaponTier = playerTool.toolTier;

        // Upgrading the armour must change the shield health data
        if (toolInfo.class == "Armour") {
            switch (toolInfo.name) {
                case "ZombieShield":
                    playerEntity.zombieShieldHealth = (playerEntity.zombieShieldHealth / playerEntity.zombieShieldMaxHealth) * toolInfo.health;
                    playerEntity.zombieShieldMaxHealth = toolInfo.health;
                    break;
            }
        }

        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "SetTool",
            response: [playerTool]
        });

        Util.deductResourceCosts(server, playerEntity, toolInfo);
    }
}