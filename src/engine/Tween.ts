import { Playable } from "./Playable";
import type { TweenVars, EasingFn } from "./types";
import { RESERVED_TWEEN_KEYS } from "./types";
import { resolveEasing } from "./easing";
import { lerp } from "./math";
import { parseColor, lerpColor, rgbaToString, type RGBA } from "./color";

interface PropInterp {
  key: string;
  from: number;
  to: number;
}

interface ColorInterp {
  key: string;
  from: RGBA;
  to: RGBA;
}

export class Tween extends Playable {
  private _target: Record<string, unknown>;
  private _props: PropInterp[] = [];
  private _colors: ColorInterp[] = [];
  private _initialized = false;
  private _fromVars: Record<string, unknown> | null = null;
  private _toVars: Record<string, unknown>;

  private constructor(
    target: Record<string, unknown>,
    toVars: Record<string, unknown>,
    fromVars?: Record<string, unknown>,
  ) {
    super();
    this._target = target;
    this._toVars = { ...toVars };
    this._fromVars = fromVars ? { ...fromVars } : null;

    this.duration = (toVars.duration as number) ?? 0.3;
    this.delay = (toVars.delay as number) ?? 0;
    this.repeat = (toVars.repeat as number) ?? 0;
    this.yoyo = (toVars.yoyo as boolean) ?? false;
    this._onStart = toVars.onStart as (() => void) | undefined;
    this._onUpdate = toVars.onUpdate as ((p: number) => void) | undefined;
    this._onComplete = toVars.onComplete as (() => void) | undefined;
    this._ease = resolveEasing(
      (toVars.ease as string | EasingFn) ?? "outCubic",
    );
  }

  static to(target: object, vars: TweenVars): Tween {
    return new Tween(target as Record<string, unknown>, vars);
  }

  static from(target: object, vars: TweenVars): Tween {
    const fromVars: Record<string, unknown> = {};
    const toVars: Record<string, unknown> = { ...vars };

    for (const key of Object.keys(vars)) {
      if (RESERVED_TWEEN_KEYS.has(key)) continue;
      fromVars[key] = vars[key];
      toVars[key] = (target as Record<string, unknown>)[key];
    }

    const t = new Tween(target as Record<string, unknown>, toVars, fromVars);
    // from일 때는 fromVars의 값을 즉시 적용
    for (const [k, v] of Object.entries(fromVars)) {
      (target as Record<string, unknown>)[k] = v;
    }
    return t;
  }

  static fromTo(target: object, from: TweenVars, to: TweenVars): Tween {
    const mergedTo: Record<string, unknown> = { ...to };
    for (const key of Object.keys(from)) {
      if (RESERVED_TWEEN_KEYS.has(key)) continue;
      mergedTo[key] = to[key];
    }
    return new Tween(target as Record<string, unknown>, mergedTo, from);
  }

  private _init(): void {
    if (this._initialized) return;
    this._initialized = true;

    for (const key of Object.keys(this._toVars)) {
      if (RESERVED_TWEEN_KEYS.has(key)) continue;

      const toVal = this._toVars[key];
      const fromVal = this._fromVars ? this._fromVars[key] : this._target[key];

      if (typeof toVal === "number" && typeof fromVal === "number") {
        this._props.push({ key, from: fromVal, to: toVal });
      } else if (typeof toVal === "string" && typeof fromVal === "string") {
        // 색상 보간 시도
        try {
          const fromColor = parseColor(fromVal);
          const toColor = parseColor(toVal);
          this._colors.push({ key, from: fromColor, to: toColor });
        } catch {
          // 색상이 아니면 무시
        }
      }
    }
  }

  render(parentTime: number): void {
    this._init();

    const t = this._calcProgress(parentTime);
    if (t === null && !this._started) return;

    const progress = t ?? (this._completed ? 1 : 0);
    const eased = this._ease(progress);
    this._progress = progress;

    for (const p of this._props) {
      this._target[p.key] = lerp(p.from, p.to, eased);
    }

    for (const c of this._colors) {
      this._target[c.key] = rgbaToString(lerpColor(c.from, c.to, eased));
    }

    this._onUpdate?.(progress);
  }

  override reset(): void {
    super.reset();
    this._initialized = false;
    this._props = [];
    this._colors = [];
  }
}
