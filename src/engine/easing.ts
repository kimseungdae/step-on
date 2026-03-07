import type { EasingFn } from "./types";

const { PI, sin, cos, pow, sqrt, abs } = Math;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * PI) / 3;
const c5 = (2 * PI) / 4.5;

export const ease = {
  linear: (t: number) => t,

  // Quad
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2),

  // Cubic
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - pow(1 - t, 3),
  inOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2,

  // Quart
  inQuart: (t: number) => t * t * t * t,
  outQuart: (t: number) => 1 - pow(1 - t, 4),
  inOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - pow(-2 * t + 2, 4) / 2,

  // Quint
  inQuint: (t: number) => t * t * t * t * t,
  outQuint: (t: number) => 1 - pow(1 - t, 5),
  inOutQuint: (t: number) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - pow(-2 * t + 2, 5) / 2,

  // Sine
  inSine: (t: number) => 1 - cos((t * PI) / 2),
  outSine: (t: number) => sin((t * PI) / 2),
  inOutSine: (t: number) => -(cos(PI * t) - 1) / 2,

  // Expo
  inExpo: (t: number) => (t === 0 ? 0 : pow(2, 10 * t - 10)),
  outExpo: (t: number) => (t === 1 ? 1 : 1 - pow(2, -10 * t)),
  inOutExpo: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? pow(2, 20 * t - 10) / 2
          : (2 - pow(2, -20 * t + 10)) / 2,

  // Circ
  inCirc: (t: number) => 1 - sqrt(1 - pow(t, 2)),
  outCirc: (t: number) => sqrt(1 - pow(t - 1, 2)),
  inOutCirc: (t: number) =>
    t < 0.5
      ? (1 - sqrt(1 - pow(2 * t, 2))) / 2
      : (sqrt(1 - pow(-2 * t + 2, 2)) + 1) / 2,

  // Elastic
  inElastic: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : -pow(2, 10 * t - 10) * sin((t * 10 - 10.75) * c4),
  outElastic: (t: number) =>
    t === 0 ? 0 : t === 1 ? 1 : pow(2, -10 * t) * sin((t * 10 - 0.75) * c4) + 1,
  inOutElastic: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? -(pow(2, 20 * t - 10) * sin((20 * t - 11.125) * c5)) / 2
          : (pow(2, -20 * t + 10) * sin((20 * t - 11.125) * c5)) / 2 + 1,

  // Back
  inBack: (t: number) => c3 * t * t * t - c1 * t * t,
  outBack: (t: number) => 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2),
  inOutBack: (t: number) =>
    t < 0.5
      ? (pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2,

  // Bounce
  inBounce: (t: number) => 1 - bounceOut(1 - t),
  outBounce: bounceOut,
  inOutBounce: (t: number) =>
    t < 0.5 ? (1 - bounceOut(1 - 2 * t)) / 2 : (1 + bounceOut(2 * t - 1)) / 2,
} as const;

function bounceOut(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

// cubic-bezier(x1, y1, x2, y2) — CSS 호환
// Newton-Raphson으로 t를 구한 뒤 y 계산
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): EasingFn {
  if (x1 === y1 && x2 === y2) return ease.linear;

  const sampleSize = 11;
  const sampleTable = new Float64Array(sampleSize);
  const step = 1.0 / (sampleSize - 1);

  for (let i = 0; i < sampleSize; i++) {
    sampleTable[i] = calcBezier(i * step, x1, x2);
  }

  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let lo = 0;
    let hi = sampleSize - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (sampleTable[mid]! <= x) lo = mid;
      else hi = mid;
    }

    const dist = (x - sampleTable[lo]!) / (sampleTable[hi]! - sampleTable[lo]!);
    let guessT = (lo + dist) * step;

    // Newton-Raphson refinement (3 iterations)
    for (let i = 0; i < 3; i++) {
      const slope = slopeAt(guessT, x1, x2);
      if (abs(slope) < 1e-7) break;
      guessT -= (calcBezier(guessT, x1, x2) - x) / slope;
    }

    return calcBezier(guessT, y1, y2);
  };
}

function calcBezier(t: number, a1: number, a2: number): number {
  return ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
}

function slopeAt(t: number, a1: number, a2: number): number {
  return 3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;
}

// CSS 표준 프리셋
export const cssEase = {
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  easeIn: cubicBezier(0.42, 0, 1, 1),
  easeOut: cubicBezier(0, 0, 0.58, 1),
  easeInOut: cubicBezier(0.42, 0, 0.58, 1),
} as const;

const easingMap = new Map<string, EasingFn>();

function buildMap() {
  if (easingMap.size > 0) return;
  for (const [name, fn] of Object.entries(ease)) {
    easingMap.set(name, fn);
    easingMap.set(name.toLowerCase(), fn);
  }
  easingMap.set("ease", cssEase.ease);
  easingMap.set("ease-in", cssEase.easeIn);
  easingMap.set("ease-out", cssEase.easeOut);
  easingMap.set("ease-in-out", cssEase.easeInOut);
}

export function resolveEasing(nameOrFn: string | EasingFn): EasingFn {
  if (typeof nameOrFn === "function") return nameOrFn;

  buildMap();
  const fn = easingMap.get(nameOrFn);
  if (fn) return fn;

  // cubic-bezier(x1, y1, x2, y2) 형식
  const match = nameOrFn.match(
    /cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/,
  );
  if (match) {
    return cubicBezier(
      parseFloat(match[1]!),
      parseFloat(match[2]!),
      parseFloat(match[3]!),
      parseFloat(match[4]!),
    );
  }

  return ease.linear;
}
