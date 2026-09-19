import type { Particle } from "./types";

const POOL = 420;

export function createParticlePool(): Particle[] {
  const pool: Particle[] = [];
  for (let i = 0; i < POOL; i++) {
    pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 2,
      color: "#fff",
      drag: 0.98,
      gravity: 0,
      spark: false,
    });
  }
  return pool;
}

export function spawnParticle(pool: Particle[], partial: Partial<Particle> & { x: number; y: number }): void {
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]!;
    if (p.active) continue;
    p.active = true;
    p.x = partial.x;
    p.y = partial.y;
    p.vx = partial.vx ?? 0;
    p.vy = partial.vy ?? 0;
    p.life = partial.life ?? 0.5;
    p.maxLife = partial.maxLife ?? p.life;
    p.size = partial.size ?? 2;
    p.color = partial.color ?? "#9ae6ff";
    p.drag = partial.drag ?? 0.985;
    p.gravity = partial.gravity ?? 0;
    p.spark = partial.spark ?? false;
    return;
  }
}

export function burst(
  pool: Particle[],
  x: number,
  y: number,
  count: number,
  colors: string[],
  speed: number,
  reduced: boolean,
): void {
  const n = reduced ? Math.ceil(count * 0.35) : count;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.35 + Math.random());
    spawnParticle(pool, {
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.35 + Math.random() * 0.55,
      maxLife: 0.9,
      size: 1.4 + Math.random() * 3.2,
      color: colors[i % colors.length]!,
      drag: 0.96,
      gravity: 40 + Math.random() * 80,
      spark: Math.random() > 0.55,
    });
  }
}

export function updateParticles(pool: Particle[], dt: number): void {
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]!;
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[]): void {
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]!;
    if (!p.active) continue;
    const t = p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = p.color;
    if (p.spark) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(t * 6);
      ctx.fillRect(-p.size, -0.6, p.size * 2, 1.2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.45 + t * 0.55), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
