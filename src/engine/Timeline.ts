import { Playable } from "./Playable";
import { Tween } from "./Tween";
import type {
  TweenVars,
  MarkerData,
  StepMarkerMeta,
  StaggerConfig,
  EasingFn,
} from "./types";
import { resolveEasing } from "./easing";

interface ChildEntry {
  playable: Playable;
  startTime: number;
}

export class Timeline extends Playable {
  private _children: ChildEntry[] = [];
  private _labels = new Map<string, number>();
  private _markers: MarkerData[] = [];
  private _lastInsertTime = 0;
  private _totalDuration = 0;
  private _dirty = true;

  constructor() {
    super();
    this.duration = 0; // 자동 계산
  }

  // 자식 Playable 추가
  add(child: Playable, position?: number | string): this {
    const startTime = this._resolvePosition(position);
    child.startTime = startTime;
    child.parent = this;
    this._children.push({ playable: child, startTime });
    this._lastInsertTime = startTime + child.totalDuration();
    this._dirty = true;
    return this;
  }

  // target 속성을 toVars로 트윈
  to(target: object, vars: TweenVars, position?: number | string): this {
    const tween = Tween.to(target, vars);
    return this.add(tween, position);
  }

  // target 속성을 fromVars에서 현재값으로 트윈
  from(target: object, vars: TweenVars, position?: number | string): this {
    const tween = Tween.from(target, vars);
    return this.add(tween, position);
  }

  // from → to 명시적 트윈
  fromTo(
    target: object,
    from: TweenVars,
    to: TweenVars,
    position?: number | string,
  ): this {
    const tween = Tween.fromTo(target, from, to);
    return this.add(tween, position);
  }

  // 라벨 추가 (위치 참조점)
  addLabel(name: string, time?: number): this {
    this._labels.set(name, time ?? this._lastInsertTime);
    return this;
  }

  // 마커 추가 (스텝 네비게이션용)
  addMarker(
    name: string,
    time: number,
    duration: number,
    meta?: StepMarkerMeta,
  ): this {
    this._markers.push({ name, time, duration, meta });
    return this;
  }

  // 시차 애니메이션
  stagger(
    targets: object[],
    vars: TweenVars,
    config: StaggerConfig = {},
    position?: number | string,
  ): this {
    const each = config.each ?? 0.05;
    const from = config.from ?? "start";
    const staggerEase = config.ease ? resolveEasing(config.ease) : undefined;

    const baseTime = this._resolvePosition(position);
    const count = targets.length;

    for (let i = 0; i < count; i++) {
      let staggerIndex: number;
      if (from === "start") staggerIndex = i;
      else if (from === "end") staggerIndex = count - 1 - i;
      else if (from === "center") staggerIndex = Math.abs(i - (count - 1) / 2);
      else staggerIndex = Math.abs(i - (from as number));

      let staggerT = count > 1 ? staggerIndex / (count - 1) : 0;
      if (staggerEase) staggerT = staggerEase(staggerT);

      const delay = staggerT * each * (count - 1);
      const tween = Tween.to(targets[i]!, { ...vars });
      tween.startTime = baseTime + delay;
      tween.parent = this;
      this._children.push({ playable: tween, startTime: tween.startTime });
    }

    this._lastInsertTime =
      baseTime + each * (count - 1) + ((vars.duration as number) ?? 0.3);
    this._dirty = true;
    return this;
  }

  // 라벨 목록
  get labels(): Map<string, number> {
    return this._labels;
  }

  // 마커 목록
  get markers(): readonly MarkerData[] {
    return this._markers;
  }

  // 특정 시간에 해당하는 마커
  getMarkerAt(time: number): MarkerData | null {
    for (const m of this._markers) {
      if (time >= m.time && time < m.time + m.duration) {
        return m;
      }
    }
    return null;
  }

  // 전체 지속 시간 계산
  override totalDuration(): number {
    if (this._dirty) {
      this._totalDuration = 0;
      for (const { playable, startTime } of this._children) {
        const end = startTime + playable.totalDuration();
        if (end > this._totalDuration) this._totalDuration = end;
      }
      this.duration = this._totalDuration;
      this._dirty = false;
    }
    return this._totalDuration;
  }

  // 재귀적 렌더링 — GSAP 스타일
  render(parentTime: number): void {
    const localTime = parentTime - this.startTime;

    const total = this.totalDuration();
    if (localTime < 0) return;

    this._active = localTime < total;

    if (!this._started && localTime >= 0) {
      this._started = true;
      this._onStart?.();
    }

    for (const { playable, startTime } of this._children) {
      playable.render(localTime);
    }

    const progress = total > 0 ? Math.min(localTime / total, 1) : 1;
    this._progress = progress;
    this._onUpdate?.(progress);

    if (progress >= 1 && !this._completed) {
      this._completed = true;
      this._onComplete?.();
    }
  }

  override reset(): void {
    super.reset();
    for (const { playable } of this._children) {
      playable.reset();
    }
  }

  // Position 문법 해석
  // 숫자: 절대 시간
  // "label": 라벨 시간
  // "+=0.3": 마지막 삽입 + 0.3초
  // "-=0.2": 마지막 삽입 - 0.2초
  // "<": 마지막 삽입된 자식의 시작 시간 (동시 시작)
  // ">": 마지막 삽입된 자식의 끝 시간 (기본)
  private _resolvePosition(pos?: number | string): number {
    if (pos === undefined) return this._lastInsertTime;
    if (typeof pos === "number") return pos;

    if (pos === "<") {
      const last = this._children[this._children.length - 1];
      return last ? last.startTime : 0;
    }

    if (pos === ">") {
      return this._lastInsertTime;
    }

    if (pos.startsWith("+=")) {
      return this._lastInsertTime + parseFloat(pos.slice(2));
    }

    if (pos.startsWith("-=")) {
      return this._lastInsertTime - parseFloat(pos.slice(2));
    }

    // 라벨 참조
    const labelTime = this._labels.get(pos);
    if (labelTime !== undefined) return labelTime;

    // 라벨 + 오프셋: "label+=0.5"
    const labelMatch = pos.match(/^(\w+)([+-]=[\d.]+)$/);
    if (labelMatch) {
      const base = this._labels.get(labelMatch[1]!) ?? 0;
      const offset = parseFloat(labelMatch[2]!.replace("=", ""));
      return base + offset;
    }

    return this._lastInsertTime;
  }
}
