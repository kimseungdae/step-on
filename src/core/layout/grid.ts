import type { Config } from "../types";

export interface PixelPos {
  x: number;
  y: number;
}

export interface WorksheetGrid {
  numCols: number;
  numRows: number;
  cellCenter(row: number, col: number): PixelPos;
  cellTopLeft(row: number, col: number): PixelPos;
  lineY(afterRow: number): number;
  lineX1(): number;
  lineX2(): number;
  width: number;
  height: number;
}

export function createGrid(
  numCols: number,
  numRows: number,
  config: Config,
): WorksheetGrid {
  const { cellW, rowH, padding } = config;
  const width = padding * 2 + numCols * cellW;
  const height = padding * 2 + numRows * rowH;

  return {
    numCols,
    numRows,
    width,
    height,

    cellCenter(row: number, col: number): PixelPos {
      return {
        x: padding + (numCols - 1 - col) * cellW + cellW / 2,
        y: padding + row * rowH + rowH * 0.7,
      };
    },

    cellTopLeft(row: number, col: number): PixelPos {
      return {
        x: padding + (numCols - 1 - col) * cellW,
        y: padding + row * rowH,
      };
    },

    lineY(afterRow: number): number {
      return padding + (afterRow + 1) * rowH;
    },

    lineX1(): number {
      return padding - 4;
    },

    lineX2(): number {
      return padding + numCols * cellW + 4;
    },
  };
}
