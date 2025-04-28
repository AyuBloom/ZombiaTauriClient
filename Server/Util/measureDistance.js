module.exports = measureDistance = (server, obj1, obj2) => {
    let xDif = obj2.x - obj1.x;
    let yDif = obj2.y - obj1.y;
    // This function will not use the sqrt function as it is expensive to performance
    // instead compare the square to this (a^2 + b^2 = c^2)
    return Math.abs((xDif**2) + (yDif**2));
}