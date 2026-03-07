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
