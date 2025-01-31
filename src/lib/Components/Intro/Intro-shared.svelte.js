import { RuneStore } from "tauri-plugin-svelte";

export let gameOptions = new RuneStore("intro-configs", {
  mode: "standard",
  psk: "",
  playerName: "",
  selectedServer: "v01002",
});

export let psk = $state({ value: "" });
/*
$state({
  mode: "standard",
  psk: "",
  playerName: "",
  selectedServer: "v01002",
});
*/
