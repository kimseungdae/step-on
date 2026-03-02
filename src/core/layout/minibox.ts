import type { Config } from "../types";
import type { MiniboxSlot } from "../dsl/refs";
import type { PixelPos } from "./grid";

export interface MiniBoxLayout {
  readonly originX: number;
  readonly width: number;
  readonly height: number;
  originY: number;
  setActiveRow(row: number): void;
  slotPos(slot: MiniboxSlot): PixelPos;
  boxRect(): { x: number; y: number; w: number; h: number };
}

export function createMiniBox(
  worksheetWidth: number,
  gap: number,
  config: Config,
): MiniBoxLayout {
  const { cellW, rowH, padding } = config;
  const ox = worksheetWidth + gap;
  const width = cellW * 6;
  const height = rowH * 3;
  const state = { oy: padding };

  return {
    originX: ox,
    width,
    height,

    get originY() {
      return state.oy;
    },
    set originY(v: number) {
      state.oy = v;
    },

    setActiveRow(row: number) {
      state.oy = padding + row * rowH;
    },

    slotPos(slot: MiniboxSlot): PixelPos {
      const oy = state.oy;
      const map: Record<MiniboxSlot, PixelPos> = {
        "carry-prefix": { x: ox + cellW * 0.5, y: oy + rowH * 0.7 },
        left: { x: ox + cellW * 1.5, y: oy + rowH * 0.7 },
        op: { x: ox + cellW * 2.5, y: oy + rowH * 0.7 },
        right: { x: ox + cellW * 3.5, y: oy + rowH * 0.7 },
        eq: { x: ox + cellW * 2.0, y: oy + rowH * 1.7 },
        result: { x: ox + cellW * 3.5, y: oy + rowH * 1.7 },
        tens: { x: ox + cellW * 1.5, y: oy + rowH * 2.7 },
        ones: { x: ox + cellW * 3.5, y: oy + rowH * 2.7 },
      };
      return map[slot];
    },

    boxRect() {
      return { x: ox, y: state.oy, w: width, h: height };
    },
  };
}
