import { createGame } from "./engine";

const host = document.getElementById("game");
if (!host) throw new Error("Missing #game root");
createGame(host);
