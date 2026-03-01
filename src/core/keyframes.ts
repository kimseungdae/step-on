import type { LottieProperty } from "./types";

export function staticVal(v: number[]): LottieProperty {
  return { a: 0, k: v };
}

export function fadeIn(frame: number, dur = 8): LottieProperty {
  return {
    a: 1,
    k: [
      { t: frame, s: [0] },
      { t: frame + dur, s: [100] },
    ],
  };
}

export function fadeOut(frame: number, dur = 8): LottieProperty {
  return {
    a: 1,
    k: [
      { t: frame, s: [100] },
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
      {
        t: frame,
        s: [fromY],
        o: { x: [0.33], y: [0] },
        i: { x: [0.67], y: [1] },
      },
      { t: frame + dur, s: [toY] },
    ],
  };
}

export function fadeInAt(frame: number, dur = 8): LottieProperty {
  return {
    a: 1,
    k: [
      { t: 0, s: [0] },
      { t: frame, s: [0] },
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
      {
        t: frame,
        s: [fromX, fromY],
        o: { x: [0.33, 0.33], y: [0, 0] },
        i: { x: [0.67, 0.67], y: [1, 1] },
      },
      { t: frame + dur, s: [toX, toY] },
    ],
  };
}
