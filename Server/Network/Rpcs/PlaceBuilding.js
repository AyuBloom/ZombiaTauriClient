const BuildingInfo = require("../../Info/BuildingInfo.js");
const Util = require("../../Util.js");
const PacketIds = require("../PacketIds.json");
const RAPIER = require("@dimforge/rapier2d-compat");

module.exports = PlaceBuilding = (socket, server, data) => {
    const playerEntity = server.entities[socket.uid];
    const playerParty = server.parties[playerEntity.partyId];

    const buildingInfo = BuildingInfo.getBuilding(server, data.type);
    // Verify that the building exists
    if (buildingInfo === undefined) return;

    // Verify that the building is allowed in the game mode
    if (!buildingInfo.gameModes.includes(server.gameMode)) return;

    let gridWidth = buildingInfo.gridWidth;
    let gridHeight = buildingInfo.gridHeight;

    if (data.yaw == 90 || data.yaw == 270) {
        gridWidth = buildingInfo.gridHeight;
        gridHeight = buildingInfo.gridWidth;
    }

    if (gridWidth == 1 && gridHeight == 1) {
        if (data.x % 24 !== 0 || data.y % 24 !== 0) return;
        if (data.x % 48 !== 24 || data.y % 48 !== 24) return;
    } else
    if (gridWidth == 2 && gridHeight == 2) {
        if (data.x % 48 !== 0 || data.y % 48 !== 0) return;
    } else
    if (gridWidth == 2 && gridHeight == 3) {
        if (data.x % 24 !== 0) return;
        if (data.x % 48 !== 0) return;
        if (data.y % 24 !== 0) return;
        if (data.y % 48 !== 24) return;
        // x % 24 = 0
        // x % 48 = 0
        // y % 24 = 0
        // y % 48 = 24
    } else
    if (gridWidth == 3 && gridHeight == 2) {
        if (data.x % 24 !== 0) return;
        if (data.x % 48 !== 24) return;
        if (data.y % 24 !== 0) return;
        if (data.y % 48 !== 0) return;
        // x % 24 = 0
        // x % 48 = 24
        // y % 24 = 0
        // y % 48 = 0
    }

    // const gridWidth = server.world.PixelToWorld * buildingInfo.gridWidth;
    // const gridHeight = server.world.PixelToWorld * buildingInfo.gridHeight;

    // // Verify that the position is valid within the world
    // if ((data.x - (gridWidth / 2)) % 48 !== 0 || (data.y - (gridHeight / 2)) % 48 !== 0) return;

    if (data.x < 0 || data.x > server.serverProperties.mapSize.width ||
        data.y < 0 || data.y > server.serverProperties.mapSize.height) return;

    data.x /= server.world.PixelToWorld;
    data.y /= server.world.PixelToWorld;

    // Verify that the player's mouse is in the correct place
    // TODO: this kinda sucks
    // const playerMousePos = {
    //     x: playerEntity.inputs.mousePosition.x / server.world.PixelToWorld,
    //     y: playerEntity.inputs.mousePosition.y / server.world.PixelToWorld
    // }

    // const distToMouse = Util.measureDistance(playerMousePos, data);
    // if (distToMouse > 1) return;

    // Verify that the player has permissions to place
    if (playerEntity.canPlace === false && playerEntity.developerMode == false) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You do not have the required permissions to place this building."
            }
        })
        return;
    }

    // Verify that the player's party hasn't already reached its limit on the building type
    if (playerParty.allBuildings.types[data.type].owned.length >= playerParty.allBuildings.types[data.type].limit && playerEntity.developerMode == false) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You cannot place any more of this building type."
            }
        })
        return;
    }

    // Primary building logic.
    // You can't place any other building without the primary building.
    if (playerParty.primaryBuilding == null) {
        if (data.type !== "Factory") {
            socket.sendMessage(PacketIds["PACKET_RPC"], {
                name: "Failure",
                response: {
                    failure: "You must place a factory first."
                }
            })
            return;
        }
    }

    // Verify that the Factory is not warming up
    if (data.type !== "Factory") {
        if (server.entities[playerParty.primaryBuilding].warmingUp == true) return;
    }

    // Verify that the player can afford the building
    if (!Util.canAfford(server, playerEntity, buildingInfo)) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You do not have enough resources to place this building."
            }
        })
        return;
    }

    // Verify that the position is not too far from the player
    const distanceFromPlayer = server.serverProperties.maxPlayerBuildDistance;
    if (playerEntity.developerMode == false &&
        (Math.abs(playerEntity.getPosition(server).x - data.x) > distanceFromPlayer ||
        Math.abs(playerEntity.getPosition(server).y - data.y) > distanceFromPlayer)) {
            socket.sendMessage(PacketIds["PACKET_RPC"], {
                name: "Failure",
                response: {
                    failure: "You cannot place buildings too far away."
                }
            })
            return;
        }

    // Verify that the position is not too close to the map borders
    const distanceFromWall = server.serverProperties.minimumBuildDistanceFromWall;

    let width = buildingInfo.width;
    let height = buildingInfo.height;

    if (data.yaw == 90 || data.yaw == 270) {
        width = buildingInfo.height;
        height = buildingInfo.width;
    }

    if (data.x - width / server.world.PixelToWorld / 2 < distanceFromWall ||
        data.y - height / server.world.PixelToWorld / 2 < distanceFromWall ||
        data.x + width / server.world.PixelToWorld / 2 > server.serverProperties.mapSize.width / server.world.PixelToWorld - distanceFromWall ||
        data.y + height / server.world.PixelToWorld / 2 > server.serverProperties.mapSize.height / server.world.PixelToWorld - distanceFromWall) {
            socket.sendMessage(PacketIds["PACKET_RPC"], {
                name: "Failure",
                response: {
                    failure: "You cannot place buildings that close to the map borders."
                }
            })
            return;
        }

    // Verify that the position is not too far from the primary building
    if (!["Factory", "Harvester"].includes(data.type)) {
        const distanceFromPrimary = server.serverProperties.maxFactoryBuildDistance;
        const partyPrimary = server.entities[playerParty.primaryBuilding];

        if (Math.abs((data.x + width / server.world.PixelToWorld / 2) - partyPrimary.getPosition(server).x) > distanceFromPrimary ||
            Math.abs((data.x - width / server.world.PixelToWorld / 2) - partyPrimary.getPosition(server).x) > distanceFromPrimary ||
            Math.abs((data.y + height / server.world.PixelToWorld / 2) - partyPrimary.getPosition(server).y) > distanceFromPrimary |
            Math.abs((data.y - height / server.world.PixelToWorld / 2) - partyPrimary.getPosition(server).y) > distanceFromPrimary) {
            socket.sendMessage(PacketIds["PACKET_RPC"], {
                name: "Failure",
                response: {
                    failure: "You cannot place buildings that far from your factory."
                }
            })
            return;
        }
    }

    // Verify that the position is not too close to other primary buildings
    // Scan for bodies within the range to see closest bodies, then fail if one is a primary building
    let tooClose = false;
    if (data.type === "Factory") {
        const minFactoryToFactoryDistance = server.serverProperties.minFactoryToFactoryDistance;
        const shape = new RAPIER.Cuboid(minFactoryToFactoryDistance, minFactoryToFactoryDistance);
        const shapePos = new RAPIER.Vector2(data.x, data.y);
        server.world.intersectionsWithShape(shapePos, 0, shape, collider => {
            const entity = server.entities[collider._parent?.userData?.uid];
            if (entity !== undefined) {
                if (entity.model === "Factory") {
                    tooClose = true;
                    return false;
                }
            }
        }, undefined, 0xffffffff)
    }

    if (tooClose === true) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "You cannot place your factory this close to another factory."
            }
        })
        return;
    }

    // Scan tentative buildings to see if there are any obstructions with buildings placed in the same tick
    let tentativeObstructed = false;

    for (const i in server.tentativeBuildingPositions) {
        const building = server.tentativeBuildingPositions[i];

        let gridWidth = buildingInfo.gridWidth;
        let gridHeight = buildingInfo.gridHeight;
    
        if (data.yaw == 90 || data.yaw == 270) {
            gridWidth = buildingInfo.gridHeight;
            gridHeight = buildingInfo.gridWidth;
        }


        if (Math.abs(building.x - data.x) < gridWidth + width) {
            tentativeObstructed = true;
            break;
        }

        if (Math.abs(building.y - data.y) < gridHeight + height) {
            tentativeObstructed = true;
            break;
        }
    }

    if (tentativeObstructed == true) return;

    // Scan for bodies within the range to see if the placement is blocked
    let collides = false;
    {
        const shape = new RAPIER.Cuboid(width / server.world.PixelToWorld / 2, height / server.world.PixelToWorld / 2);
        const shapePos = new RAPIER.Vector2(data.x, data.y);
        server.world.intersectionsWithShape(shapePos, 0, shape, collider => {
            const entity = server.entities[collider._parent?.userData?.uid];
            if (entity.dead == true) return true;
            collides = true;
            return false;
        }, undefined, 0x00080007);
    }

    if (collides === true) {
        socket.sendMessage(PacketIds["PACKET_RPC"], {
            name: "Failure",
            response: {
                failure: "This place is occupied."
            }
        })
        return;
    }

    let yaw = 0;

    if (["SawTower", "Harvester"].includes(data.type)) {
        if ([0, 90, 180, 270].includes(data.yaw)) yaw = data.yaw;
    }

    const building = server.createEntity(data.type, {
        partyId: playerEntity.partyId,
        position: {
            x: data.x * server.world.PixelToWorld,
            y: data.y * server.world.PixelToWorld
        },
        yaw: yaw
    })

    if (building === undefined) return;

    Util.deductResourceCosts(server, playerEntity, buildingInfo);

    server.tentativeBuildingPositions[building.uid] = {
        x: data.x,
        y: data.y,
        height: building.height,
        width: building.width
    }

    playerParty.updateBuilding(server, [building]);

    server.debugLog(`[INFO] ${playerEntity.name} (${playerEntity.uid} - ${socket.ipAddress}) placed a ${building.model} at (${building.getPosition(server).x}, ${building.getPosition(server).y})`);
}