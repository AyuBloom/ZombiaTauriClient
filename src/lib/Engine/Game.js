import { EventEmitter } from "events";

import UI from "$lib/Components/UI/UI.svelte.js";
import Renderer from "./Renderer/Renderer.svelte.js";
import Network from "./Network/Network.svelte.js";
import Util from "./Util.svelte.js";
import InputPacketManager from "./InputPacketManager.js";

export default new (class {
  constructor() {
    this.ui = new UI(this);
    this.network = new Network(this);
    this.renderer = new Renderer(this);

    this.util = new Util(this);

    this.inputPacketManager = new InputPacketManager(this);

    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100);
  }
  async init() {
    await this.renderer.init();
    this.ui.init();
    this.network.init();

    this.inputPacketManager.init();
  }
  getInWorld() {
    return this.network.connected;
  }
})();
