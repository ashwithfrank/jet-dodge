import { clamp, damp } from "./math";
import { spawnParticle } from "./particles";
import type { Particle, Player } from "./types";

export function createPlayer(w: number, h: number): Player {
  return {
    x: w * 0.5,
    y: h * 0.78,
    vx: 0,
    tilt: 0,
    bob: 0,
    width: 36,
    height: 48,
    radius: 13,
    alive: true,
  };
}

export function resetPlayer(p: Player, w: number, h: number): void {
  p.x = w * 0.5;
  p.y = h * 0.78;
  p.vx = 0;
  p.tilt = 0;
  p.bob = 0;
  p.alive = true;
}

export function updatePlayer(
  p: Player,
  axis: number,
  dt: number,
  w: number,
  h: number,
  speedScale: number,
  particles: Particle[],
  reduced: boolean,
  moving: boolean,
): void {
  p.y = h * 0.78;
  const accel = 980 + speedScale * 220;
  const maxSpeed = 420 + speedScale * 140;
  const targetVx = axis * maxSpeed;
  p.vx = damp(p.vx, targetVx, axis !== 0 ? 14 : 10, dt);
  p.x += p.vx * dt;
  const pad = 28;
  p.x = clamp(p.x, pad, w - pad);
  if (p.x <= pad || p.x >= w - pad) p.vx *= 0.3;

  const tiltTarget = clamp(p.vx / maxSpeed, -1, 1) * 0.42;
  p.tilt = damp(p.tilt, tiltTarget, 12, dt);
  p.bob += dt * (2.4 + Math.abs(axis));

  if (moving && !reduced) {
    const count = Math.abs(axis) > 0.2 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      spawnParticle(particles, {
        x: p.x + (Math.random() - 0.5) * 8,
        y: p.y + 22 + Math.random() * 6,
        vx: (Math.random() - 0.5) * 30 - p.vx * 0.08,
        vy: 90 + Math.random() * 80,
        life: 0.22 + Math.random() * 0.18,
        maxLife: 0.4,
        size: 1.4 + Math.random() * 1.8,
        color: Math.random() > 0.5 ? "#7dd3fc" : "#38bdf8",
        drag: 0.94,
        gravity: 20,
      });
    }
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: Player,
  time: number,
  reduced: boolean,
  exploding: boolean,
): void {
  if (!p.alive && exploding) return;
  const bob = Math.sin(p.bob) * 2.4;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.rotate(p.tilt);

  if (!reduced) {
    const pulse = 0.55 + 0.45 * Math.sin(time * 18);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55 * pulse;
    const eg = ctx.createRadialGradient(0, 24, 1, 0, 28, 28);
    eg.addColorStop(0, "rgba(125, 211, 252, 0.95)");
    eg.addColorStop(0.4, "rgba(56, 189, 248, 0.35)");
    eg.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.ellipse(0, 28, 10, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Wings
  ctx.fillStyle = "#1c2a3d";
  ctx.strokeStyle = "#7dd3fc";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(-22, 16);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(22, 16);
  ctx.lineTo(8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rear fins
  ctx.fillStyle = "#152033";
  ctx.beginPath();
  ctx.moveTo(-5, 14);
  ctx.lineTo(-11, 22);
  ctx.lineTo(-2, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, 14);
  ctx.lineTo(11, 22);
  ctx.lineTo(2, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fuselage
  const body = ctx.createLinearGradient(0, -24, 0, 20);
  body.addColorStop(0, "#e8f4ff");
  body.addColorStop(0.25, "#9bd4f0");
  body.addColorStop(1, "#24344c");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.bezierCurveTo(8, -16, 9, 2, 5, 18);
  ctx.lineTo(-5, 18);
  ctx.bezierCurveTo(-9, 2, -8, -16, 0, -24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c8e8ff";
  ctx.stroke();

  // Cockpit
  const cock = ctx.createLinearGradient(0, -14, 0, 2);
  cock.addColorStop(0, "#f0fbff");
  cock.addColorStop(0.4, "#38bdf8");
  cock.addColorStop(1, "#0369a1");
  ctx.fillStyle = cock;
  ctx.beginPath();
  ctx.ellipse(0, -6, 4.2, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e0f2fe";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Engine core
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.roundRect(-4, 16, 8, 6, 2);
  ctx.fill();
  ctx.fillStyle = reduced ? "#e0f2fe" : `rgba(255,255,255,${0.7 + 0.3 * Math.sin(time * 22)})`;
  ctx.beginPath();
  ctx.roundRect(-2.2, 17, 4.4, 5, 1.4);
  ctx.fill();

  ctx.restore();
}
