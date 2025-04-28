import { EventEmitter } from "events";
// import DiscordRichPresence from "discord-rich-presence";

// import { DISCORD_APP_ID } from "$lib/id.json";
import UI from "$lib/Components/UI/UI.svelte.js";
import Renderer from "./Renderer/Renderer.svelte.js";
import Network from "./Network/Network.svelte.js";
import Util from "./Util.svelte.js";
import InputPacketManager from "./InputPacketManager.js";

export default new (class {
  constructor() {
    /*
    this.Server = new Server({
      port: 8000,
      gameMode: "standard",
    });
    */

    this.ui = new UI(this);
    this.network = new Network(this);
    this.renderer = new Renderer(this);

    this.util = new Util(this);

    this.inputPacketManager = new InputPacketManager(this);

    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100);

    // this.discord = DiscordRichPresence(DISCORD_APP_ID);
  }
  async init() {
    await this.renderer.init();
    this.ui.init();
    this.network.init();

    this.inputPacketManager.init();

    /*
    this.discord.updatePresence({
      state: "zamb bee ahh dot eye ohh",
      details: "on a tauri client",
      startTimestamp: Date.now(),
      instance: true,
    });
    */
  }
  getInWorld() {
    return this.network.connected;
  }
})();
