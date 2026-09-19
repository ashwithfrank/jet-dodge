import type { Obstacle, Player } from "./types";

export function hitsObstacle(player: Player, o: Obstacle): boolean {
  if (!o.active) return false;
  if (o.kind === "laser") return hitsLaser(player, o);
  const dx = player.x - o.x;
  const dy = player.y - o.y;
  const r = player.radius + o.radius * 0.86;
  return dx * dx + dy * dy < r * r;
}

function hitsLaser(player: Player, o: Obstacle): boolean {
  const py = player.y;
  const half = o.height * 0.45;
  if (py + player.radius < o.y - half || py - player.radius > o.y + half) return false;
  const gapL = o.gapX - o.gapW * 0.5;
  const gapR = o.gapX + o.gapW * 0.5;
  const px = player.x;
  const pr = player.radius * 0.85;
  if (px + pr < gapL) return true;
  if (px - pr > gapR) return true;
  return false;
}

/** Swept circle vs circle to reduce tunneling at high speed. */
export function sweptHit(player: Player, o: Obstacle, prevX: number, prevY: number): boolean {
  if (o.kind === "laser") return hitsObstacle(player, o);
  const steps = 3;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = prevX + (player.x - prevX) * t;
    const y = prevY + (player.y - prevY) * t;
    const dx = x - o.x;
    const dy = y - o.y;
    const r = player.radius + o.radius * 0.86;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

export function nearMiss(player: Player, o: Obstacle): boolean {
  if (!o.active || o.kind === "laser") return false;
  const dx = player.x - o.x;
  const dy = player.y - o.y;
  const d2 = dx * dx + dy * dy;
  const inner = player.radius + o.radius * 0.86;
  const outer = inner + 16;
  return d2 > inner * inner && d2 < outer * outer;
}
