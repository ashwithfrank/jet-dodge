import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CU_9WigS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Procedural SFX via Web Audio. Unlocked on the first user gesture.
* No external audio files — works fully offline after the page loads.
*/
var GameAudio = class {
	ctx = null;
	master = null;
	sfxBus = null;
	musicBus = null;
	engineGain = null;
	engineOsc = null;
	noise = null;
	unlocked = false;
	muted = false;
	sfxOn = true;
	musicOn = true;
	lastMove = 0;
	lastWhoosh = 0;
	unlock() {
		if (!this.ctx) {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			this.ctx = new Ctx({ latencyHint: "interactive" });
			this.master = this.ctx.createGain();
			this.sfxBus = this.ctx.createGain();
			this.musicBus = this.ctx.createGain();
			this.sfxBus.connect(this.master);
			this.musicBus.connect(this.master);
			this.master.connect(this.ctx.destination);
			this.noise = this.makeNoise(this.ctx);
			this.applyGains();
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
		this.unlocked = true;
	}
	resume() {
		if (this.ctx?.state === "suspended") this.ctx.resume();
	}
	setMuted(muted) {
		this.muted = muted;
		this.applyGains();
	}
	setSfx(on) {
		this.sfxOn = on;
		this.applyGains();
	}
	setMusic(on) {
		this.musicOn = on;
		this.applyGains();
		if (!on) this.stopEngine();
	}
	applyGains() {
		if (!this.master || !this.sfxBus || !this.musicBus || !this.ctx) return;
		const now = this.ctx.currentTime;
		this.master.gain.setTargetAtTime(this.muted ? 0 : 1, now, .03);
		this.sfxBus.gain.setTargetAtTime(this.sfxOn ? .7 : 0, now, .03);
		this.musicBus.gain.setTargetAtTime(this.musicOn ? .45 : 0, now, .03);
	}
	makeNoise(ctx) {
		const buffer = ctx.createBuffer(1, ctx.sampleRate * .4, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		return buffer;
	}
	envGain(peak, attack, decay) {
		if (!this.ctx || !this.sfxBus) return null;
		const g = this.ctx.createGain();
		const t = this.ctx.currentTime;
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(peak, t + attack);
		g.gain.exponentialRampToValueAtTime(1e-4, t + attack + decay);
		g.connect(this.sfxBus);
		return g;
	}
	tone(freq, type, peak, attack, decay, detune = 0) {
		if (!this.canSfx() || !this.ctx) return;
		const osc = this.ctx.createOscillator();
		osc.type = type;
		osc.frequency.value = freq;
		osc.detune.value = detune;
		const g = this.envGain(peak, attack, decay);
		if (!g) return;
		osc.connect(g);
		osc.start();
		osc.stop(this.ctx.currentTime + attack + decay + .02);
		osc.onended = () => {
			osc.disconnect();
			g.disconnect();
		};
	}
	burst(peak, duration, highpass = 400) {
		if (!this.canSfx() || !this.ctx || !this.noise || !this.sfxBus) return;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noise;
		src.playbackRate.value = .85 + Math.random() * .3;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.value = highpass;
		const g = this.envGain(peak, .004, duration);
		if (!g) return;
		src.connect(filter);
		filter.connect(g);
		src.start();
		src.stop(this.ctx.currentTime + duration + .04);
		src.onended = () => {
			src.disconnect();
			filter.disconnect();
			g.disconnect();
		};
	}
	canSfx() {
		return this.unlocked && !this.muted && this.sfxOn && !!this.ctx;
	}
	playClick() {
		this.tone(880, "square", .08, .004, .06);
		this.tone(1320, "triangle", .04, .004, .05);
	}
	playStart() {
		this.tone(392, "sawtooth", .08, .01, .12);
		setTimeout(() => this.tone(523, "sawtooth", .09, .01, .12), 90);
		setTimeout(() => this.tone(659, "sawtooth", .1, .01, .18), 180);
		setTimeout(() => this.tone(784, "triangle", .08, .01, .22), 270);
	}
	playCountdown() {
		this.tone(520, "square", .07, .004, .1);
	}
	playGo() {
		this.tone(784, "sawtooth", .1, .006, .16);
		this.tone(1175, "triangle", .06, .006, .18);
	}
	playMove(nowMs) {
		if (nowMs - this.lastMove < 140) return;
		this.lastMove = nowMs;
		this.tone(220 + Math.random() * 40, "sine", .03, .01, .08, Math.random() * 20);
	}
	playWhoosh(nowMs) {
		if (nowMs - this.lastWhoosh < 220) return;
		this.lastWhoosh = nowMs;
		this.burst(.05, .08, 900);
	}
	playHit() {
		this.burst(.45, .28, 180);
		this.tone(90, "sawtooth", .22, .004, .32);
		this.tone(160, "square", .1, .004, .18);
	}
	playMilestone() {
		this.tone(659, "triangle", .1, .006, .12);
		setTimeout(() => this.tone(784, "triangle", .1, .006, .12), 70);
		setTimeout(() => this.tone(988, "triangle", .12, .006, .2), 140);
		setTimeout(() => this.tone(1318, "sine", .08, .006, .22), 210);
	}
	playGameOver() {
		this.tone(330, "sawtooth", .12, .01, .2);
		setTimeout(() => this.tone(247, "sawtooth", .12, .01, .24), 140);
		setTimeout(() => this.tone(185, "triangle", .14, .02, .4), 280);
	}
	playPause() {
		this.tone(440, "sine", .05, .006, .1);
	}
	playNearMiss() {
		this.tone(1400, "sine", .04, .003, .06);
	}
	startEngine() {
		if (!this.unlocked || this.muted || !this.musicOn || !this.ctx || !this.musicBus) return;
		this.stopEngine();
		const osc = this.ctx.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.value = 62;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 280;
		const g = this.ctx.createGain();
		g.gain.value = 1e-4;
		g.gain.setTargetAtTime(.035, this.ctx.currentTime, .25);
		osc.connect(filter);
		filter.connect(g);
		g.connect(this.musicBus);
		osc.start();
		this.engineOsc = osc;
		this.engineGain = g;
	}
	setEngineLevel(speed01) {
		if (!this.ctx || !this.engineGain || !this.engineOsc) return;
		const t = this.ctx.currentTime;
		this.engineOsc.frequency.setTargetAtTime(56 + speed01 * 38, t, .08);
		this.engineGain.gain.setTargetAtTime(this.musicOn && !this.muted ? .028 + speed01 * .03 : 0, t, .08);
	}
	stopEngine() {
		if (this.engineOsc) {
			try {
				this.engineOsc.stop();
			} catch {}
			this.engineOsc.disconnect();
			this.engineOsc = null;
		}
		if (this.engineGain) {
			this.engineGain.disconnect();
			this.engineGain = null;
		}
	}
};
function hitsObstacle(player, o) {
	if (!o.active) return false;
	if (o.kind === "laser") return hitsLaser(player, o);
	const dx = player.x - o.x;
	const dy = player.y - o.y;
	const r = player.radius + o.radius * .86;
	return dx * dx + dy * dy < r * r;
}
function hitsLaser(player, o) {
	const py = player.y;
	const half = o.height * .45;
	if (py + player.radius < o.y - half || py - player.radius > o.y + half) return false;
	const gapL = o.gapX - o.gapW * .5;
	const gapR = o.gapX + o.gapW * .5;
	const px = player.x;
	const pr = player.radius * .85;
	if (px + pr < gapL) return true;
	if (px - pr > gapR) return true;
	return false;
}
/** Swept circle vs circle to reduce tunneling at high speed. */
function sweptHit(player, o, prevX, prevY) {
	if (o.kind === "laser") return hitsObstacle(player, o);
	const steps = 3;
	for (let i = 1; i <= steps; i++) {
		const t = i / steps;
		const x = prevX + (player.x - prevX) * t;
		const y = prevY + (player.y - prevY) * t;
		const dx = x - o.x;
		const dy = y - o.y;
		const r = player.radius + o.radius * .86;
		if (dx * dx + dy * dy < r * r) return true;
	}
	return false;
}
function nearMiss(player, o) {
	if (!o.active || o.kind === "laser") return false;
	const dx = player.x - o.x;
	const dy = player.y - o.y;
	const d2 = dx * dx + dy * dy;
	const inner = player.radius + o.radius * .86;
	const outer = inner + 16;
	return d2 > inner * inner && d2 < outer * outer;
}
/**
* Unified input: keyboard, on-screen buttons, pointer-drag, and gamepad.
* Gameplay reads only `axis` (−1 left … +1 right) each frame.
*/
var GAME_CODES = /* @__PURE__ */ new Set([
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"ArrowDown",
	"KeyA",
	"KeyD",
	"KeyW",
	"KeyS",
	"Escape",
	"Space",
	"KeyP",
	"KeyM"
]);
var Input = class {
	keys = /* @__PURE__ */ new Set();
	synthetic = /* @__PURE__ */ new Set();
	syntheticSteer = null;
	buttonLeft = false;
	buttonRight = false;
	pointerX = null;
	pointers = /* @__PURE__ */ new Map();
	bound = false;
	pauseQueued = false;
	muteQueued = false;
	confirmQueued = false;
	axis = 0;
	attach(target) {
		if (this.bound) return;
		this.bound = true;
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.clearHeld);
		document.addEventListener("visibilitychange", this.onVis);
		target.addEventListener("pointerdown", this.onPointerDown);
		target.addEventListener("pointermove", this.onPointerMove);
		target.addEventListener("pointerup", this.onPointerUp);
		target.addEventListener("pointercancel", this.onPointerUp);
		window.addEventListener("gamepadconnected", this.noop);
	}
	detach(target) {
		if (!this.bound) return;
		this.bound = false;
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.clearHeld);
		document.removeEventListener("visibilitychange", this.onVis);
		target.removeEventListener("pointerdown", this.onPointerDown);
		target.removeEventListener("pointermove", this.onPointerMove);
		target.removeEventListener("pointerup", this.onPointerUp);
		target.removeEventListener("pointercancel", this.onPointerUp);
		window.removeEventListener("gamepadconnected", this.noop);
		this.clearHeld();
	}
	setHeld(side, down) {
		if (side === "left") this.buttonLeft = down;
		else this.buttonRight = down;
	}
	setKeys(codes) {
		this.synthetic = new Set(codes);
	}
	setSteer(value) {
		this.syntheticSteer = value;
	}
	clearSynthetic() {
		this.synthetic.clear();
		this.syntheticSteer = null;
	}
	sample(playerX, canvasWidth) {
		let axis = 0;
		const left = this.keys.has("KeyA") || this.keys.has("ArrowLeft") || this.synthetic.has("KeyA") || this.synthetic.has("ArrowLeft") || this.buttonLeft;
		const right = this.keys.has("KeyD") || this.keys.has("ArrowRight") || this.synthetic.has("KeyD") || this.synthetic.has("ArrowRight") || this.buttonRight;
		if (left) axis -= 1;
		if (right) axis += 1;
		const pad = this.readGamepad();
		axis += pad;
		if (this.syntheticSteer !== null) axis = -this.syntheticSteer;
		if (this.pointerX !== null && axis === 0) {
			const dx = this.pointerX - playerX;
			const dead = Math.max(10, canvasWidth * .018);
			if (Math.abs(dx) > dead) axis = Math.max(-1, Math.min(1, dx / (canvasWidth * .18)));
		}
		this.axis = Math.max(-1, Math.min(1, axis));
	}
	readGamepad() {
		const pads = navigator.getGamepads?.() ?? [];
		for (const pad of pads) {
			if (!pad) continue;
			let x = pad.axes[0] ?? 0;
			const mag = Math.abs(x);
			if (mag < .18) x = 0;
			else x = Math.sign(x) * ((mag - .18) / .82);
			if (pad.buttons[14]?.pressed) x -= 1;
			if (pad.buttons[15]?.pressed) x += 1;
			if (pad.buttons[9]?.pressed) this.pauseQueued = true;
			return Math.max(-1, Math.min(1, x));
		}
		return 0;
	}
	onKeyDown = (e) => {
		if (e.repeat && (e.code === "Escape" || e.code === "KeyP" || e.code === "KeyM")) return;
		this.keys.add(e.code);
		if (e.code === "Escape" || e.code === "KeyP") this.pauseQueued = true;
		if (e.code === "KeyM") this.muteQueued = true;
		if (e.code === "Enter" || e.code === "Space") this.confirmQueued = true;
		if (GAME_CODES.has(e.code)) e.preventDefault();
	};
	onKeyUp = (e) => {
		this.keys.delete(e.code);
	};
	onVis = () => {
		if (document.hidden) this.clearHeld();
	};
	clearHeld = () => {
		this.keys.clear();
		this.buttonLeft = false;
		this.buttonRight = false;
		this.pointerX = null;
		this.pointers.clear();
	};
	onPointerDown = (e) => {
		if (e.target?.closest("button, a, input, [role='dialog'], .jd-panel")) return;
		this.pointers.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		this.pointerX = this.localX(e);
	};
	onPointerMove = (e) => {
		if (!this.pointers.has(e.pointerId)) return;
		this.pointerX = this.localX(e);
	};
	onPointerUp = (e) => {
		this.pointers.delete(e.pointerId);
		if (this.pointers.size === 0) this.pointerX = null;
	};
	localX(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		return e.clientX - rect.left;
	}
	noop = () => {};
};
/** Small numeric helpers used across the sim and renderer. */
function clamp(value, min, max) {
	return value < min ? min : value > max ? max : value;
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
/** Frame-rate independent smoothing. k is the response speed. */
function damp(current, target, k, dt) {
	return lerp(current, target, 1 - Math.exp(-k * dt));
}
function rand(min, max) {
	return min + Math.random() * (max - min);
}
function randInt(min, max) {
	return Math.floor(rand(min, max + 1));
}
function pick(items) {
	return items[Math.floor(Math.random() * items.length)];
}
function wrap(value, max) {
	return (value % max + max) % max;
}
function formatScore(value) {
	return Math.max(0, Math.floor(value)).toString().padStart(6, "0");
}
function formatTime(seconds) {
	const s = Math.max(0, Math.floor(seconds));
	return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
var POOL$1 = 48;
function createObstaclePool() {
	const pool = [];
	for (let i = 0; i < POOL$1; i++) pool.push(emptyObstacle());
	return pool;
}
function emptyObstacle() {
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
		passed: false
	};
}
function resetObstacles(pool) {
	for (const o of pool) o.active = false;
}
function difficultyAt(time) {
	const t = Math.max(0, time);
	const ramp = 1 - Math.exp(-t / 42);
	const speed = 160 + ramp * 340;
	let name = "EASY";
	if (t >= 60) name = "EXTREME";
	else if (t >= 30) name = "HARD";
	else if (t >= 10) name = "NORMAL";
	const kinds = ["asteroid"];
	if (t >= 6) kinds.push("debris");
	if (t >= 14) kinds.push("energy");
	if (t >= 22) kinds.push("drone");
	if (t >= 36) kinds.push("laser");
	const spawnEvery = clamp(1.15 - ramp * .78, .34, 1.15);
	return {
		name,
		speed,
		spawnEvery,
		kinds,
		droneWeave: 40 + ramp * 70,
		laserChance: t < 36 ? 0 : .08 + Math.min(.18, (t - 36) / 80),
		scale: ramp
	};
}
function spawnObstacle(pool, w, diff, lastX) {
	let slot = null;
	for (const o of pool) if (!o.active) {
		slot = o;
		break;
	}
	if (!slot) return null;
	const kind = Math.random() < diff.laserChance && diff.kinds.includes("laser") ? "laser" : pick(diff.kinds);
	const o = slot;
	o.active = true;
	o.kind = kind;
	o.rot = rand(0, Math.PI * 2);
	o.rotSpeed = rand(-2.4, 2.4);
	o.phase = rand(0, Math.PI * 2);
	o.hue = rand(0, 360);
	o.seed = randInt(1, 9999);
	o.passed = false;
	o.vx = rand(-28, 28) * (.4 + diff.scale);
	o.vy = diff.speed * rand(.86, 1.14);
	o.y = -40;
	if (kind === "laser") {
		const gapW = clamp(108 - diff.scale * 38, 70, 120);
		let gapX = rand(gapW * .6, w - gapW * .6);
		if (Math.abs(gapX - lastX) < 40) gapX = clamp(lastX + (Math.random() > .5 ? 90 : -90), gapW, w - gapW);
		o.width = w;
		o.height = 14;
		o.radius = 8;
		o.gapW = gapW;
		o.gapX = gapX;
		o.x = w * .5;
		o.vx = 0;
		o.vy = diff.speed * .92;
		o.y = -20;
		return o;
	}
	const sizeBase = kind === "asteroid" ? rand(18, 32) : kind === "debris" ? rand(12, 22) : kind === "energy" ? rand(16, 24) : rand(14, 20);
	o.radius = sizeBase;
	o.width = sizeBase * 2;
	o.height = sizeBase * 2;
	let x = rand(36, w - 36);
	if (Math.abs(x - lastX) < 26) x = clamp(lastX + (x >= lastX ? 1 : -1) * rand(70, 140), 36, w - 36);
	o.x = x;
	if (kind === "drone") o.vx = rand(-40, 40);
	return o;
}
function updateObstacles(pool, dt, w, h, diff, playerY, onPassed) {
	for (let i = 0; i < pool.length; i++) {
		const o = pool[i];
		if (!o.active) continue;
		o.y += o.vy * dt;
		o.x += o.vx * dt;
		o.rot += o.rotSpeed * dt;
		o.phase += dt * (1.6 + diff.scale);
		if (o.kind === "drone") o.x += Math.sin(o.phase * 2.2) * diff.droneWeave * dt;
		if (o.kind === "energy") o.x += Math.sin(o.phase) * 18 * dt;
		o.x = clamp(o.x, 20, w - 20);
		if (!o.passed && o.y - o.radius > playerY + 8) {
			o.passed = true;
			onPassed();
		}
		if (o.y - Math.max(o.radius, o.height) > h + 40) o.active = false;
	}
}
function drawObstacles(ctx, pool, time, reduced) {
	for (let i = 0; i < pool.length; i++) {
		const o = pool[i];
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
			case "laser": drawLaser(ctx, o, time, reduced);
		}
	}
}
function hashed(seed, i) {
	const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
	return x - Math.floor(x);
}
function drawAsteroid(ctx, o, reduced) {
	ctx.save();
	ctx.translate(o.x, o.y);
	ctx.rotate(o.rot);
	const n = 8;
	ctx.beginPath();
	for (let i = 0; i < n; i++) {
		const a = i / n * Math.PI * 2;
		const r = o.radius * (.72 + hashed(o.seed, i) * .36);
		const x = Math.cos(a) * r;
		const y = Math.sin(a) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	const g = ctx.createRadialGradient(-o.radius * .3, -o.radius * .3, 4, 0, 0, o.radius);
	g.addColorStop(0, "#8b7d72");
	g.addColorStop(.6, "#4a433c");
	g.addColorStop(1, "#2a2520");
	ctx.fillStyle = g;
	ctx.fill();
	ctx.strokeStyle = "#c4b8aa";
	ctx.lineWidth = 1.2;
	ctx.stroke();
	if (!reduced) {
		ctx.fillStyle = "rgba(0,0,0,0.28)";
		ctx.beginPath();
		ctx.arc(-o.radius * .2, o.radius * .1, o.radius * .22, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
}
function drawDebris(ctx, o) {
	ctx.save();
	ctx.translate(o.x, o.y);
	ctx.rotate(o.rot);
	ctx.fillStyle = "#9aa7b8";
	ctx.strokeStyle = "#e8eef8";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(-o.radius, -o.radius * .3);
	ctx.lineTo(o.radius * .7, -o.radius * .6);
	ctx.lineTo(o.radius * .4, o.radius * .55);
	ctx.lineTo(-o.radius * .55, o.radius * .4);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.strokeStyle = "#38bdf8";
	ctx.globalAlpha = .7;
	ctx.beginPath();
	ctx.moveTo(-o.radius * .4, 0);
	ctx.lineTo(o.radius * .3, -o.radius * .15);
	ctx.stroke();
	ctx.restore();
}
function drawEnergy(ctx, o, time, reduced) {
	ctx.save();
	ctx.translate(o.x, o.y);
	ctx.rotate(o.rot * .4);
	const pulse = .7 + .3 * Math.sin(time * 6 + o.phase);
	if (!reduced) {
		ctx.globalCompositeOperation = "lighter";
		ctx.globalAlpha = .35 * pulse;
		ctx.fillStyle = "#c084fc";
		ctx.beginPath();
		ctx.roundRect(-o.radius * 1.4, -o.radius * 1.4, o.radius * 2.8, o.radius * 2.8, 8);
		ctx.fill();
	}
	ctx.globalCompositeOperation = "source-over";
	ctx.globalAlpha = 1;
	const g = ctx.createLinearGradient(-o.radius, -o.radius, o.radius, o.radius);
	g.addColorStop(0, "#e9d5ff");
	g.addColorStop(.5, "#a855f7");
	g.addColorStop(1, "#38bdf8");
	ctx.fillStyle = g;
	ctx.strokeStyle = "#f5d0fe";
	ctx.lineWidth = 1.4;
	ctx.beginPath();
	ctx.roundRect(-o.radius * .85, -o.radius * .85, o.radius * 1.7, o.radius * 1.7, 6);
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}
function drawDrone(ctx, o, time, reduced) {
	ctx.save();
	ctx.translate(o.x, o.y);
	const bank = Math.sin(o.phase * 2.2) * .35;
	ctx.rotate(bank);
	if (!reduced) {
		ctx.globalAlpha = .45;
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
	ctx.lineTo(o.radius * .85, -o.radius * .5);
	ctx.lineTo(0, -o.radius * .15);
	ctx.lineTo(-o.radius * .85, -o.radius * .5);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = `rgba(255, 80, 80, ${.6 + .4 * Math.sin(time * 10)})`;
	ctx.beginPath();
	ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}
function drawLaser(ctx, o, time, reduced) {
	const pulse = .65 + .35 * Math.sin(time * 14 + o.phase);
	const y = o.y;
	const h = o.height;
	const drawBeam = (x, w) => {
		if (w <= 0) return;
		if (!reduced) {
			ctx.globalAlpha = .25 * pulse;
			ctx.fillStyle = "#fb7185";
			ctx.fillRect(x, y - h, w, h * 2);
		}
		ctx.globalAlpha = .9;
		const g = ctx.createLinearGradient(0, y - h * .5, 0, y + h * .5);
		g.addColorStop(0, "rgba(251,113,133,0.1)");
		g.addColorStop(.5, `rgba(255, 80, 110, ${.85 * pulse})`);
		g.addColorStop(1, "rgba(251,113,133,0.1)");
		ctx.fillStyle = g;
		ctx.fillRect(x, y - h * .45, w, h * .9);
		ctx.globalAlpha = 1;
		ctx.fillStyle = "#ffe4e6";
		ctx.fillRect(x, y - 1.5, w, 3);
	};
	const leftW = o.gapX - o.gapW * .5;
	const rightX = o.gapX + o.gapW * .5;
	drawBeam(0, leftW);
	drawBeam(rightX, o.width - rightX);
	ctx.fillStyle = "#e8eef8";
	ctx.fillRect(leftW - 3, y - 8, 6, 16);
	ctx.fillRect(rightX - 3, y - 8, 6, 16);
}
var POOL = 420;
function createParticlePool() {
	const pool = [];
	for (let i = 0; i < POOL; i++) pool.push({
		active: false,
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		maxLife: 1,
		size: 2,
		color: "#fff",
		drag: .98,
		gravity: 0,
		spark: false
	});
	return pool;
}
function spawnParticle(pool, partial) {
	for (let i = 0; i < pool.length; i++) {
		const p = pool[i];
		if (p.active) continue;
		p.active = true;
		p.x = partial.x;
		p.y = partial.y;
		p.vx = partial.vx ?? 0;
		p.vy = partial.vy ?? 0;
		p.life = partial.life ?? .5;
		p.maxLife = partial.maxLife ?? p.life;
		p.size = partial.size ?? 2;
		p.color = partial.color ?? "#9ae6ff";
		p.drag = partial.drag ?? .985;
		p.gravity = partial.gravity ?? 0;
		p.spark = partial.spark ?? false;
		return;
	}
}
function burst(pool, x, y, count, colors, speed, reduced) {
	const n = reduced ? Math.ceil(count * .35) : count;
	for (let i = 0; i < n; i++) {
		const a = Math.random() * Math.PI * 2;
		const s = speed * (.35 + Math.random());
		spawnParticle(pool, {
			x,
			y,
			vx: Math.cos(a) * s,
			vy: Math.sin(a) * s,
			life: .35 + Math.random() * .55,
			maxLife: .9,
			size: 1.4 + Math.random() * 3.2,
			color: colors[i % colors.length],
			drag: .96,
			gravity: 40 + Math.random() * 80,
			spark: Math.random() > .55
		});
	}
}
function updateParticles(pool, dt) {
	for (let i = 0; i < pool.length; i++) {
		const p = pool[i];
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
function drawParticles(ctx, pool) {
	for (let i = 0; i < pool.length; i++) {
		const p = pool[i];
		if (!p.active) continue;
		const t = p.life / p.maxLife;
		ctx.globalAlpha = Math.max(0, t);
		ctx.fillStyle = p.color;
		if (p.spark) {
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(t * 6);
			ctx.fillRect(-p.size, -.6, p.size * 2, 1.2);
			ctx.restore();
		} else {
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * (.45 + t * .55), 0, Math.PI * 2);
			ctx.fill();
		}
	}
	ctx.globalAlpha = 1;
}
function createPlayer(w, h) {
	return {
		x: w * .5,
		y: h * .78,
		vx: 0,
		tilt: 0,
		bob: 0,
		width: 36,
		height: 48,
		radius: 13,
		alive: true
	};
}
function resetPlayer(p, w, h) {
	p.x = w * .5;
	p.y = h * .78;
	p.vx = 0;
	p.tilt = 0;
	p.bob = 0;
	p.alive = true;
}
function updatePlayer(p, axis, dt, w, h, speedScale, particles, reduced, moving) {
	p.y = h * .78;
	980 + speedScale * 220;
	const maxSpeed = 420 + speedScale * 140;
	const targetVx = axis * maxSpeed;
	p.vx = damp(p.vx, targetVx, axis !== 0 ? 14 : 10, dt);
	p.x += p.vx * dt;
	const pad = 28;
	p.x = clamp(p.x, pad, w - pad);
	if (p.x <= pad || p.x >= w - pad) p.vx *= .3;
	const tiltTarget = clamp(p.vx / maxSpeed, -1, 1) * .42;
	p.tilt = damp(p.tilt, tiltTarget, 12, dt);
	p.bob += dt * (2.4 + Math.abs(axis));
	if (moving && !reduced) {
		const count = Math.abs(axis) > .2 ? 2 : 1;
		for (let i = 0; i < count; i++) spawnParticle(particles, {
			x: p.x + (Math.random() - .5) * 8,
			y: p.y + 22 + Math.random() * 6,
			vx: (Math.random() - .5) * 30 - p.vx * .08,
			vy: 90 + Math.random() * 80,
			life: .22 + Math.random() * .18,
			maxLife: .4,
			size: 1.4 + Math.random() * 1.8,
			color: Math.random() > .5 ? "#7dd3fc" : "#38bdf8",
			drag: .94,
			gravity: 20
		});
	}
}
function drawPlayer(ctx, p, time, reduced, exploding) {
	if (!p.alive && exploding) return;
	const bob = Math.sin(p.bob) * 2.4;
	ctx.save();
	ctx.translate(p.x, p.y + bob);
	ctx.rotate(p.tilt);
	if (!reduced) {
		const pulse = .55 + .45 * Math.sin(time * 18);
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		ctx.globalAlpha = .55 * pulse;
		const eg = ctx.createRadialGradient(0, 24, 1, 0, 28, 28);
		eg.addColorStop(0, "rgba(125, 211, 252, 0.95)");
		eg.addColorStop(.4, "rgba(56, 189, 248, 0.35)");
		eg.addColorStop(1, "rgba(56, 189, 248, 0)");
		ctx.fillStyle = eg;
		ctx.beginPath();
		ctx.ellipse(0, 28, 10, 22, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
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
	const body = ctx.createLinearGradient(0, -24, 0, 20);
	body.addColorStop(0, "#e8f4ff");
	body.addColorStop(.25, "#9bd4f0");
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
	const cock = ctx.createLinearGradient(0, -14, 0, 2);
	cock.addColorStop(0, "#f0fbff");
	cock.addColorStop(.4, "#38bdf8");
	cock.addColorStop(1, "#0369a1");
	ctx.fillStyle = cock;
	ctx.beginPath();
	ctx.ellipse(0, -6, 4.2, 7.5, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "#e0f2fe";
	ctx.lineWidth = .8;
	ctx.stroke();
	ctx.fillStyle = "#38bdf8";
	ctx.beginPath();
	ctx.roundRect(-4, 16, 8, 6, 2);
	ctx.fill();
	ctx.fillStyle = reduced ? "#e0f2fe" : `rgba(255,255,255,${.7 + .3 * Math.sin(time * 22)})`;
	ctx.beginPath();
	ctx.roundRect(-2.2, 17, 4.4, 5, 1.4);
	ctx.fill();
	ctx.restore();
}
function createStars(w, h) {
	const stars = [];
	for (const layer of [
		{
			n: 70,
			z: .25,
			size: [.4, 1],
			speed: [12, 22]
		},
		{
			n: 50,
			z: .55,
			size: [.7, 1.6],
			speed: [28, 48]
		},
		{
			n: 28,
			z: 1,
			size: [1.1, 2.3],
			speed: [56, 92]
		}
	]) for (let i = 0; i < layer.n; i++) stars.push({
		x: Math.random() * w,
		y: Math.random() * h,
		z: layer.z,
		size: rand(layer.size[0], layer.size[1]),
		twinkle: Math.random() * Math.PI * 2,
		speed: rand(layer.speed[0], layer.speed[1])
	});
	return stars;
}
function updateStars(stars, dt, w, h, speedScale, playing) {
	const drift = playing ? speedScale : .28;
	for (let i = 0; i < stars.length; i++) {
		const s = stars[i];
		s.y += s.speed * drift * dt;
		s.twinkle += dt * (1.4 + s.z);
		if (s.y > h + 4) {
			s.y = -4;
			s.x = Math.random() * w;
		}
		s.x = wrap(s.x, w);
	}
}
function drawStars(ctx, stars, w, h, reduced, t) {
	const g = ctx.createLinearGradient(0, 0, 0, h);
	g.addColorStop(0, "#050814");
	g.addColorStop(.45, "#070b16");
	g.addColorStop(1, "#0a101c");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);
	ctx.save();
	ctx.globalAlpha = .18;
	const neb = ctx.createRadialGradient(w * .7, h * .15, 20, w * .7, h * .15, w * .7);
	neb.addColorStop(0, "#1b3a66");
	neb.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = neb;
	ctx.fillRect(0, 0, w, h);
	const neb2 = ctx.createRadialGradient(w * .2, h * .8, 10, w * .2, h * .8, w * .55);
	neb2.addColorStop(0, "#24143a");
	neb2.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = neb2;
	ctx.fillRect(0, 0, w, h);
	ctx.restore();
	for (let i = 0; i < stars.length; i++) {
		const s = stars[i];
		const tw = reduced ? 1 : .55 + .45 * Math.sin(s.twinkle + t);
		ctx.globalAlpha = .35 + .65 * tw * s.z;
		ctx.fillStyle = s.z > .8 ? "#e8f4ff" : s.z > .4 ? "#c9d9f0" : "#8ea0bf";
		ctx.beginPath();
		ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
		ctx.fill();
		if (!reduced && s.z > .85 && tw > .85) {
			ctx.globalAlpha = .18 * tw;
			ctx.beginPath();
			ctx.arc(s.x, s.y, s.size * 3.4, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	ctx.globalAlpha = 1;
}
var DEFAULT_PREFS = {
	version: 1,
	muted: false,
	sfx: true,
	music: true,
	reducedFx: false,
	highScore: 0
};
var MILESTONES = [
	1e3,
	5e3,
	1e4,
	25e3,
	5e4,
	1e5
];
var KEY = "jet-dodge:save:v1";
var BACKUP_KEY = "jet-dodge:save:backup";
function migrate(raw) {
	const next = {
		...DEFAULT_PREFS,
		...raw,
		version: 1
	};
	if (typeof next.highScore !== "number" || !Number.isFinite(next.highScore)) next.highScore = 0;
	next.highScore = Math.max(0, Math.floor(next.highScore));
	next.muted = Boolean(next.muted);
	next.sfx = next.sfx !== false;
	next.music = next.music !== false;
	next.reducedFx = Boolean(next.reducedFx);
	return next;
}
function loadPrefs() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...DEFAULT_PREFS };
		return migrate(JSON.parse(raw));
	} catch {
		try {
			const backup = localStorage.getItem(BACKUP_KEY);
			if (backup) return migrate(JSON.parse(backup));
		} catch {}
		return { ...DEFAULT_PREFS };
	}
}
function savePrefs(prefs) {
	const payload = JSON.stringify({
		...prefs,
		version: 1
	});
	try {
		const previous = localStorage.getItem(KEY);
		if (previous) localStorage.setItem(BACKUP_KEY, previous);
		localStorage.setItem(KEY, payload);
	} catch {}
}
function el(tag, className, attrs) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
	return node;
}
function icon(path) {
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
var ICONS = {
	play: "M7 4.5v15l13-7.5L7 4.5z",
	pause: "M8 5v14M16 5v14",
	home: "M4 11.5 12 4l8 7.5V20H4z",
	mute: "M11 6 6 10H3v4h3l5 4V6zm7 3-6 6m0-6 6 6",
	sound: "M11 6 6 10H3v4h3l5 4V6zm5.5 1.5a6 6 0 0 1 0 9M15 9.5a3.5 3.5 0 0 1 0 5",
	settings: "M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zM12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4"
};
function buildUi(host) {
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
	const muteBtn = hud.querySelector("[data-mute]");
	const pauseBtn = hud.querySelector("[data-pause]");
	muteBtn.appendChild(icon(ICONS.sound));
	pauseBtn.appendChild(icon(ICONS.pause));
	const home = screen("home", buildHome());
	const how = screen("how", buildHow());
	const settings = screen("settings", buildSettings());
	const pause = screen("pause", buildPause());
	const over = screen("over", buildOver());
	const countdown = el("div", "jd-countdown", {
		hidden: "",
		"aria-live": "assertive"
	});
	const toast = el("div", "jd-toast", {
		hidden: "",
		"aria-live": "polite"
	});
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
		score: hud.querySelector("[data-score]"),
		high: hud.querySelector("[data-high]"),
		time: hud.querySelector("[data-time]"),
		diff: hud.querySelector("[data-diff]"),
		screens: {
			home,
			how,
			settings,
			pause,
			over
		},
		countdown,
		touch,
		overScore: over.querySelector("[data-over-score]"),
		overBest: over.querySelector("[data-over-best]"),
		muteBtn,
		pauseBtn,
		toast
	};
}
function screen(name, inner) {
	const wrap = el("div", `jd-screen jd-screen-${name}`, { hidden: "" });
	wrap.setAttribute("role", name === "home" ? "main" : "dialog");
	if (name !== "home") wrap.setAttribute("aria-modal", "true");
	wrap.appendChild(inner);
	return wrap;
}
function buildHome() {
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
function buildHow() {
	const panel = el("div", "jd-panel");
	panel.innerHTML = `
    <h2 class="jd-panel-title">How to Play</h2>
    <p class="jd-panel-lead">Stay alive. The void does not slow down.</p>
    <ul class="jd-list">
      <li><strong>Objective.</strong> Fly upward and dodge everything that falls.</li>
      <li><strong>Score.</strong> Survival time plus cleared hazards.</li>
      <li><strong>Difficulty.</strong> Speed, spawn rate, and hazard types climb over time.</li>
    </ul>
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
function buildSettings() {
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
function buildPause() {
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
function buildOver() {
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
function setScreen(refs, state) {
	const map = {
		home: "home",
		how: "how",
		settings: "settings",
		countdown: null,
		playing: null,
		paused: "pause",
		over: "over"
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
function paintHud(refs, score, high, time, diff, muted, milestone) {
	refs.score.textContent = formatScore(score);
	refs.high.textContent = formatScore(high);
	refs.time.textContent = formatTime(time);
	refs.diff.textContent = diff;
	refs.diff.dataset.tier = diff;
	refs.score.classList.toggle("is-flash", milestone);
	refs.muteBtn.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
	refs.muteBtn.replaceChildren(icon(muted ? ICONS.mute : ICONS.sound));
}
function paintOver(refs, score, best) {
	refs.overScore.textContent = formatScore(score);
	refs.overBest.textContent = formatScore(best);
}
function showToast(refs, text) {
	refs.toast.hidden = false;
	refs.toast.textContent = text;
	refs.toast.classList.remove("is-in");
	refs.toast.offsetWidth;
	refs.toast.classList.add("is-in");
}
var STEP = 1 / 60;
var MAX_ACC = .25;
var Game = class {
	host;
	ui;
	input = new Input();
	audio = new GameAudio();
	prefs;
	stars = createStars(800, 1200);
	particles = createParticlePool();
	obstacles = createObstaclePool();
	player = createPlayer(800, 1200);
	pops = [];
	state = "home";
	raf = 0;
	last = 0;
	acc = 0;
	time = 0;
	score = 0;
	displayScore = 0;
	spawnT = 0;
	lastSpawnX = 400;
	countdown = 3;
	countdownShown = "";
	shake = 0;
	hitstop = 0;
	flash = 0;
	w = 800;
	h = 1200;
	reduced = false;
	milestoneFlash = 0;
	nextMilestone = 1e3;
	deadTimer = 0;
	pendingOver = false;
	lastNear = 0;
	running = false;
	ro = null;
	constructor(host) {
		this.host = host;
		this.prefs = loadPrefs();
		this.ui = buildUi(host);
		this.audio.setMuted(this.prefs.muted);
		this.audio.setSfx(this.prefs.sfx);
		this.audio.setMusic(this.prefs.music);
		this.reduced = this.prefs.reducedFx || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
	destroy() {
		this.running = false;
		cancelAnimationFrame(this.raf);
		this.ro?.disconnect();
		this.input.detach(this.ui.root);
		this.audio.stopEngine();
		document.removeEventListener("visibilitychange", this.onVis);
		this.host.replaceChildren();
	}
	bind() {
		this.ui.root.addEventListener("click", this.onClick);
		this.ui.root.addEventListener("pointerdown", this.onPointerUnlock, { capture: true });
		this.ui.pauseBtn.addEventListener("click", () => this.togglePause());
		this.ui.muteBtn.addEventListener("click", () => this.toggleMute());
		const left = this.ui.touch.querySelector("[data-left]");
		const right = this.ui.touch.querySelector("[data-right]");
		const hold = (btn, side) => {
			const down = (e) => {
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
		this.ui.screens.settings.querySelectorAll("[data-pref]").forEach((input) => {
			input.addEventListener("change", () => {
				const key = input.dataset.pref;
				if (key === "muted") this.prefs.muted = input.checked;
				if (key === "sfx") this.prefs.sfx = input.checked;
				if (key === "music") this.prefs.music = input.checked;
				if (key === "reducedFx") this.prefs.reducedFx = input.checked;
				this.applyPrefs();
			});
		});
		document.addEventListener("visibilitychange", this.onVis);
	}
	onPointerUnlock = () => {
		this.audio.unlock();
	};
	onClick = (e) => {
		const btn = e.target.closest("[data-action]");
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
	onVis = () => {
		if (document.hidden) {
			this.audio.stopEngine();
			if (this.state === "playing") this.pause();
		} else this.audio.resume();
	};
	applyPrefs() {
		this.audio.setMuted(this.prefs.muted);
		this.audio.setSfx(this.prefs.sfx);
		this.audio.setMusic(this.prefs.music);
		this.reduced = this.prefs.reducedFx || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		savePrefs(this.prefs);
		this.syncSettingsForm();
		paintHud(this.ui, this.displayScore, this.prefs.highScore, this.time, difficultyAt(this.time).name, this.prefs.muted, this.milestoneFlash > 0);
	}
	syncSettingsForm() {
		const form = this.ui.screens.settings;
		const muted = form.querySelector("[data-pref=\"muted\"]");
		const sfx = form.querySelector("[data-pref=\"sfx\"]");
		const music = form.querySelector("[data-pref=\"music\"]");
		const fx = form.querySelector("[data-pref=\"reducedFx\"]");
		if (muted) muted.checked = this.prefs.muted;
		if (sfx) sfx.checked = this.prefs.sfx;
		if (music) music.checked = this.prefs.music;
		if (fx) fx.checked = this.prefs.reducedFx;
	}
	go(state) {
		if (state === "home") {
			this.resetWorld(false);
			this.audio.stopEngine();
		}
		this.state = state;
		setScreen(this.ui, state);
		if (state === "home") this.ui.screens.home.querySelector("[data-action=\"play\"]")?.focus();
	}
	startRun() {
		this.resetWorld(true);
		this.state = "countdown";
		this.countdown = 3;
		this.countdownShown = "";
		setScreen(this.ui, "countdown");
		this.audio.playStart();
		this.audio.startEngine();
	}
	resetWorld(forPlay) {
		resetPlayer(this.player, this.w, this.h);
		resetObstacles(this.obstacles);
		for (const p of this.particles) p.active = false;
		this.pops.length = 0;
		this.time = 0;
		this.score = 0;
		this.displayScore = 0;
		this.spawnT = .4;
		this.lastSpawnX = this.w * .5;
		this.shake = 0;
		this.hitstop = 0;
		this.flash = 0;
		this.deadTimer = 0;
		this.pendingOver = false;
		this.milestoneFlash = 0;
		this.nextMilestone = MILESTONES[0];
		this.player.alive = true;
		if (!forPlay) this.audio.stopEngine();
	}
	pause() {
		if (this.state !== "playing") return;
		this.state = "paused";
		setScreen(this.ui, "paused");
		this.audio.playPause();
		this.audio.stopEngine();
	}
	resume() {
		if (this.state !== "paused") return;
		this.state = "playing";
		setScreen(this.ui, "playing");
		this.audio.startEngine();
	}
	togglePause() {
		this.audio.unlock();
		if (this.state === "playing") this.pause();
		else if (this.state === "paused") this.resume();
	}
	toggleMute() {
		this.audio.unlock();
		this.prefs.muted = !this.prefs.muted;
		this.applyPrefs();
		this.audio.playClick();
	}
	resize = () => {
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
		this.player.y = this.h * .78;
		if (this.stars.length) {} else this.stars = createStars(this.w, this.h);
	};
	frame = (now) => {
		if (!this.running) return;
		this.raf = requestAnimationFrame(this.frame);
		let dt = (now - this.last) / 1e3;
		this.last = now;
		if (!Number.isFinite(dt) || dt < 0) dt = STEP;
		dt = Math.min(dt, .1);
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
		const speedScale = .35 + difficultyAt(this.time).scale;
		if (starsOn) updateStars(this.stars, dt, this.w, this.h, speedScale, simOn && this.state === "playing");
		if (this.hitstop > 0) {
			this.hitstop -= dt;
			this.render(now / 1e3);
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
			if (this.deadTimer > .85) {
				this.pendingOver = false;
				this.finishOver();
			}
		}
		this.render(now / 1e3);
	};
	step(dt, now) {
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
			if (this.countdown <= -.28) {
				this.state = "playing";
				setScreen(this.ui, "playing");
			}
			updatePlayer(this.player, this.input.axis, dt, this.w, this.h, .2, this.particles, this.reduced, true);
			updateParticles(this.particles, dt);
			return;
		}
		if (!playing) {
			updateParticles(this.particles, dt);
			return;
		}
		const prevX = this.player.x;
		const prevY = this.player.y;
		const diff = difficultyAt(this.time);
		this.time += dt;
		this.score += dt * (110 + diff.scale * 90);
		if (Math.abs(this.input.axis) > .15) this.audio.playMove(now);
		updatePlayer(this.player, this.input.axis, dt, this.w, this.h, diff.scale, this.particles, this.reduced, this.player.alive);
		this.spawnT -= dt;
		if (this.spawnT <= 0 && this.player.alive) {
			const spawned = spawnObstacle(this.obstacles, this.w, diff, this.lastSpawnX);
			if (spawned) {
				this.lastSpawnX = spawned.kind === "laser" ? spawned.gapX : spawned.x;
				this.spawnT = diff.spawnEvery * (.82 + Math.random() * .36);
			}
		}
		updateObstacles(this.obstacles, dt, this.w, this.h, diff, this.player.y, () => {
			this.score += 28 + diff.scale * 20;
		});
		updateParticles(this.particles, dt);
		this.audio.setEngineLevel(diff.scale);
		if (this.player.alive) for (const o of this.obstacles) {
			if (!o.active) continue;
			if (nearMiss(this.player, o) && now - this.lastNear > 280) {
				this.lastNear = now;
				this.score += 12;
				this.pops.push({
					x: this.player.x,
					y: this.player.y - 36,
					text: "+12",
					life: .6,
					maxLife: .6
				});
				this.audio.playNearMiss();
			}
			if (sweptHit(this.player, o, prevX, prevY) || hitsObstacle(this.player, o)) {
				this.crash(o);
				break;
			}
		}
		while (this.score >= this.nextMilestone) {
			this.onMilestone(this.nextMilestone);
			const idx = MILESTONES.indexOf(this.nextMilestone);
			this.nextMilestone = idx >= 0 && idx < MILESTONES.length - 1 ? MILESTONES[idx + 1] : this.nextMilestone * 2;
		}
		for (let i = this.pops.length - 1; i >= 0; i--) {
			const p = this.pops[i];
			p.life -= dt;
			p.y -= 28 * dt;
			if (p.life <= 0) this.pops.splice(i, 1);
		}
	}
	crash(o) {
		this.player.alive = false;
		this.pendingOver = true;
		this.deadTimer = 0;
		this.hitstop = this.reduced ? .04 : .12;
		this.shake = this.reduced ? .25 : .85;
		this.flash = .55;
		this.audio.playHit();
		this.audio.stopEngine();
		burst(this.particles, this.player.x, this.player.y, this.reduced ? 18 : 52, [
			"#7dd3fc",
			"#e8eef8",
			"#38bdf8",
			"#fb7185",
			"#fda4af"
		], 280, this.reduced);
		burst(this.particles, o.x, o.y, 12, ["#9aa7b8", "#e8eef8"], 160, this.reduced);
		if (this.score > this.prefs.highScore) {
			this.prefs.highScore = Math.floor(this.score);
			savePrefs(this.prefs);
		}
	}
	finishOver() {
		this.state = "over";
		setScreen(this.ui, "over");
		paintOver(this.ui, this.score, this.prefs.highScore);
		this.audio.playGameOver();
		this.ui.screens.over.querySelector("[data-action=\"restart\"]")?.focus();
	}
	onMilestone(value) {
		this.milestoneFlash = .8;
		this.audio.playMilestone();
		if (!this.reduced) this.shake = Math.max(this.shake, .22);
		showToast(this.ui, `${formatScore(value)} reached`);
		for (let i = 0; i < (this.reduced ? 6 : 16); i++) spawnParticle(this.particles, {
			x: this.player.x + (Math.random() - .5) * 40,
			y: this.player.y - 20,
			vx: (Math.random() - .5) * 80,
			vy: -40 - Math.random() * 80,
			life: .5,
			maxLife: .5,
			size: 2,
			color: "#7dd3fc",
			gravity: 30,
			spark: true
		});
	}
	render(t) {
		const ctx = this.ui.canvas.getContext("2d");
		if (!ctx) return;
		ctx.save();
		if (this.shake > 0 && !this.reduced) {
			const mag = this.shake * this.shake * 14;
			ctx.translate((Math.random() - .5) * mag, (Math.random() - .5) * mag);
			ctx.rotate((Math.random() - .5) * mag / 400);
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
			ctx.fillStyle = `rgba(255, 230, 230, ${this.flash * .28})`;
			ctx.fillRect(0, 0, this.w, this.h);
		}
		const vig = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * .2, this.w / 2, this.h / 2, this.h * .75);
		vig.addColorStop(0, "rgba(0,0,0,0)");
		vig.addColorStop(1, "rgba(0,0,0,0.38)");
		ctx.fillStyle = vig;
		ctx.fillRect(0, 0, this.w, this.h);
		ctx.restore();
		paintHud(this.ui, this.displayScore, this.prefs.highScore, this.time, difficultyAt(this.time).name, this.prefs.muted, this.milestoneFlash > 0);
	}
	installControlsTest() {
		window.__controlsTest = {
			getYaw: () => -this.player.x / 80,
			getSpeed: () => this.state === "playing" || this.state === "countdown" ? 1 : 0,
			setKeys: (codes) => {
				this.input.setKeys(codes);
				if (this.state === "home" || this.state === "over") this.startRun();
			},
			setSteer: (v) => this.input.setSteer(v)
		};
	}
};
function createGame(host) {
	const game = new Game(host);
	return { destroy: () => game.destroy() };
}
function Home() {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const host = ref.current;
		if (!host) return;
		const game = createGame(host);
		return () => game.destroy();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "h-dvh w-full overflow-hidden bg-bg text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref,
			className: "h-full w-full"
		})
	});
}
//#endregion
export { Home as component };
