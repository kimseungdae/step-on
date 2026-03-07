import type { EasingFn, EventCallback } from "./types";
import { clamp } from "./math";

export abstract class Playable {
  startTime = 0;
  duration = 0;
  delay = 0;
  repeat = 0;
  yoyo = false;
  parent: Playable | null = null;

  protected _progress = 0;
  protected _active = false;
  protected _reversed = false;
  protected _started = false;
  protected _completed = false;
  protected _ease: EasingFn = (t) => t;

  protected _onStart?: () => void;
  protected _onUpdate?: (progress: number) => void;
  protected _onComplete?: () => void;

  abstract render(parentTime: number): void;

  totalDuration(): number {
    return this.delay + this.duration * (1 + this.repeat);
  }

  get progress(): number {
    return this._progress;
  }

  get isActive(): boolean {
    return this._active;
  }

  protected _calcProgress(parentTime: number): number | null {
    const localTime = parentTime - this.startTime - this.delay;

    if (localTime < 0) {
      this._active = false;
      return null;
    }

    const totalRepeats = this.repeat + 1;
    const raw = localTime / this.duration;

    if (raw >= totalRepeats) {
      this._active = false;
      if (!this._completed) {
        this._completed = true;
        this._onComplete?.();
      }
      return this.yoyo && totalRepeats % 2 === 0 ? 0 : 1;
    }

    this._active = true;

    if (!this._started) {
      this._started = true;
      this._onStart?.();
    }

    const iteration = Math.floor(raw);
    let t = raw - iteration;

    if (this.yoyo && iteration % 2 === 1) {
      t = 1 - t;
    }

    return clamp(t, 0, 1);
  }

  reset(): void {
    this._progress = 0;
    this._active = false;
    this._started = false;
    this._completed = false;
  }
}
