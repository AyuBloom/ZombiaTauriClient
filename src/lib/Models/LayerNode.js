import { Container } from "pixi.js";
import Node from "./Node";

export default class extends Node {
  constructor(game) {
    super(game);
    this.setNode(new Container());
  }
}
