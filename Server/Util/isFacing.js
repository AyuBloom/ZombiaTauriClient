const angleTo = require("./angleTo.js");

module.exports = isFacing = (obj1, obj2, maxYawDeviation = 1, server) => {
    const angleDifference = (obj1.aimingYaw - angleTo(obj1.getPosition(server), obj2.getPosition(server)) + 180 + 360) % 360 - 180;
    return (
        angleDifference > -maxYawDeviation &&
        angleDifference < maxYawDeviation
    )
}