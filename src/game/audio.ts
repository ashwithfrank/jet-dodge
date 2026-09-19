/**
 * Procedural SFX via Web Audio. Unlocked on the first user gesture.
 * No external audio files — works fully offline after the page loads.
 */

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private noise: AudioBuffer | null = null;
  private unlocked = false;
  muted = false;
  sfxOn = true;
  musicOn = true;
  private lastMove = 0;
  private lastWhoosh = 0;

  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    this.unlocked = true;
  }

  resume(): void {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGains();
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
    this.applyGains();
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    this.applyGains();
    if (!on) this.stopEngine();
  }

  private applyGains(): void {
    if (!this.master || !this.sfxBus || !this.musicBus || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.03);
    this.sfxBus.gain.setTargetAtTime(this.sfxOn ? 0.7 : 0, now, 0.03);
    this.musicBus.gain.setTargetAtTime(this.musicOn ? 0.45 : 0, now, 0.03);
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private envGain(peak: number, attack: number, decay: number): GainNode | null {
    if (!this.ctx || !this.sfxBus) return null;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(this.sfxBus);
    return g;
  }

  private tone(freq: number, type: OscillatorType, peak: number, attack: number, decay: number, detune = 0): void {
    if (!this.canSfx() || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = this.envGain(peak, attack, decay);
    if (!g) return;
    osc.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + attack + decay + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private burst(peak: number, duration: number, highpass = 400): void {
    if (!this.canSfx() || !this.ctx || !this.noise || !this.sfxBus) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.85 + Math.random() * 0.3;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = highpass;
    const g = this.envGain(peak, 0.004, duration);
    if (!g) return;
    src.connect(filter);
    filter.connect(g);
    src.start();
    src.stop(this.ctx.currentTime + duration + 0.04);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  private canSfx(): boolean {
    return this.unlocked && !this.muted && this.sfxOn && !!this.ctx;
  }

  playClick(): void {
    this.tone(880, "square", 0.08, 0.004, 0.06);
    this.tone(1320, "triangle", 0.04, 0.004, 0.05);
  }

  playStart(): void {
    this.tone(392, "sawtooth", 0.08, 0.01, 0.12);
    setTimeout(() => this.tone(523, "sawtooth", 0.09, 0.01, 0.12), 90);
    setTimeout(() => this.tone(659, "sawtooth", 0.1, 0.01, 0.18), 180);
    setTimeout(() => this.tone(784, "triangle", 0.08, 0.01, 0.22), 270);
  }

  playCountdown(): void {
    this.tone(520, "square", 0.07, 0.004, 0.1);
  }

  playGo(): void {
    this.tone(784, "sawtooth", 0.1, 0.006, 0.16);
    this.tone(1175, "triangle", 0.06, 0.006, 0.18);
  }

  playMove(nowMs: number): void {
    if (nowMs - this.lastMove < 140) return;
    this.lastMove = nowMs;
    this.tone(220 + Math.random() * 40, "sine", 0.03, 0.01, 0.08, Math.random() * 20);
  }

  playWhoosh(nowMs: number): void {
    if (nowMs - this.lastWhoosh < 220) return;
    this.lastWhoosh = nowMs;
    this.burst(0.05, 0.08, 900);
  }

  playHit(): void {
    this.burst(0.45, 0.28, 180);
    this.tone(90, "sawtooth", 0.22, 0.004, 0.32);
    this.tone(160, "square", 0.1, 0.004, 0.18);
  }

  playMilestone(): void {
    this.tone(659, "triangle", 0.1, 0.006, 0.12);
    setTimeout(() => this.tone(784, "triangle", 0.1, 0.006, 0.12), 70);
    setTimeout(() => this.tone(988, "triangle", 0.12, 0.006, 0.2), 140);
    setTimeout(() => this.tone(1318, "sine", 0.08, 0.006, 0.22), 210);
  }

  playGameOver(): void {
    this.tone(330, "sawtooth", 0.12, 0.01, 0.2);
    setTimeout(() => this.tone(247, "sawtooth", 0.12, 0.01, 0.24), 140);
    setTimeout(() => this.tone(185, "triangle", 0.14, 0.02, 0.4), 280);
  }

  playPause(): void {
    this.tone(440, "sine", 0.05, 0.006, 0.1);
  }

  playNearMiss(): void {
    this.tone(1400, "sine", 0.04, 0.003, 0.06);
  }

  startEngine(): void {
    if (!this.unlocked || this.muted || !this.musicOn || !this.ctx || !this.musicBus) return;
    this.stopEngine();
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 62;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 280;
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.035, this.ctx.currentTime, 0.25);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.musicBus);
    osc.start();
    this.engineOsc = osc;
    this.engineGain = g;
  }

  setEngineLevel(speed01: number): void {
    if (!this.ctx || !this.engineGain || !this.engineOsc) return;
    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(56 + speed01 * 38, t, 0.08);
    this.engineGain.gain.setTargetAtTime(this.musicOn && !this.muted ? 0.028 + speed01 * 0.03 : 0, t, 0.08);
  }

  stopEngine(): void {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
      } catch {
        /* already stopped */
      }
      this.engineOsc.disconnect();
      this.engineOsc = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
  }
}
