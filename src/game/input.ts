/**
 * Unified input: keyboard, on-screen buttons, pointer-drag, and gamepad.
 * Gameplay reads only `axis` (−1 left … +1 right) each frame.
 */

const GAME_CODES = new Set([
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
  "KeyM",
]);

export class Input {
  private keys = new Set<string>();
  private synthetic = new Set<string>();
  private syntheticSteer: number | null = null;
  private buttonLeft = false;
  private buttonRight = false;
  private pointerX: number | null = null;
  private pointers = new Map<number, { x: number; y: number }>();
  private bound = false;
  pauseQueued = false;
  muteQueued = false;
  confirmQueued = false;
  axis = 0;

  attach(target: HTMLElement): void {
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

  detach(target: HTMLElement): void {
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

  setHeld(side: "left" | "right", down: boolean): void {
    if (side === "left") this.buttonLeft = down;
    else this.buttonRight = down;
  }

  setKeys(codes: string[]): void {
    this.synthetic = new Set(codes);
  }

  setSteer(value: number): void {
    this.syntheticSteer = value;
  }

  clearSynthetic(): void {
    this.synthetic.clear();
    this.syntheticSteer = null;
  }

  sample(playerX: number, canvasWidth: number): void {
    let axis = 0;
    const left =
      this.keys.has("KeyA") ||
      this.keys.has("ArrowLeft") ||
      this.synthetic.has("KeyA") ||
      this.synthetic.has("ArrowLeft") ||
      this.buttonLeft;
    const right =
      this.keys.has("KeyD") ||
      this.keys.has("ArrowRight") ||
      this.synthetic.has("KeyD") ||
      this.synthetic.has("ArrowRight") ||
      this.buttonRight;
    if (left) axis -= 1;
    if (right) axis += 1;

    const pad = this.readGamepad();
    axis += pad;

    if (this.syntheticSteer !== null) {
      // +steer is player-left (controls skill). Convert to screen axis.
      axis = -this.syntheticSteer;
    }

    if (this.pointerX !== null && axis === 0) {
      const dx = this.pointerX - playerX;
      const dead = Math.max(10, canvasWidth * 0.018);
      if (Math.abs(dx) > dead) axis = Math.max(-1, Math.min(1, dx / (canvasWidth * 0.18)));
    }

    this.axis = Math.max(-1, Math.min(1, axis));
  }

  private readGamepad(): number {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad) continue;
      let x = pad.axes[0] ?? 0;
      const mag = Math.abs(x);
      if (mag < 0.18) x = 0;
      else x = Math.sign(x) * ((mag - 0.18) / 0.82);
      if (pad.buttons[14]?.pressed) x -= 1;
      if (pad.buttons[15]?.pressed) x += 1;
      if (pad.buttons[9]?.pressed) this.pauseQueued = true;
      return Math.max(-1, Math.min(1, x));
    }
    return 0;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat && (e.code === "Escape" || e.code === "KeyP" || e.code === "KeyM")) return;
    this.keys.add(e.code);
    if (e.code === "Escape" || e.code === "KeyP") this.pauseQueued = true;
    if (e.code === "KeyM") this.muteQueued = true;
    if (e.code === "Enter" || e.code === "Space") this.confirmQueued = true;
    if (GAME_CODES.has(e.code)) e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onVis = (): void => {
    if (document.hidden) this.clearHeld();
  };

  private clearHeld = (): void => {
    this.keys.clear();
    this.buttonLeft = false;
    this.buttonRight = false;
    this.pointerX = null;
    this.pointers.clear();
  };

  private onPointerDown = (e: PointerEvent): void => {
    const el = e.target as HTMLElement | null;
    if (el?.closest("button, a, input, [role='dialog'], .jd-panel")) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.pointerX = this.localX(e);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointerX = this.localX(e);
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) this.pointerX = null;
  };

  private localX(e: PointerEvent): number {
    const host = e.currentTarget as HTMLElement;
    const rect = host.getBoundingClientRect();
    return e.clientX - rect.left;
  }

  private noop = (): void => {
    /* gamepad connected — polled each frame */
  };
}
