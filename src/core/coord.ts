import type { Config } from "./types";

export function cellX(col: number, totalCols: number, config: Config): number {
  const rightEdge = config.padding + (totalCols - 1) * config.cellW;
  return rightEdge - col * config.cellW;
}

export function cellY(row: number, config: Config): number {
  return config.padding + row * config.rowH;
}

export function canvasSize(cols: number, rows: number, config: Config) {
  return {
    w: Math.round(cols * config.cellW + config.padding * 2),
    h: Math.round(rows * config.rowH + config.padding * 2),
  };
}

export function toDigits(n: number): number[] {
  return String(Math.abs(n)).split("").map(Number);
}

export function digitAtFromRight(digits: number[], i: number): number {
  return digits[digits.length - 1 - i] ?? 0;
}
