import { rand, wrap } from "./math";
import type { Star } from "./types";

export function createStars(w: number, h: number): Star[] {
  const stars: Star[] = [];
  const layers = [
    { n: 70, z: 0.25, size: [0.4, 1.0], speed: [12, 22] },
    { n: 50, z: 0.55, size: [0.7, 1.6], speed: [28, 48] },
    { n: 28, z: 1, size: [1.1, 2.3], speed: [56, 92] },
  ];
  for (const layer of layers) {
    for (let i = 0; i < layer.n; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: layer.z,
        size: rand(layer.size[0]!, layer.size[1]!),
        twinkle: Math.random() * Math.PI * 2,
        speed: rand(layer.speed[0]!, layer.speed[1]!),
      });
    }
  }
  return stars;
}

export function updateStars(
  stars: Star[],
  dt: number,
  w: number,
  h: number,
  speedScale: number,
  playing: boolean,
): void {
  const drift = playing ? speedScale : 0.28;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i]!;
    s.y += s.speed * drift * dt;
    s.twinkle += dt * (1.4 + s.z);
    if (s.y > h + 4) {
      s.y = -4;
      s.x = Math.random() * w;
    }
    s.x = wrap(s.x, w);
  }
}

export function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  w: number,
  h: number,
  reduced: boolean,
  t: number,
): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#050814");
  g.addColorStop(0.45, "#070b16");
  g.addColorStop(1, "#0a101c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Distant nebula wash — very subtle so the field doesn't feel flat.
  ctx.save();
  ctx.globalAlpha = 0.18;
  const neb = ctx.createRadialGradient(w * 0.7, h * 0.15, 20, w * 0.7, h * 0.15, w * 0.7);
  neb.addColorStop(0, "#1b3a66");
  neb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);
  const neb2 = ctx.createRadialGradient(w * 0.2, h * 0.8, 10, w * 0.2, h * 0.8, w * 0.55);
  neb2.addColorStop(0, "#24143a");
  neb2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i]!;
    const tw = reduced ? 1 : 0.55 + 0.45 * Math.sin(s.twinkle + t);
    ctx.globalAlpha = 0.35 + 0.65 * tw * s.z;
    ctx.fillStyle = s.z > 0.8 ? "#e8f4ff" : s.z > 0.4 ? "#c9d9f0" : "#8ea0bf";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    if (!reduced && s.z > 0.85 && tw > 0.85) {
      ctx.globalAlpha = 0.18 * tw;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
