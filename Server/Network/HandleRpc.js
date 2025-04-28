/*
const fs = require("fs");

const functions = {};
const files = fs.readdirSync("./Network/Rpcs");

// Read all files from the ./Rpcs directory and add their exports to an object that can be accessed globally
for (let fileName of files) {
    const data = require(`./Rpcs/${fileName}`);
    functions[fileName.substring(0, fileName.length - 3)] = data;
}

module.exports = functions;
*/

const Admin = require("./Rpcs/Admin");
const AdminCommand = require("./Rpcs/AdminCommand");
const BuyHarvesterDrone = require("./Rpcs/BuyHarvesterDrone");
const BuyTool = require("./Rpcs/BuyTool");
const CancelPartyRequest = require("./Rpcs/CancelPartyRequest");
const CastSpell = require("./Rpcs/CastSpell");
const EquipTool = require("./Rpcs/EquipTool");
const JoinParty = require("./Rpcs/JoinParty");
const KickMember = require("./Rpcs/KickMember");
const LeaveParty = require("./Rpcs/LeaveParty");
const OutOfSync = require("./Rpcs/OutOfSync");
const PartyRequestResponse = require("./Rpcs/PartyRequestResponse");
const PlaceBuilding = require("./Rpcs/PlaceBuilding");
const RandomisePartyKey = require("./Rpcs/RandomisePartyKey");
const Respawn = require("./Rpcs/Respawn");
const SellBuilding = require("./Rpcs/SellBuilding");
const SendChatMessage = require("./Rpcs/SendChatMessage");
const SetPartyName = require("./Rpcs/SetPartyName");
const TogglePartyPermission = require("./Rpcs/TogglePartyPermission");
const TogglePartyVisibility = require("./Rpcs/TogglePartyVisibility");
const TogglePrimaryAggro = require("./Rpcs/TogglePrimaryAggro");
const UpdateHarvesterTarget = require("./Rpcs/UpdateHarvesterTarget");
const UpgradeBuilding = require("./Rpcs/UpgradeBuilding");

module.exports = {
  Admin,
  AdminCommand,
  BuyHarvesterDrone,
  BuyTool,
  CancelPartyRequest,
  CastSpell,
  EquipTool,
  JoinParty,
  KickMember,
  LeaveParty,
  OutOfSync,
  PartyRequestResponse,
  PlaceBuilding,
  RandomisePartyKey,
  Respawn,
  SellBuilding,
  SendChatMessage,
  SetPartyName,
  TogglePartyPermission,
  TogglePartyVisibility,
  TogglePrimaryAggro,
  UpdateHarvesterTarget,
  UpgradeBuilding,
};
