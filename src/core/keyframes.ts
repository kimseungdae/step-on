import type { LottieProperty } from "./types";

const EASE_O = { x: [0.33], y: [0] };
const EASE_I = { x: [0.67], y: [1] };
const EASE_O2 = { x: [0.33, 0.33], y: [0, 0] };
const EASE_I2 = { x: [0.67, 0.67], y: [1, 1] };

export function staticVal(v: number[]): LottieProperty {
  return { a: 0, k: v };
}

export function fadeIn(frame: number, dur = 8): LottieProperty {
  return {
    a: 1,
    k: [
      { t: frame, s: [0], o: EASE_O, i: EASE_I },
      { t: frame + dur, s: [100] },
    ],
  };
}

export function fadeOut(frame: number, dur = 8): LottieProperty {
  return {
    a: 1,
    k: [
      { t: frame, s: [100], o: EASE_O, i: EASE_I },
      { t: frame + dur, s: [0] },
    ],
  };
}

export function moveY(
  frame: number,
  fromY: number,
  toY: number,
  dur = 10,
): LottieProperty {
  return {
    a: 1,
    k: [
      { t: frame, s: [fromY], o: EASE_O, i: EASE_I },
      { t: frame + dur, s: [toY] },
    ],
  };
}

export function fadeInAt(frame: number, dur = 8): LottieProperty {
  return {
    a: 1,
    k: [
      { t: 0, s: [0], h: 1 },
      { t: frame, s: [0], o: EASE_O, i: EASE_I },
      { t: frame + dur, s: [100] },
    ],
  };
}

export function positionAnimated(
  frame: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  dur = 10,
): LottieProperty {
  return {
    a: 1,
    k: [
      { t: frame, s: [fromX, fromY], o: EASE_O2, i: EASE_I2 },
      { t: frame + dur, s: [toX, toY] },
    ],
  };
}
