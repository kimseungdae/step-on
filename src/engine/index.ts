export {
  clamp,
  lerp,
  vec2,
  vec2Lerp,
  vec2Dist,
  arcPoint,
  dynamicArcHeight,
} from "./math";
export type { Vec2 } from "./math";

export {
  rgba,
  parseColor,
  rgbaToString,
  lerpColor,
  lerpColorHSL,
  normalizedToRgba,
} from "./color";
export type { RGBA, HSLA } from "./color";

export { ease, cubicBezier, cssEase, resolveEasing } from "./easing";

export {
  SpringSolver,
  springPresets,
  createSpring,
  springDuration,
} from "./spring";
export type { SpringConfig, SpringPresetName } from "./spring";

export type {
  EasingFn,
  TweenVars,
  PlayableConfig,
  StaggerConfig,
  MarkerData,
  StepMarkerMeta,
  EventName,
  EventCallback,
} from "./types";

export { Playable } from "./Playable";
export { Tween } from "./Tween";
export { Timeline } from "./Timeline";
export { Ticker } from "./Ticker";
export type { TickCallback } from "./Ticker";
