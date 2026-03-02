import { describe, it, expect } from "vitest";
import { toDigits, digitAt, digitCount } from "../layout/coord";
import { createGrid } from "../layout/grid";
import { createMiniBox } from "../layout/minibox";
import { createLayout } from "../layout/index";
import { DEFAULT_CONFIG } from "../types";

const cfg = DEFAULT_CONFIG;

describe("layout/coord", () => {
  it("toDigits splits number into digits (ones first)", () => {
    expect(toDigits(0)).toEqual([0]);
    expect(toDigits(5)).toEqual([5]);
    expect(toDigits(47)).toEqual([7, 4]);
    expect(toDigits(123)).toEqual([3, 2, 1]);
  });

  it("digitAt extracts digit at column position", () => {
    expect(digitAt(47, 0)).toBe(7);
    expect(digitAt(47, 1)).toBe(4);
    expect(digitAt(47, 2)).toBe(0);
  });

  it("digitCount returns number of digits", () => {
    expect(digitCount(0)).toBe(1);
    expect(digitCount(9)).toBe(1);
    expect(digitCount(10)).toBe(2);
    expect(digitCount(999)).toBe(3);
  });
});

describe("layout/grid", () => {
  const grid = createGrid(3, 4, cfg);

  it("calculates correct dimensions", () => {
    expect(grid.width).toBe(cfg.padding * 2 + 3 * cfg.cellW);
    expect(grid.height).toBe(cfg.padding * 2 + 4 * cfg.rowH);
  });

  it("cellCenter: col 0 (ones) is rightmost", () => {
    const c0 = grid.cellCenter(0, 0);
    const c1 = grid.cellCenter(0, 1);
    expect(c0.x).toBeGreaterThan(c1.x);
  });

  it("cellCenter: row 0 is topmost", () => {
    const r0 = grid.cellCenter(0, 0);
    const r1 = grid.cellCenter(1, 0);
    expect(r0.y).toBeLessThan(r1.y);
  });

  it("cellCenter x = padding + (numCols-1-col)*cellW + cellW/2", () => {
    const pos = grid.cellCenter(1, 1);
    expect(pos.x).toBe(cfg.padding + (3 - 1 - 1) * cfg.cellW + cfg.cellW / 2);
    expect(pos.y).toBe(cfg.padding + 1 * cfg.rowH + cfg.rowH * 0.7);
  });

  it("lineY returns boundary between rows", () => {
    const ly = grid.lineY(2);
    expect(ly).toBe(cfg.padding + 3 * cfg.rowH);
  });

  it("lineX1 < lineX2", () => {
    expect(grid.lineX1()).toBeLessThan(grid.lineX2());
  });
});

describe("layout/minibox", () => {
  const grid = createGrid(3, 4, cfg);
  const gap = cfg.cellW * 2;
  const mb = createMiniBox(grid.width, gap, cfg);

  it("originX is to the right of worksheet", () => {
    expect(mb.originX).toBe(grid.width + gap);
  });

  it("slot positions are within minibox bounds", () => {
    const slots = [
      "left",
      "op",
      "right",
      "eq",
      "result",
      "tens",
      "ones",
    ] as const;
    for (const s of slots) {
      const pos = mb.slotPos(s);
      expect(pos.x).toBeGreaterThanOrEqual(mb.originX);
      expect(pos.x).toBeLessThanOrEqual(mb.originX + mb.width);
    }
  });

  it("setActiveRow changes slot Y positions", () => {
    const y0 = mb.slotPos("left").y;
    mb.setActiveRow(2);
    const y2 = mb.slotPos("left").y;
    expect(y2).toBeGreaterThan(y0);
    mb.setActiveRow(0);
  });
});

describe("createLayout", () => {
  const layout = createLayout(3, 4, cfg);

  it("provides grid, minibox, and canvas dimensions", () => {
    expect(layout.grid).toBeDefined();
    expect(layout.minibox).toBeDefined();
    expect(layout.canvasWidth).toBeGreaterThan(layout.grid.width);
    expect(layout.canvasHeight).toBeGreaterThanOrEqual(layout.grid.height);
  });
});
