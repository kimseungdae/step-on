export type EasingFn = (t: number) => number;

export interface TweenVars {
  duration?: number;
  ease?: EasingFn | string;
  delay?: number;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  [prop: string]: unknown;
}

export interface PlayableConfig {
  duration?: number;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  ease?: EasingFn | string;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export interface StaggerConfig {
  each?: number;
  from?: "start" | "center" | "end" | number;
  ease?: EasingFn | string;
}

export interface MarkerData {
  name: string;
  time: number;
  duration: number;
  meta?: StepMarkerMeta;
}

export interface StepMarkerMeta {
  id: string;
  ttsText: string;
}

export type EventName =
  | "play"
  | "pause"
  | "stop"
  | "seek"
  | "step"
  | "complete"
  | "update";

export type EventCallback = (...args: unknown[]) => void;

export const RESERVED_TWEEN_KEYS = new Set([
  "duration",
  "ease",
  "delay",
  "onStart",
  "onUpdate",
  "onComplete",
  "repeat",
  "yoyo",
]);
