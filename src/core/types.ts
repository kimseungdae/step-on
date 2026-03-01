export type Operator = "+" | "-" | "×" | "÷";

export interface Problem {
  a: number;
  b: number;
  op: Operator;
}

export interface Config {
  cellW: number;
  rowH: number;
  padding: number;
  fps: number;
  placeFrames: number;
  highlightFrames: number;
  resultFrames: number;
  carryFrames: number;
  lineFrames: number;
}

export const DEFAULT_CONFIG: Config = {
  cellW: 48,
  rowH: 64,
  padding: 32,
  fps: 30,
  placeFrames: 4,
  highlightFrames: 8,
  resultFrames: 6,
  carryFrames: 10,
  lineFrames: 4,
};

export interface LottieKeyframe {
  t: number;
  s: number[];
  i?: { x: number[]; y: number[] };
  o?: { x: number[]; y: number[] };
}

export interface LottieProperty {
  a: 0 | 1;
  k: number[] | LottieKeyframe[];
}

export interface LottieTransform {
  a?: LottieProperty;
  p: LottieProperty | { a: 0 | 1; k: number[] | LottieKeyframe[]; s?: number };
  s?: LottieProperty;
  r?: LottieProperty;
  o: LottieProperty;
}

export interface LottieLayer {
  ty: number;
  nm?: string;
  ind?: number;
  ip: number;
  op: number;
  st: number;
  ks: LottieTransform;
  refId?: string;
  w?: number;
  h?: number;
  shapes?: unknown[];
}

export interface LottieAsset {
  id: string;
  w?: number;
  h?: number;
  layers: LottieLayer[];
}

export interface LottieAnimation {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  ddd: number;
  assets: LottieAsset[];
  layers: LottieLayer[];
}
