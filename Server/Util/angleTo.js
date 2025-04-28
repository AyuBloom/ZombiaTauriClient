module.exports = angleTo = (obj1, obj2) => {
    return (Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x) * 180 / Math.PI + 90 + 360) % 360;
}