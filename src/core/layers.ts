import type { Config, LottieLayer } from "./types";
import { ASSET_W, ASSET_H, operatorAssetId } from "./assets";
import { cellX, cellY } from "./coord";
import { fadeInAt, staticVal } from "./keyframes";

let layerIdx = 0;
export function resetLayerIdx() {
  layerIdx = 0;
}

function precompLayer(
  refId: string,
  col: number,
  totalCols: number,
  row: number,
  frame: number,
  totalFrames: number,
  config: Config,
): LottieLayer {
  const px = cellX(col, totalCols, config);
  const py = cellY(row, config);
  return {
    ty: 0,
    ind: layerIdx++,
    refId,
    w: ASSET_W,
    h: ASSET_H,
    ip: 0,
    op: totalFrames,
    st: 0,
    ks: {
      p: staticVal([px, py]),
      o: fadeInAt(frame),
    },
  };
}

export function digitLayer(
  digit: number,
  col: number,
  totalCols: number,
  row: number,
  frame: number,
  totalFrames: number,
  config: Config,
): LottieLayer {
  return precompLayer(
    `d${digit}`,
    col,
    totalCols,
    row,
    frame,
    totalFrames,
    config,
  );
}

export function operatorLayer(
  op: string,
  col: number,
  totalCols: number,
  row: number,
  frame: number,
  totalFrames: number,
  config: Config,
): LottieLayer {
  return precompLayer(
    operatorAssetId(op),
    col,
    totalCols,
    row,
    frame,
    totalFrames,
    config,
  );
}

export function carryLayer(
  digit: number,
  col: number,
  totalCols: number,
  row: number,
  frame: number,
  totalFrames: number,
  config: Config,
): LottieLayer {
  const px = cellX(col, totalCols, config);
  const baseY = cellY(row, config);
  const fromY = baseY + config.rowH * 0.5;
  return {
    ty: 0,
    ind: layerIdx++,
    refId: `d${digit}`,
    w: ASSET_W,
    h: ASSET_H,
    ip: 0,
    op: totalFrames,
    st: 0,
    ks: {
      p: {
        a: 1,
        k: [
          {
            t: frame,
            s: [px, fromY],
            o: { x: [0.33, 0.33], y: [0, 0] },
            i: { x: [0.67, 0.67], y: [1, 1] },
          },
          {
            t: frame + config.carryFrames,
            s: [px, baseY - config.rowH * 0.35],
          },
        ],
      },
      o: fadeInAt(frame, config.carryFrames),
      s: staticVal([70, 70]),
    },
  };
}

export function borrowLayer(
  fromDigit: number,
  toDigit: number,
  col: number,
  totalCols: number,
  row: number,
  frame: number,
  totalFrames: number,
  config: Config,
): LottieLayer[] {
  const layers: LottieLayer[] = [];
  // fade out old digit
  const px = cellX(col, totalCols, config);
  const py = cellY(row, config);
  layers.push({
    ty: 0,
    ind: layerIdx++,
    refId: `d${fromDigit}`,
    w: ASSET_W,
    h: ASSET_H,
    ip: 0,
    op: totalFrames,
    st: 0,
    ks: {
      p: staticVal([px, py]),
      o: {
        a: 1,
        k: [
          { t: 0, s: [0] },
          { t: frame - config.placeFrames, s: [100] },
          { t: frame, s: [0] },
        ],
      },
    },
  });
  // fade in new digit
  layers.push({
    ty: 0,
    ind: layerIdx++,
    refId: `d${toDigit}`,
    w: ASSET_W,
    h: ASSET_H,
    ip: 0,
    op: totalFrames,
    st: 0,
    ks: {
      p: staticVal([px, py]),
      o: fadeInAt(frame),
    },
  });
  return layers;
}

export function lineLayer(
  row: number,
  totalCols: number,
  frame: number,
  totalFrames: number,
  config: Config,
): LottieLayer {
  const x1 = config.padding - 4;
  const x2 = cellX(0, totalCols, config) + ASSET_W + 4;
  const py = cellY(row, config) - config.rowH * 0.15;
  return {
    ty: 4,
    ind: layerIdx++,
    ip: 0,
    op: totalFrames,
    st: 0,
    ks: {
      p: staticVal([0, 0]),
      o: fadeInAt(frame),
    },
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "sh",
            ks: {
              a: 0,
              k: {
                c: false,
                v: [
                  [x1, py],
                  [x2, py],
                ],
                i: [
                  [0, 0],
                  [0, 0],
                ],
                o: [
                  [0, 0],
                  [0, 0],
                ],
              },
            },
          },
          {
            ty: "st",
            c: { a: 0, k: [0.13, 0.13, 0.13, 1] },
            o: { a: 0, k: [100] },
            w: { a: 0, k: 2 },
            lc: 2,
            lj: 2,
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: [100] },
          },
        ],
      },
    ],
  };
}

export function highlightLayer(
  col: number,
  totalCols: number,
  rows: number[],
  frame: number,
  dur: number,
  totalFrames: number,
  config: Config,
): LottieLayer {
  const px = cellX(col, totalCols, config) - 2;
  const py = cellY(Math.min(...rows), config) - 4;
  const h = (Math.max(...rows) - Math.min(...rows) + 1) * config.rowH;
  return {
    ty: 4,
    ind: layerIdx++,
    ip: 0,
    op: totalFrames,
    st: 0,
    ks: {
      p: staticVal([0, 0]),
      o: {
        a: 1,
        k: [
          { t: 0, s: [0] },
          { t: frame, s: [0] },
          { t: frame + 3, s: [40] },
          { t: frame + dur, s: [40] },
          { t: frame + dur + 3, s: [0] },
        ],
      },
    },
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [px + ASSET_W / 2, py + h / 2] },
            s: { a: 0, k: [ASSET_W + 4, h + 8] },
            r: { a: 0, k: 4 },
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.29, 0.56, 0.85, 1] },
            o: { a: 0, k: [100] },
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: [100] },
          },
        ],
      },
    ],
  };
}
