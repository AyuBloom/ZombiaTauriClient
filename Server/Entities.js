/*
const fs = require("fs");

const entities = {};
const files = fs.readdirSync("./Entities");

// Read all files from the ./Util directory and add their exports to an object that can be accessed globally
for (let fileName of files) {
    if (fileName === "Entity.js") continue;
    const data = require(`./Entities/${fileName}`);
    entities[fileName.substring(0, fileName.length - 3)] = data;
}

module.exports = entities;
*/

const ArrowProjectile = require("./Entities/ArrowProjectile");
const ArrowTower = require("./Entities/ArrowTower");
const Building = require("./Entities/Building");
const CannonProjectile = require("./Entities/CannonProjectile");
const CannonTower = require("./Entities/CannonTower");
const Door = require("./Entities/Door");
const Drill = require("./Entities/Drill");
const DynamiteProjectile = require("./Entities/DynamiteProjectile");
const Factory = require("./Entities/Factory");
const Harvester = require("./Entities/Harvester");
const HarvesterDrone = require("./Entities/HarvesterDrone");
const LargeWall = require("./Entities/LargeWall");
const LightningTower = require("./Entities/LightningTower");
const MageProjectile = require("./Entities/MageProjectile");
const MageTower = require("./Entities/MageTower");
const Player = require("./Entities/Player");
const Projectile = require("./Entities/Projectile");
const Resource = require("./Entities/Resource");
const ResourcePickup = require("./Entities/ResourcePickup");
const RocketProjectile = require("./Entities/RocketProjectile");
const RocketTower = require("./Entities/RocketTower");
const SawTower = require("./Entities/SawTower");
const SpellIndicator = require("./Entities/SpellIndicator");
const SpikeTrap = require("./Entities/SpikeTrap");
const Visualiser = require("./Entities/Visualiser");
const Wall = require("./Entities/Wall");
const Zombie = require("./Entities/Zombie");

module.exports = {
  ArrowProjectile,
  ArrowTower,
  Building,
  CannonProjectile,
  CannonTower,
  Door,
  Drill,
  DynamiteProjectile,
  Factory,
  Harvester,
  HarvesterDrone,
  LargeWall,
  LightningTower,
  MageProjectile,
  MageTower,
  Player,
  Projectile,
  Resource,
  ResourcePickup,
  RocketProjectile,
  RocketTower,
  SawTower,
  SpellIndicator,
  SpikeTrap,
  Visualiser,
  Wall,
  Zombie,
};
