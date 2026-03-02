import type { LottieProperty } from "../types";

const EASE_O = { x: [0.33], y: [0] };
const EASE_I = { x: [0.67], y: [1] };
const EASE_O2 = { x: [0.33, 0.33], y: [0, 0] };
const EASE_I2 = { x: [0.67, 0.67], y: [1, 1] };

export function scalePop(frame: number, dur = 12): LottieProperty {
  const mid = Math.floor(dur / 2);
  return {
    a: 1,
    k: [
      { t: frame, s: [100, 100], o: EASE_O2, i: EASE_I2 },
      { t: frame + mid, s: [120, 120], o: EASE_O2, i: EASE_I2 },
      { t: frame + dur, s: [100, 100] },
    ],
  };
}

export function scalePulse(frame: number, dur = 12): LottieProperty {
  const q = Math.floor(dur / 4);
  return {
    a: 1,
    k: [
      { t: frame, s: [100, 100], o: EASE_O2, i: EASE_I2 },
      { t: frame + q, s: [115, 115], o: EASE_O2, i: EASE_I2 },
      { t: frame + q * 2, s: [95, 95], o: EASE_O2, i: EASE_I2 },
      { t: frame + q * 3, s: [105, 105], o: EASE_O2, i: EASE_I2 },
      { t: frame + dur, s: [100, 100] },
    ],
  };
}

export function shakeX(frame: number, x: number, dur = 10): LottieProperty {
  const amp = 6;
  const step = Math.floor(dur / 4);
  return {
    a: 1,
    k: [
      { t: frame, s: [x], o: EASE_O, i: EASE_I },
      { t: frame + step, s: [x - amp], o: EASE_O, i: EASE_I },
      { t: frame + step * 2, s: [x + amp], o: EASE_O, i: EASE_I },
      { t: frame + step * 3, s: [x - amp / 2], o: EASE_O, i: EASE_I },
      { t: frame + dur, s: [x] },
    ],
  };
}

export function arcPosition(
  frame: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  dur = 24,
): LottieProperty {
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 40;
  return {
    a: 1,
    k: [
      { t: frame, s: [fromX, fromY], o: EASE_O2, i: EASE_I2 },
      {
        t: frame + Math.floor(dur / 2),
        s: [midX, midY],
        o: EASE_O2,
        i: EASE_I2,
      },
      { t: frame + dur, s: [toX, toY] },
    ],
  };
}

export function bounceSnap(
  frame: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  dur = 16,
): LottieProperty {
  const overshoot = 4;
  return {
    a: 1,
    k: [
      { t: frame, s: [fromX, fromY], o: EASE_O2, i: EASE_I2 },
      {
        t: frame + Math.floor(dur * 0.7),
        s: [toX, toY - overshoot],
        o: EASE_O2,
        i: EASE_I2,
      },
      { t: frame + dur, s: [toX, toY] },
    ],
  };
}

export function crossfade(
  frame: number,
  dur = 12,
): { fadeOutOpacity: LottieProperty; fadeInOpacity: LottieProperty } {
  return {
    fadeOutOpacity: {
      a: 1,
      k: [
        { t: frame, s: [100], o: EASE_O, i: EASE_I },
        { t: frame + dur, s: [0] },
      ],
    },
    fadeInOpacity: {
      a: 1,
      k: [
        { t: 0, s: [0], h: 1 },
        { t: frame, s: [0], o: EASE_O, i: EASE_I },
        { t: frame + dur, s: [100] },
      ],
    },
  };
}

export function shrinkScale(
  frame: number,
  fromScale: number,
  toScale: number,
  dur = 8,
): LottieProperty {
  return {
    a: 1,
    k: [
      { t: frame, s: [fromScale, fromScale], o: EASE_O2, i: EASE_I2 },
      { t: frame + dur, s: [toScale, toScale] },
    ],
  };
}
