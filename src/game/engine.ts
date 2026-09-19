import { GameAudio } from "./audio";
import { hitsObstacle, nearMiss, sweptHit } from "./collision";
import { Input } from "./input";
import { clamp, damp, formatScore } from "./math";
import {
  createObstaclePool,
  difficultyAt,
  drawObstacles,
  resetObstacles,
  spawnObstacle,
  updateObstacles,
} from "./obstacles";
import { burst, createParticlePool, drawParticles, spawnParticle, updateParticles } from "./particles";
import { createPlayer, drawPlayer, resetPlayer, updatePlayer } from "./player";
import { createStars, drawStars, updateStars } from "./stars";
import { loadPrefs, savePrefs } from "./storage";
import { MILESTONES, type GameState, type Obstacle, type Prefs, type ScorePop } from "./types";
import { buildUi, paintHud, paintOver, setScreen, showToast, type UiRefs } from "./ui";

const STEP = 1 / 60;
const MAX_ACC = 0.25;

export class Game {
  private host: HTMLElement;
  private ui: UiRefs;
  private input = new Input();
  private audio = new GameAudio();
  private prefs: Prefs;
  private stars = createStars(800, 1200);
  private particles = createParticlePool();
  private obstacles = createObstaclePool();
  private player = createPlayer(800, 1200);
  private pops: ScorePop[] = [];
  private state: GameState = "home";
  private raf = 0;
  private last = 0;
  private acc = 0;
  private time = 0;
  private score = 0;
  private displayScore = 0;
  private spawnT = 0;
  private lastSpawnX = 400;
  private countdown = 3;
  private countdownShown = "";
  private shake = 0;
  private hitstop = 0;
  private flash = 0;
  private w = 800;
  private h = 1200;
  private reduced = false;
  private milestoneFlash = 0;
  private nextMilestone = 1000;
  private deadTimer = 0;
  private pendingOver = false;
  private lastNear = 0;
  private running = false;
  private ro: ResizeObserver | null = null;

