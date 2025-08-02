import { RuneStore } from "tauri-plugin-svelte";

export let gameOptions = new RuneStore("intro-config", {
  mode: "standard",
  psk: "",
  playerName: "",
  selectedServer: "v01001",

  needsRestart: {
    "Enable Antialiasing": true,
  },
});

export let gameSettings = new RuneStore("game-settings", {
  deleteOldChat: false,
  specialEffects: true,
});

export let psk = $state({ value: "" });
