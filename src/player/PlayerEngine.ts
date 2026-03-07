import { Ticker } from "../engine/Ticker";
import { Timeline } from "../engine/Timeline";
import type { Stage } from "../stage/Stage";
import type { MarkerData, EventName, EventCallback } from "../engine/types";
import { StepNavigator } from "./StepNavigator";

export interface PlayerConfig {
  timeline: Timeline;
  stage: Stage;
}

export class PlayerEngine {
  readonly timeline: Timeline;
  readonly stage: Stage;
  readonly stepNav: StepNavigator;

  private _ticker: Ticker;
  private _currentTime = 0;
  private _playing = false;
  private _reversed = false;
  private _events = new Map<EventName, Set<EventCallback>>();

  constructor(config: PlayerConfig) {
    this.timeline = config.timeline;
    this.stage = config.stage;
    this.stepNav = new StepNavigator();
    this.stepNav.setMarkers(this.timeline.markers);
    this._ticker = new Ticker();
    this._ticker.add(this._tick);
  }

  play(): void {
    if (this._playing) return;
    this._playing = true;
    this._reversed = false;
    this._ticker.resume();
    this._ticker.start();
    this._emit("play");
  }

  pause(): void {
    if (!this._playing) return;
    this._playing = false;
    this._ticker.pause();
    this._emit("pause");
  }

  stop(): void {
    this._playing = false;
    this._currentTime = 0;
    this._ticker.stop();
    this.timeline.reset();
    this.stage.clear();
    this._emit("stop");
  }

  reverse(): void {
    this._reversed = !this._reversed;
    if (!this._playing) {
      this._playing = true;
      this._ticker.resume();
      this._ticker.start();
    }
  }

  seek(time: number): void {
    const total = this.timeline.totalDuration();
    this._currentTime = Math.max(0, Math.min(time, total));
    this._renderFrame();
    this._emit("seek");
  }

  seekProgress(p: number): void {
    this.seek(p * this.timeline.totalDuration());
  }

  set speed(value: number) {
    this._ticker.speed = value;
  }

  get speed(): number {
    return this._ticker.speed;
  }

  nextStep(): void {
    const next = this.stepNav.nextTime(this._currentTime);
    if (next !== null) this.seek(next);
  }

  prevStep(): void {
    const prev = this.stepNav.prevTime(this._currentTime);
    if (prev !== null) this.seek(prev);
  }

  goToStep(name: string): void {
    const marker = this.stepNav.getByName(name);
    if (marker) this.seek(marker.time);
  }

  get currentTime(): number {
    return this._currentTime;
  }

  get progress(): number {
    const total = this.timeline.totalDuration();
    return total > 0 ? this._currentTime / total : 0;
  }

  get isPlaying(): boolean {
    return this._playing;
  }

  get currentStep(): MarkerData | null {
    return this.stepNav.getAtTime(this._currentTime);
  }

  get currentStepIndex(): number {
    return this.stepNav.getIndexAtTime(this._currentTime);
  }

  get totalDuration(): number {
    return this.timeline.totalDuration();
  }

  on(event: EventName, cb: EventCallback): void {
    let set = this._events.get(event);
    if (!set) {
      set = new Set();
      this._events.set(event, set);
    }
    set.add(cb);
  }

  off(event: EventName, cb: EventCallback): void {
    this._events.get(event)?.delete(cb);
  }

  destroy(): void {
    this._ticker.destroy();
    this.stage.destroy();
    this._events.clear();
  }

  private _tick = (deltaMs: number): void => {
    if (!this._playing) return;

    const deltaSec = deltaMs / 1000;
    const total = this.timeline.totalDuration();

    if (this._reversed) {
      this._currentTime -= deltaSec;
      if (this._currentTime <= 0) {
        this._currentTime = 0;
        this._playing = false;
        this._ticker.pause();
      }
    } else {
      this._currentTime += deltaSec;
      if (this._currentTime >= total) {
        this._currentTime = total;
        this._playing = false;
        this._ticker.pause();
        this._emit("complete");
      }
    }

    this._renderFrame();
    this._emit("update");
  };

  private _renderFrame(): void {
    this.timeline.render(this._currentTime);
    this.stage.render();
  }

  private _emit(event: EventName): void {
    const set = this._events.get(event);
    if (set) {
      for (const cb of set) cb();
    }
  }
}
