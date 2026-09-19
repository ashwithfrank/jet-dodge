import { formatScore, formatTime } from "./math";
import type { DifficultyName, GameState } from "./types";

export interface UiRefs {
  root: HTMLDivElement;
  canvas: HTMLCanvasElement;
  hud: HTMLElement;
  score: HTMLElement;
  high: HTMLElement;
  time: HTMLElement;
  diff: HTMLElement;
  screens: Record<"home" | "how" | "settings" | "pause" | "over", HTMLElement>;
  countdown: HTMLElement;
  touch: HTMLElement;
  overScore: HTMLElement;
  overBest: HTMLElement;
  muteBtn: HTMLButtonElement;
  pauseBtn: HTMLButtonElement;
  toast: HTMLElement;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  }
  return node;
}

function icon(path: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "jd-icon");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", path);
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", "currentColor");
  p.setAttribute("stroke-width", "1.8");
  p.setAttribute("stroke-linecap", "round");
  p.setAttribute("stroke-linejoin", "round");
  svg.appendChild(p);
  return svg;
}

const ICONS = {
  play: "M7 4.5v15l13-7.5L7 4.5z",
  pause: "M8 5v14M16 5v14",
  home: "M4 11.5 12 4l8 7.5V20H4z",
  mute: "M11 6 6 10H3v4h3l5 4V6zm7 3-6 6m0-6 6 6",
  sound: "M11 6 6 10H3v4h3l5 4V6zm5.5 1.5a6 6 0 0 1 0 9M15 9.5a3.5 3.5 0 0 1 0 5",
  settings: "M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zM12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4",
};

export function buildUi(host: HTMLElement): UiRefs {
  host.innerHTML = "";
  const root = el("div", "jd-root");
  const canvas = el("canvas", "jd-canvas", { "aria-label": "JET DODGE playfield" });
  canvas.setAttribute("role", "img");

  const hud = el("div", "jd-hud", { hidden: "" });
  hud.innerHTML = `
    <div class="jd-hud-cluster">
      <div class="jd-stat">
        <span class="jd-stat-label">SCORE</span>
        <span class="jd-stat-value" data-score>000000</span>
      </div>
      <div class="jd-stat">
        <span class="jd-stat-label">BEST</span>
        <span class="jd-stat-value" data-high>000000</span>
      </div>
      <div class="jd-stat">
        <span class="jd-stat-label">TIME</span>
        <span class="jd-stat-value" data-time>0:00</span>
      </div>
      <div class="jd-stat">
        <span class="jd-stat-label">SECTOR</span>
        <span class="jd-stat-value jd-diff" data-diff>EASY</span>
      </div>
    </div>
    <div class="jd-hud-actions">
      <button type="button" class="jd-icon-btn" data-mute aria-label="Mute sound">
      </button>
      <button type="button" class="jd-icon-btn" data-pause aria-label="Pause game">
      </button>
    </div>
  `;

  const muteBtn = hud.querySelector("[data-mute]") as HTMLButtonElement;
  const pauseBtn = hud.querySelector("[data-pause]") as HTMLButtonElement;
  muteBtn.appendChild(icon(ICONS.sound));
  pauseBtn.appendChild(icon(ICONS.pause));

  const home = screen("home", buildHome());
  const how = screen("how", buildHow());
  const settings = screen("settings", buildSettings());
  const pause = screen("pause", buildPause());
  const over = screen("over", buildOver());

  const countdown = el("div", "jd-countdown", { hidden: "", "aria-live": "assertive" });
  const toast = el("div", "jd-toast", { hidden: "", "aria-live": "polite" });

  const touch = el("div", "jd-touch", { hidden: "" });
  touch.innerHTML = `
    <button type="button" class="jd-touch-btn" data-left aria-label="Move left">
      <span aria-hidden="true">‹</span>
    </button>
    <button type="button" class="jd-touch-btn" data-right aria-label="Move right">
      <span aria-hidden="true">›</span>
    </button>
  `;

  root.append(canvas, hud, home, how, settings, pause, over, countdown, toast, touch);
  host.appendChild(root);

  return {
    root,
    canvas,
    hud,
    score: hud.querySelector("[data-score]") as HTMLElement,
    high: hud.querySelector("[data-high]") as HTMLElement,
    time: hud.querySelector("[data-time]") as HTMLElement,
    diff: hud.querySelector("[data-diff]") as HTMLElement,
    screens: { home, how, settings, pause, over },
    countdown,
    touch,
    overScore: over.querySelector("[data-over-score]") as HTMLElement,
    overBest: over.querySelector("[data-over-best]") as HTMLElement,
    muteBtn,
    pauseBtn,
    toast,
  };
}

function screen(name: string, inner: HTMLElement): HTMLElement {
  const wrap = el("div", `jd-screen jd-screen-${name}`, { hidden: "" });
  wrap.setAttribute("role", name === "home" ? "main" : "dialog");
  if (name !== "home") wrap.setAttribute("aria-modal", "true");
  wrap.appendChild(inner);
  return wrap;
}

function buildHome(): HTMLElement {
  const panel = el("div", "jd-hero");
  panel.innerHTML = `
    <p class="jd-kicker">VOID SECTOR 07</p>
    <h1 class="jd-logo">JET<span>//</span>DODGE</h1>
    <p class="jd-sub">SURVIVE THE VOID</p>
    <div class="jd-actions">
      <button type="button" class="jd-btn jd-btn-primary" data-action="play">PLAY</button>
      <button type="button" class="jd-btn jd-btn-ghost" data-action="how">How to Play</button>
      <button type="button" class="jd-btn jd-btn-ghost" data-action="settings">Settings</button>
    </div>
    <p class="jd-hint">A / D or arrows to strafe · ESC to pause</p>
  `;
  return panel;
}

