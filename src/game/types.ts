export type GameState = "home" | "how" | "settings" | "countdown" | "playing" | "paused" | "over";

export type DifficultyName = "EASY" | "NORMAL" | "HARD" | "EXTREME";

export type ObstacleKind = "asteroid" | "debris" | "energy" | "drone" | "laser";

export interface Player {
  x: number;
  y: number;
  vx: number;
  tilt: number;
  bob: number;
  width: number;
  height: number;
  radius: number;
  alive: boolean;
}

export interface Obstacle {
  active: boolean;
  kind: ObstacleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  width: number;
  height: number;
  rot: number;
  rotSpeed: number;
  phase: number;
  hue: number;
  seed: number;
  /** Laser-only: gap center and width. */
  gapX: number;
  gapW: number;
  passed: boolean;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  drag: number;
  gravity: number;
  spark: boolean;
}

export interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  twinkle: number;
  speed: number;
}

export interface ScorePop {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
}

export interface Prefs {
  version: number;
  muted: boolean;
  sfx: boolean;
  music: boolean;
  reducedFx: boolean;
  highScore: number;
}

export const PREFS_VERSION = 1;

export const DEFAULT_PREFS: Prefs = {
  version: PREFS_VERSION,
  muted: false,
  sfx: true,
  music: true,
  reducedFx: false,
  highScore: 0,
};

export const MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];
