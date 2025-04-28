module.exports = randomCirclePosition = (position, radius) => {
    const angle = Math.random() * Math.PI * 2;
    let x = Math.cos(angle) * Math.random() * radius;
    let y = Math.sin(angle) * Math.random() * radius;

    return { x: position.x * 48 + x, y: position.y * 48 + y };
}