function buildHow(): HTMLElement {
  const panel = el("div", "jd-panel");
  panel.innerHTML = `
    <h2 class="jd-panel-title">How to Play</h2>
    <p class="jd-panel-lead">Stay alive. The void does not slow down. Fly, dodge, and outlast the field.</p>
    <div class="jd-keys">
      <div><kbd>A</kbd><kbd>←</kbd><span>Left</span></div>
      <div><kbd>D</kbd><kbd>→</kbd><span>Right</span></div>
      <div><kbd>ESC</kbd><span>Pause</span></div>
      <div><kbd>M</kbd><span>Mute</span></div>
    </div>
    <p class="jd-panel-lead">On a phone, drag the jet or use the on-screen paddles.</p>
    <div class="jd-actions">
      <button type="button" class="jd-btn jd-btn-primary" data-action="play">PLAY</button>
      <button type="button" class="jd-btn jd-btn-ghost" data-action="home">Home</button>
    </div>
  `;
  return panel;
}

function buildSettings(): HTMLElement {
  const panel = el("div", "jd-panel");
  panel.innerHTML = `
    <h2 class="jd-panel-title">Settings</h2>
    <label class="jd-toggle">
      <input type="checkbox" data-pref="muted" />
      <span>Mute all audio</span>
    </label>
    <label class="jd-toggle">
      <input type="checkbox" data-pref="sfx" checked />
      <span>Sound effects</span>
    </label>
    <label class="jd-toggle">
      <input type="checkbox" data-pref="music" checked />
      <span>Engine drone</span>
    </label>
    <label class="jd-toggle">
      <input type="checkbox" data-pref="reducedFx" />
      <span>Reduced effects</span>
    </label>
    <p class="jd-panel-lead">Preferences save on this device.</p>
    <div class="jd-actions">
      <button type="button" class="jd-btn jd-btn-primary" data-action="home">Done</button>
    </div>
  `;
  return panel;
}

function buildPause(): HTMLElement {
  const panel = el("div", "jd-panel");
  panel.innerHTML = `
    <h2 class="jd-panel-title">Game Paused</h2>
    <p class="jd-panel-lead">The void can wait.</p>
    <div class="jd-actions">
      <button type="button" class="jd-btn jd-btn-primary" data-action="resume">Resume</button>
      <button type="button" class="jd-btn jd-btn-ghost" data-action="restart">Restart</button>
      <button type="button" class="jd-btn jd-btn-ghost" data-action="home">Home</button>
    </div>
  `;
  return panel;
}

function buildOver(): HTMLElement {
  const panel = el("div", "jd-panel");
  panel.innerHTML = `
    <h2 class="jd-panel-title">Game Over</h2>
    <div class="jd-over-stats">
      <div>
        <span class="jd-stat-label">SCORE</span>
        <span class="jd-stat-value" data-over-score>000000</span>
      </div>
      <div>
        <span class="jd-stat-label">BEST</span>
        <span class="jd-stat-value" data-over-best>000000</span>
      </div>
    </div>
    <div class="jd-actions">
      <button type="button" class="jd-btn jd-btn-primary" data-action="restart">Play Again</button>
      <button type="button" class="jd-btn jd-btn-ghost" data-action="home">Home</button>
    </div>
  `;
  return panel;
}

export function setScreen(refs: UiRefs, state: GameState): void {
  const map: Record<GameState, keyof UiRefs["screens"] | null> = {
    home: "home",
    how: "how",
    settings: "settings",
    countdown: null,
    playing: null,
    paused: "pause",
    over: "over",
  };
  for (const [key, node] of Object.entries(refs.screens)) {
    const on = map[state] === key;
    node.hidden = !on;
    node.classList.toggle("is-on", on);
  }
  const showHud = state === "playing" || state === "countdown" || state === "paused" || state === "over";
  refs.hud.hidden = !showHud;
  refs.touch.hidden = !(state === "playing" || state === "countdown");
  refs.countdown.hidden = state !== "countdown";
  refs.root.dataset.state = state;
}

export function paintHud(
  refs: UiRefs,
  score: number,
  high: number,
  time: number,
  diff: DifficultyName,
  muted: boolean,
  milestone: boolean,
): void {
  refs.score.textContent = formatScore(score);
  refs.high.textContent = formatScore(high);
  refs.time.textContent = formatTime(time);
  refs.diff.textContent = diff;
  refs.diff.dataset.tier = diff;
  refs.score.classList.toggle("is-flash", milestone);
  refs.muteBtn.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
  refs.muteBtn.replaceChildren(icon(muted ? ICONS.mute : ICONS.sound));
}

export function paintOver(refs: UiRefs, score: number, best: number): void {
  refs.overScore.textContent = formatScore(score);
  refs.overBest.textContent = formatScore(best);
}

export function showToast(refs: UiRefs, text: string): void {
  refs.toast.hidden = false;
  refs.toast.textContent = text;
  refs.toast.classList.remove("is-in");
  void refs.toast.offsetWidth;
  refs.toast.classList.add("is-in");
}
