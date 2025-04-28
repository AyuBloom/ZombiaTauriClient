/*
const fs = require("fs");

const functions = {};
const files = fs.readdirSync("./Util");

// Read all files from the ./Util directory and add their exports to an object that can be accessed globally
for (let fileName of files) {
    const data = require(`./Util/${fileName}`);
    functions[fileName.substring(0, fileName.length - 3)] = data;
}

module.exports = functions;
*/

const angleTo = require("./Util/angleTo");
const canAfford = require("./Util/canAfford");
const deductResourceCosts = require("./Util/deductResourceCosts");
const isFacing = require("./Util/isFacing");
const measureDistance = require("./Util/measureDistance");
const randomCirclePosition = require("./Util/randomCirclePosition");
const randomMapPosition = require("./Util/randomMapPosition");

module.exports = {
  angleTo,
  canAfford,
  deductResourceCosts,
  isFacing,
  measureDistance,
  randomCirclePosition,
  randomMapPosition,
};
