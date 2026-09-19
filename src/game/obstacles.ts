import { clamp, pick, rand, randInt } from "./math";
import type { DifficultyName, Obstacle, ObstacleKind } from "./types";

const POOL = 48;

export function createObstaclePool(): Obstacle[] {
  const pool: Obstacle[] = [];
  for (let i = 0; i < POOL; i++) {
    pool.push(emptyObstacle());
  }
  return pool;
}

function emptyObstacle(): Obstacle {
  return {
    active: false,
    kind: "asteroid",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 16,
    width: 32,
    height: 32,
    rot: 0,
    rotSpeed: 0,
    phase: 0,
    hue: 0,
    seed: 1,
    gapX: 0,
    gapW: 80,
    passed: false,
  };
}

export function resetObstacles(pool: Obstacle[]): void {
  for (const o of pool) o.active = false;
}

export interface Difficulty {
  name: DifficultyName;
  speed: number;
  spawnEvery: number;
  kinds: ObstacleKind[];
  droneWeave: number;
  laserChance: number;
  scale: number;
}

export function difficultyAt(time: number): Difficulty {
  const t = Math.max(0, time);
  const ramp = 1 - Math.exp(-t / 42);
  const speed = 160 + ramp * 340;
  let name: DifficultyName = "EASY";
  if (t >= 60) name = "EXTREME";
  else if (t >= 30) name = "HARD";
  else if (t >= 10) name = "NORMAL";

  const kinds: ObstacleKind[] = ["asteroid"];
  if (t >= 6) kinds.push("debris");
  if (t >= 14) kinds.push("energy");
  if (t >= 22) kinds.push("drone");
  if (t >= 36) kinds.push("laser");

  const spawnEvery = clamp(1.15 - ramp * 0.78, 0.34, 1.15);
  return {
    name,
    speed,
    spawnEvery,
    kinds,
    droneWeave: 40 + ramp * 70,
    laserChance: t < 36 ? 0 : 0.08 + Math.min(0.18, (t - 36) / 80),
    scale: ramp,
  };
}

export function spawnObstacle(
  pool: Obstacle[],
  w: number,
  diff: Difficulty,
  lastX: number,
): Obstacle | null {
  let slot: Obstacle | null = null;
  for (const o of pool) {
    if (!o.active) {
      slot = o;
      break;
    }
  }
  if (!slot) return null;

  const forceLaser = Math.random() < diff.laserChance && diff.kinds.includes("laser");
  const kind: ObstacleKind = forceLaser ? "laser" : pick(diff.kinds);
  const o = slot;
  o.active = true;
  o.kind = kind;
  o.rot = rand(0, Math.PI * 2);
  o.rotSpeed = rand(-2.4, 2.4);
  o.phase = rand(0, Math.PI * 2);
  o.hue = rand(0, 360);
  o.seed = randInt(1, 9999);
  o.passed = false;
  o.vx = rand(-28, 28) * (0.4 + diff.scale);
  o.vy = diff.speed * rand(0.86, 1.14);
  o.y = -40;

  if (kind === "laser") {
    const gapW = clamp(108 - diff.scale * 38, 70, 120);
    let gapX = rand(gapW * 0.6, w - gapW * 0.6);
    if (Math.abs(gapX - lastX) < 40) gapX = clamp(lastX + (Math.random() > 0.5 ? 90 : -90), gapW, w - gapW);
    o.width = w;
    o.height = 14;
    o.radius = 8;
    o.gapW = gapW;
    o.gapX = gapX;
    o.x = w * 0.5;
    o.vx = 0;
    o.vy = diff.speed * 0.92;
    o.y = -20;
    return o;
  }

  const sizeBase =
    kind === "asteroid" ? rand(18, 32) : kind === "debris" ? rand(12, 22) : kind === "energy" ? rand(16, 24) : rand(14, 20);
  o.radius = sizeBase;
  o.width = sizeBase * 2;
  o.height = sizeBase * 2;

  // Keep a reachable lane: bias away from stacking directly on the last gap.
  let x = rand(36, w - 36);
  if (Math.abs(x - lastX) < 26) {
    x = clamp(lastX + (x >= lastX ? 1 : -1) * rand(70, 140), 36, w - 36);
  }
  o.x = x;
  if (kind === "drone") o.vx = rand(-40, 40);
  return o;
}

export function updateObstacles(
  pool: Obstacle[],
  dt: number,
  w: number,
  h: number,
  diff: Difficulty,
  playerY: number,
  onPassed: () => void,
): void {
  for (let i = 0; i < pool.length; i++) {
    const o = pool[i]!;
    if (!o.active) continue;
    o.y += o.vy * dt;
    o.x += o.vx * dt;
    o.rot += o.rotSpeed * dt;
    o.phase += dt * (1.6 + diff.scale);

    if (o.kind === "drone") {
      o.x += Math.sin(o.phase * 2.2) * diff.droneWeave * dt;
    }
    if (o.kind === "energy") {
      o.x += Math.sin(o.phase) * 18 * dt;
    }

    o.x = clamp(o.x, 20, w - 20);

    if (!o.passed && o.y - o.radius > playerY + 8) {
      o.passed = true;
      onPassed();
    }
    if (o.y - Math.max(o.radius, o.height) > h + 40) {
      o.active = false;
    }
  }
}

