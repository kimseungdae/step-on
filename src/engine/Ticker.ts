export type TickCallback = (deltaMs: number, elapsedMs: number) => void;

export class Ticker {
  private _rafId: number | null = null;
  private _lastTime = 0;
  private _elapsed = 0;
  private _callbacks = new Set<TickCallback>();
  private _paused = false;
  private _speed = 1;
  private _frameCount = 0;
  private _fpsTime = 0;
  private _fps = 60;

  add(fn: TickCallback): void {
    this._callbacks.add(fn);
  }

  remove(fn: TickCallback): void {
    this._callbacks.delete(fn);
  }

  start(): void {
    if (this._rafId !== null) return;
    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  stop(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  pause(): void {
    this._paused = true;
  }

  resume(): void {
    this._paused = false;
    this._lastTime = performance.now();
  }

  get paused(): boolean {
    return this._paused;
  }

  set speed(value: number) {
    this._speed = Math.max(0.1, Math.min(4, value));
  }

  get speed(): number {
    return this._speed;
  }

  get fps(): number {
    return this._fps;
  }

  get elapsed(): number {
    return this._elapsed;
  }

  private _loop = (now: DOMHighResTimeStamp): void => {
    this._rafId = requestAnimationFrame(this._loop);

    if (this._paused) {
      this._lastTime = now;
      return;
    }

    const rawDelta = now - this._lastTime;
    this._lastTime = now;

    // 프레임 드롭 보호: 100ms 이상은 무시 (탭 비활성 복귀 등)
    const cappedDelta = Math.min(rawDelta, 100);
    const scaledDelta = cappedDelta * this._speed;
    this._elapsed += scaledDelta;

    // FPS 계산
    this._frameCount++;
    this._fpsTime += rawDelta;
    if (this._fpsTime >= 1000) {
      this._fps = Math.round((this._frameCount * 1000) / this._fpsTime);
      this._frameCount = 0;
      this._fpsTime = 0;
    }

    for (const cb of this._callbacks) {
      cb(scaledDelta, this._elapsed);
    }
  };

  destroy(): void {
    this.stop();
    this._callbacks.clear();
  }
}
