module.exports = randomMapPosition = mapSize => {
    return {
        x: Math.floor(Math.random() * mapSize.width),
        y: Math.floor(Math.random() * mapSize.height)
    }
}