export function drawObstacles(ctx: CanvasRenderingContext2D, pool: Obstacle[], time: number, reduced: boolean): void {
  for (let i = 0; i < pool.length; i++) {
    const o = pool[i]!;
    if (!o.active) continue;
    switch (o.kind) {
      case "asteroid":
        drawAsteroid(ctx, o, reduced);
        break;
      case "debris":
        drawDebris(ctx, o);
        break;
      case "energy":
        drawEnergy(ctx, o, time, reduced);
        break;
      case "drone":
        drawDrone(ctx, o, time, reduced);
        break;
      case "laser":
        drawLaser(ctx, o, time, reduced);
        break;
    }
  }
}

function hashed(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function drawAsteroid(ctx: CanvasRenderingContext2D, o: Obstacle, reduced: boolean): void {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.rot);
  const n = 8;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = o.radius * (0.72 + hashed(o.seed, i) * 0.36);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(-o.radius * 0.3, -o.radius * 0.3, 4, 0, 0, o.radius);
  g.addColorStop(0, "#8b7d72");
  g.addColorStop(0.6, "#4a433c");
  g.addColorStop(1, "#2a2520");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#c4b8aa";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (!reduced) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.arc(-o.radius * 0.2, o.radius * 0.1, o.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDebris(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.rot);
  ctx.fillStyle = "#9aa7b8";
  ctx.strokeStyle = "#e8eef8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-o.radius, -o.radius * 0.3);
  ctx.lineTo(o.radius * 0.7, -o.radius * 0.6);
  ctx.lineTo(o.radius * 0.4, o.radius * 0.55);
  ctx.lineTo(-o.radius * 0.55, o.radius * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#38bdf8";
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(-o.radius * 0.4, 0);
  ctx.lineTo(o.radius * 0.3, -o.radius * 0.15);
  ctx.stroke();
  ctx.restore();
}

function drawEnergy(ctx: CanvasRenderingContext2D, o: Obstacle, time: number, reduced: boolean): void {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.rot * 0.4);
  const pulse = 0.7 + 0.3 * Math.sin(time * 6 + o.phase);
  if (!reduced) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.35 * pulse;
    ctx.fillStyle = "#c084fc";
    ctx.beginPath();
    ctx.roundRect(-o.radius * 1.4, -o.radius * 1.4, o.radius * 2.8, o.radius * 2.8, 8);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(-o.radius, -o.radius, o.radius, o.radius);
  g.addColorStop(0, "#e9d5ff");
  g.addColorStop(0.5, "#a855f7");
  g.addColorStop(1, "#38bdf8");
  ctx.fillStyle = g;
  ctx.strokeStyle = "#f5d0fe";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-o.radius * 0.85, -o.radius * 0.85, o.radius * 1.7, o.radius * 1.7, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawDrone(ctx: CanvasRenderingContext2D, o: Obstacle, time: number, reduced: boolean): void {
  ctx.save();
  ctx.translate(o.x, o.y);
  const bank = Math.sin(o.phase * 2.2) * 0.35;
  ctx.rotate(bank);
  if (!reduced) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.arc(0, 0, o.radius * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#2a1520";
  ctx.strokeStyle = "#fb7185";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, o.radius);
  ctx.lineTo(o.radius * 0.85, -o.radius * 0.5);
  ctx.lineTo(0, -o.radius * 0.15);
  ctx.lineTo(-o.radius * 0.85, -o.radius * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 80, 80, ${0.6 + 0.4 * Math.sin(time * 10)})`;
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLaser(ctx: CanvasRenderingContext2D, o: Obstacle, time: number, reduced: boolean): void {
  const pulse = 0.65 + 0.35 * Math.sin(time * 14 + o.phase);
  const y = o.y;
  const h = o.height;
  const drawBeam = (x: number, w: number) => {
    if (w <= 0) return;
    if (!reduced) {
      ctx.globalAlpha = 0.25 * pulse;
      ctx.fillStyle = "#fb7185";
      ctx.fillRect(x, y - h, w, h * 2);
    }
    ctx.globalAlpha = 0.9;
    const g = ctx.createLinearGradient(0, y - h * 0.5, 0, y + h * 0.5);
    g.addColorStop(0, "rgba(251,113,133,0.1)");
    g.addColorStop(0.5, `rgba(255, 80, 110, ${0.85 * pulse})`);
    g.addColorStop(1, "rgba(251,113,133,0.1)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y - h * 0.45, w, h * 0.9);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffe4e6";
    ctx.fillRect(x, y - 1.5, w, 3);
  };
  const leftW = o.gapX - o.gapW * 0.5;
  const rightX = o.gapX + o.gapW * 0.5;
  drawBeam(0, leftW);
  drawBeam(rightX, o.width - rightX);

  // Gate posts
  ctx.fillStyle = "#e8eef8";
  ctx.fillRect(leftW - 3, y - 8, 6, 16);
  ctx.fillRect(rightX - 3, y - 8, 6, 16);
}
