import type { Config } from "../types";
import type { WorksheetGrid } from "./grid";
import type { MiniBoxLayout } from "./minibox";
import { createGrid } from "./grid";
import { createMiniBox } from "./minibox";

export interface Layout {
  grid: WorksheetGrid;
  minibox: MiniBoxLayout;
  canvasWidth: number;
  canvasHeight: number;
}

export function createLayout(
  numCols: number,
  numRows: number,
  config: Config,
): Layout {
  const gap = config.cellW * 2;
  const grid = createGrid(numCols, numRows, config);
  const minibox = createMiniBox(grid.width, gap, config);
  const canvasWidth = grid.width + gap + minibox.width + config.padding;
  const canvasHeight = Math.max(
    grid.height,
    minibox.height + config.padding * 2,
  );

  return { grid, minibox, canvasWidth, canvasHeight };
}
