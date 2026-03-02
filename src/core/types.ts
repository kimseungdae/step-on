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
  fontSize: number;
  fontFamily: string;
  fontColor: number[];
  carryScale: number;
  placeFrames: number;
  highlightFrames: number;
  resultFrames: number;
  carryFrames: number;
  lineFrames: number;
  annotationFrames: number;
}

export const DEFAULT_CONFIG: Config = {
  cellW: 48,
  rowH: 64,
  padding: 32,
  fps: 30,
  fontSize: 36,
  fontFamily: "Arial",
  fontColor: [0.13, 0.13, 0.13],
  carryScale: 75,
  placeFrames: 20,
  highlightFrames: 30,
  resultFrames: 24,
  carryFrames: 36,
  lineFrames: 12,
  annotationFrames: 40,
};

export interface LottieKeyframe {
  t: number;
  s: number[];
  h?: number;
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

export interface LottieTextDoc {
  f: string;
  s: number;
  t: string;
  fc: number[];
  j: number;
  tr: number;
  lh: number;
  ls: number;
}

export interface LottieTextData {
  d: { k: { s: LottieTextDoc; t: number }[] };
  p: Record<string, never>;
  m: { g: number; a: LottieProperty };
  a: unknown[];
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
  t?: LottieTextData;
}

export interface LottieAsset {
  id: string;
  w?: number;
  h?: number;
  layers: LottieLayer[];
}

export interface LottieFont {
  fName: string;
  fFamily: string;
  fStyle: string;
  ascent: number;
}

export interface LottieMarker {
  tm: number;
  cm: string;
  dr: number;
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
  fonts?: { list: LottieFont[] };
  markers?: LottieMarker[];
}