  constructor(host: HTMLElement) {
    this.host = host;
    this.prefs = loadPrefs();
    this.ui = buildUi(host);
    this.audio.setMuted(this.prefs.muted);
    this.audio.setSfx(this.prefs.sfx);
    this.audio.setMusic(this.prefs.music);
    this.reduced =
      this.prefs.reducedFx || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.syncSettingsForm();
    this.bind();
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.ui.root);
    this.input.attach(this.ui.root);
    this.go("home");
    this.installControlsTest();
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.input.detach(this.ui.root);
    this.audio.stopEngine();
    document.removeEventListener("visibilitychange", this.onVis);
    this.host.replaceChildren();
  }

  private bind(): void {
    this.ui.root.addEventListener("click", this.onClick);
    this.ui.root.addEventListener("pointerdown", this.onPointerUnlock, { capture: true });
    this.ui.pauseBtn.addEventListener("click", () => this.togglePause());
    this.ui.muteBtn.addEventListener("click", () => this.toggleMute());
    const left = this.ui.touch.querySelector("[data-left]") as HTMLButtonElement;
    const right = this.ui.touch.querySelector("[data-right]") as HTMLButtonElement;
    const hold = (btn: HTMLButtonElement, side: "left" | "right") => {
      const down = (e: Event) => {
        e.preventDefault();
        this.input.setHeld(side, true);
      };
      const up = () => this.input.setHeld(side, false);
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      btn.addEventListener("pointercancel", up);
    };
    hold(left, "left");
    hold(right, "right");

    this.ui.screens.settings.querySelectorAll<HTMLInputElement>("[data-pref]").forEach((input) => {
      input.addEventListener("change", () => {
        const key = input.dataset.pref as keyof Prefs;
        if (key === "muted") this.prefs.muted = input.checked;
        if (key === "sfx") this.prefs.sfx = input.checked;
        if (key === "music") this.prefs.music = input.checked;
        if (key === "reducedFx") this.prefs.reducedFx = input.checked;
        this.applyPrefs();
      });
    });

    document.addEventListener("visibilitychange", this.onVis);
  }

  private onPointerUnlock = (): void => {
    this.audio.unlock();
  };

  private onClick = (e: MouseEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!btn) return;
    this.audio.unlock();
    this.audio.playClick();
    const action = btn.dataset.action;
    if (action === "play" || action === "restart") this.startRun();
    if (action === "home") this.go("home");
    if (action === "how") this.go("how");
    if (action === "settings") this.go("settings");
    if (action === "resume") this.resume();
  };

  private onVis = (): void => {
    if (document.hidden) {
      this.audio.stopEngine();
      if (this.state === "playing") this.pause();
    } else {
      this.audio.resume();
    }
  };

  private applyPrefs(): void {
    this.audio.setMuted(this.prefs.muted);
    this.audio.setSfx(this.prefs.sfx);
    this.audio.setMusic(this.prefs.music);
    this.reduced =
      this.prefs.reducedFx || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    savePrefs(this.prefs);
    this.syncSettingsForm();
    paintHud(
      this.ui,
      this.displayScore,
      this.prefs.highScore,
      this.time,
      difficultyAt(this.time).name,
      this.prefs.muted,
      this.milestoneFlash > 0,
    );
  }

  private syncSettingsForm(): void {
    const form = this.ui.screens.settings;
    const muted = form.querySelector<HTMLInputElement>('[data-pref="muted"]');
    const sfx = form.querySelector<HTMLInputElement>('[data-pref="sfx"]');
    const music = form.querySelector<HTMLInputElement>('[data-pref="music"]');
    const fx = form.querySelector<HTMLInputElement>('[data-pref="reducedFx"]');
    if (muted) muted.checked = this.prefs.muted;
    if (sfx) sfx.checked = this.prefs.sfx;
    if (music) music.checked = this.prefs.music;
    if (fx) fx.checked = this.prefs.reducedFx;
  }

  private go(state: GameState): void {
    if (state === "home") {
      this.resetWorld(false);
      this.audio.stopEngine();
    }
    this.state = state;
    setScreen(this.ui, state);
    if (state === "home") {
      const play = this.ui.screens.home.querySelector<HTMLButtonElement>('[data-action="play"]');
      play?.focus();
    }
  }

  private startRun(): void {
    this.resetWorld(true);
    this.state = "countdown";
    this.countdown = 3;
    this.countdownShown = "";
    setScreen(this.ui, "countdown");
    this.audio.playStart();
    this.audio.startEngine();
  }

  private resetWorld(forPlay: boolean): void {
    resetPlayer(this.player, this.w, this.h);
    resetObstacles(this.obstacles);
    for (const p of this.particles) p.active = false;
    this.pops.length = 0;
    this.time = 0;
    this.score = 0;
    this.displayScore = 0;
    this.spawnT = 0.4;
    this.lastSpawnX = this.w * 0.5;
    this.shake = 0;
    this.hitstop = 0;
    this.flash = 0;
    this.deadTimer = 0;
    this.pendingOver = false;
    this.milestoneFlash = 0;
    this.nextMilestone = MILESTONES[0]!;
    this.player.alive = true;
    if (!forPlay) this.audio.stopEngine();
  }

  private pause(): void {
    if (this.state !== "playing") return;
    this.state = "paused";
    setScreen(this.ui, "paused");
    this.audio.playPause();
    this.audio.stopEngine();
  }

  private resume(): void {
    if (this.state !== "paused") return;
    this.state = "playing";
    setScreen(this.ui, "playing");
    this.audio.startEngine();
  }

  private togglePause(): void {
    this.audio.unlock();
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
  }

  private toggleMute(): void {
    this.audio.unlock();
    this.prefs.muted = !this.prefs.muted;
    this.applyPrefs();
    this.audio.playClick();
  }

  private resize = (): void => {
    const rect = this.ui.root.getBoundingClientRect();
    this.w = Math.max(320, rect.width);
    this.h = Math.max(480, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.ui.canvas.width = Math.floor(this.w * dpr);
    this.ui.canvas.height = Math.floor(this.h * dpr);
    this.ui.canvas.style.width = `${this.w}px`;
    this.ui.canvas.style.height = `${this.h}px`;
    const ctx = this.ui.canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.player.y = this.h * 0.78;
    if (this.stars.length) {
      /* keep existing stars; wrap on next update */
    } else {
      this.stars = createStars(this.w, this.h);
    }
  };

  private frame = (now: number): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (!Number.isFinite(dt) || dt < 0) dt = STEP;
    dt = Math.min(dt, 0.1);

    if (this.input.pauseQueued) {
      this.input.pauseQueued = false;
      if (this.state === "playing" || this.state === "paused") this.togglePause();
      else if (this.state === "how" || this.state === "settings" || this.state === "over") this.go("home");
    }
    if (this.input.muteQueued) {
      this.input.muteQueued = false;
      this.toggleMute();
    }
    this.input.confirmQueued = false;

    const simOn = this.state === "playing" || this.state === "countdown";
    const starsOn = this.state !== "paused" || true;
    const speedScale = 0.35 + difficultyAt(this.time).scale;

    if (starsOn) updateStars(this.stars, dt, this.w, this.h, speedScale, simOn && this.state === "playing");

    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.render(now / 1000);
      return;
    }

    this.acc += dt;
    if (this.acc > MAX_ACC) this.acc = MAX_ACC;
    while (this.acc >= STEP) {
      this.step(STEP, now);
      this.acc -= STEP;
    }

    this.displayScore = damp(this.displayScore, this.score, 8, dt);
    this.shake = Math.max(0, this.shake - dt * 2.4);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.milestoneFlash = Math.max(0, this.milestoneFlash - dt);
    if (this.pendingOver) {
      this.deadTimer += dt;
      if (this.deadTimer > 0.85) {
        this.pendingOver = false;
        this.finishOver();
      }
    }
    this.render(now / 1000);
  };

  private step(dt: number, now: number): void {
    const playing = this.state === "playing";
    const countdown = this.state === "countdown";
    this.input.sample(this.player.x, this.w);

    if (countdown) {
      this.countdown -= dt;
      const n = this.countdown > 2 ? "3" : this.countdown > 1 ? "2" : this.countdown > 0 ? "1" : "GO";
      if (n !== this.countdownShown) {
        this.countdownShown = n;
        this.ui.countdown.textContent = n;
        if (n === "GO") this.audio.playGo();
        else this.audio.playCountdown();
      }
      if (this.countdown <= -0.28) {
        this.state = "playing";
        setScreen(this.ui, "playing");
      }
      updatePlayer(this.player, this.input.axis, dt, this.w, this.h, 0.2, this.particles, this.reduced, true);
      updateParticles(this.particles, dt);
      return;
    }

    if (!playing) {
      updateParticles(this.particles, dt);
      return;
    }

    if (!this.player.alive) {
      updateParticles(this.particles, dt);
      return;
    }

    const prevX = this.player.x;
    const prevY = this.player.y;
    const diff = difficultyAt(this.time);
    this.time += dt;
    this.score += dt * (110 + diff.scale * 90);

    if (Math.abs(this.input.axis) > 0.15) this.audio.playMove(now);

    updatePlayer(
      this.player,
      this.input.axis,
      dt,
      this.w,
      this.h,
      diff.scale,
      this.particles,
      this.reduced,
      this.player.alive,
    );

    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.player.alive) {
      const spawned = spawnObstacle(this.obstacles, this.w, diff, this.lastSpawnX);
      if (spawned) {
        this.lastSpawnX = spawned.kind === "laser" ? spawned.gapX : spawned.x;
        this.spawnT = diff.spawnEvery * (0.82 + Math.random() * 0.36);
      }
    }

    updateObstacles(this.obstacles, dt, this.w, this.h, diff, this.player.y, () => {
      this.score += 28 + diff.scale * 20;
    });
    updateParticles(this.particles, dt);
    this.audio.setEngineLevel(diff.scale);

    if (this.player.alive) {
      for (const o of this.obstacles) {
        if (!o.active) continue;
        if (nearMiss(this.player, o) && now - this.lastNear > 280) {
          this.lastNear = now;
          this.score += 12;
          this.pops.push({
            x: this.player.x,
            y: this.player.y - 36,
            text: "+12",
            life: 0.6,
            maxLife: 0.6,
          });
          this.audio.playNearMiss();
        }
        if (sweptHit(this.player, o, prevX, prevY) || hitsObstacle(this.player, o)) {
          this.crash(o);
          break;
        }
      }
    }

    while (this.score >= this.nextMilestone) {
      this.onMilestone(this.nextMilestone);
      const idx = MILESTONES.indexOf(this.nextMilestone);
      this.nextMilestone = idx >= 0 && idx < MILESTONES.length - 1 ? MILESTONES[idx + 1]! : this.nextMilestone * 2;
    }

    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i]!;
      p.life -= dt;
      p.y -= 28 * dt;
      if (p.life <= 0) this.pops.splice(i, 1);
    }
  }

  private crash(o: Obstacle): void {
    this.player.alive = false;
    this.pendingOver = true;
    this.deadTimer = 0;
    this.hitstop = this.reduced ? 0.04 : 0.12;
    this.shake = this.reduced ? 0.25 : 0.85;
    this.flash = 0.55;
    this.audio.playHit();
    this.audio.stopEngine();
    burst(
      this.particles,
      this.player.x,
      this.player.y,
      this.reduced ? 18 : 52,
      ["#7dd3fc", "#e8eef8", "#38bdf8", "#fb7185", "#fda4af"],
      280,
      this.reduced,
    );
    burst(this.particles, o.x, o.y, 12, ["#9aa7b8", "#e8eef8"], 160, this.reduced);
    if (this.score > this.prefs.highScore) {
      this.prefs.highScore = Math.floor(this.score);
      savePrefs(this.prefs);
    }
  }

  private finishOver(): void {
    this.prefs.highScore = Math.max(this.prefs.highScore, Math.floor(this.score));
    savePrefs(this.prefs);
    this.state = "over";
    setScreen(this.ui, "over");
    paintOver(this.ui, this.score, this.prefs.highScore);
    this.audio.playGameOver();
    const again = this.ui.screens.over.querySelector<HTMLButtonElement>('[data-action="restart"]');
    again?.focus();
  }

  private onMilestone(value: number): void {
    this.milestoneFlash = 0.8;
    this.audio.playMilestone();
    if (!this.reduced) this.shake = Math.max(this.shake, 0.22);
    showToast(this.ui, `${formatScore(value)} reached`);
    for (let i = 0; i < (this.reduced ? 6 : 16); i++) {
      spawnParticle(this.particles, {
        x: this.player.x + (Math.random() - 0.5) * 40,
        y: this.player.y - 20,
        vx: (Math.random() - 0.5) * 80,
        vy: -40 - Math.random() * 80,
        life: 0.5,
        maxLife: 0.5,
        size: 2,
        color: "#7dd3fc",
        gravity: 30,
        spark: true,
      });
    }
  }

  private render(t: number): void {
    const ctx = this.ui.canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    if (this.shake > 0 && !this.reduced) {
      const mag = this.shake * this.shake * 14;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      ctx.rotate(((Math.random() - 0.5) * mag) / 400);
    }

    drawStars(ctx, this.stars, this.w, this.h, this.reduced, t);
    drawObstacles(ctx, this.obstacles, t, this.reduced);
    drawParticles(ctx, this.particles);
    drawPlayer(ctx, this.player, t, this.reduced, this.pendingOver);

    for (const pop of this.pops) {
      ctx.globalAlpha = clamp(pop.life / pop.maxLife, 0, 1);
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.globalAlpha = 1;
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 230, 230, ${this.flash * 0.28})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    // Vignette
    const vig = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * 0.2, this.w / 2, this.h / 2, this.h * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();

    paintHud(
      this.ui,
      this.displayScore,
      this.prefs.highScore,
      this.time,
      difficultyAt(this.time).name,
      this.prefs.muted,
      this.milestoneFlash > 0,
    );
  }

  private installControlsTest(): void {
    window.__controlsTest = {
      getYaw: () => -this.player.x / 80,
      getSpeed: () => (this.state === "playing" || this.state === "countdown" ? 1 : 0),
      setKeys: (codes: string[]) => {
        this.input.setKeys(codes);
        if (this.state === "home" || this.state === "over") this.startRun();
      },
      setSteer: (v: number) => this.input.setSteer(v),
    };
  }
}

export function createGame(host: HTMLElement): { destroy: () => void } {
  const game = new Game(host);
  return { destroy: () => game.destroy() };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setSteer?: (v: number) => void;
      setKeys?: (codes: string[]) => void;
    };
  }
}
