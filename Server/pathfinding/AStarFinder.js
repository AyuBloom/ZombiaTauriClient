var Heap       = require('heap');
var Util       = require('./Util');
var Heuristic  = require('./Heuristic');
const myUtil = require("../Util.js");

/**
 * Find and return the the path.
 * @return {Array<Array<number>>} The path, including both start and
 *     end positions.
 */

let highestG = 0;
let modifiedNodes = [];
module.exports = function(party, startingPosition, targetPosition, isPrimaryBuilding = false) {
    const grid = party.pathfindingGrid;
    const openList = new Heap((a, b) => a.f - b.f);
    const startNode = grid.getNodeAt(startingPosition.x, startingPosition.y);
    const endNode = grid.getNodeAt(targetPosition.x, targetPosition.y);
    const heuristic = Heuristic.euclidean;

    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;
    modifiedNodes.push(startNode.x, startNode.y);

    // while the open list is not empty
    while (!openList.empty()) {
        // pop the position of node which has the minimum `f` value.
        const node = openList.pop();

        node.closed = true;
        modifiedNodes.push(node.x, node.y);

        // if reached the end position, construct the path and return it
        if (node === endNode) {
            const result = Util.backtrace(endNode);

            clearNodeProps(grid);

            return result;
        }

        // get neigbours of the current node
        let neighbours = grid.getNeighbours(node);
        for (let i = 0; i < neighbours.length; i++) {
            let neighbour = neighbours[i];

            const x = neighbour.x;
            const y = neighbour.y;

            if (neighbour.closed) continue;

            // get the distance between current node and the neighbour
            // and calculate the next g score
            let tentativeGScore = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : Math.SQRT2);


            if (isPrimaryBuilding == false) {
                // check if the neighbour is adjacent to an obstacle
                let isAdjacentToObstacle = false;
                let adjacentNodes = grid.getNeighbours(neighbour, true);
                // This function only returns neighbours that are not obstacles, and the maximum number of neighbours it can return is 8 with diagonals
                // so if the length of the array is less than 8, one of its neighbours is an obstacle
                if (adjacentNodes.length < 8) isAdjacentToObstacle = true;
    
                // Add a penalty if the neighbour is adjacent to an obstacle
                if (isAdjacentToObstacle) {
                    tentativeGScore++; // Adjust this value to control the penalty
                }

                if (tentativeGScore > 50) continue;
            }

            // check if the neighbour has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbour.opened || tentativeGScore < neighbour.g) {
                neighbour.g = tentativeGScore;
                neighbour.f = neighbour.g + heuristic(Math.abs(x - targetPosition.x), Math.abs(y - targetPosition.y));
                neighbour.parent = node;
                modifiedNodes.push(neighbour.x, neighbour.y);

                if (!neighbour.opened) {

                    openList.push(neighbour);
                    neighbour.opened = true;
                } else {
                    // the neighbour can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    openList.updateItem(neighbour);
                }
            }
        } // end for each neighbour
    } // end while not open list empty

    // fail to find the path
    clearNodeProps(grid);

    return [];
};

const clearNodeProps = grid => {
    for (let i = 0; i < modifiedNodes.length; i += 2) {
        const node = grid.getNodeAt(modifiedNodes[i], modifiedNodes[i + 1]);
        delete node.closed;
        delete node.opened;
        delete node.f;
        delete node.g;
        delete node.parent;
    }

    modifiedNodes.length = 0;
}