import type { Config, LottieLayer, LottieTextData } from "../types";
import type { PixelPos } from "../layout/grid";
import { fadeInAt, staticVal } from "../keyframes";

let layerIdx = 0;

export function resetLayerIdx(): void {
  layerIdx = 0;
}

export function nextLayerIdx(): number {
  return layerIdx++;
}

function createTextData(
  text: string,
  config: Config,
  fontSize?: number,
  color?: number[],
): LottieTextData {
  const fs = fontSize ?? config.fontSize;
  return {
    d: {
      k: [
        {
          s: {
            f: config.fontFamily,
            s: fs,
            t: text,
            fc: color ?? config.fontColor,
            j: 2,
            tr: 0,
            lh: fs * 1.2,
            ls: 0,
          },
          t: 0,
        },
      ],
    },
    p: {},
    m: { g: 1, a: { a: 0, k: [0, 0] } },
    a: [],
  };
}

export interface TextLayerOpts {
  text: string;
  pos: PixelPos;
  frame: number;
  totalFrames: number;
  config: Config;
  fontSize?: number;
  color?: number[];
}

export function createTextLayer(opts: TextLayerOpts): LottieLayer {
  const { text, pos, frame, totalFrames, config, fontSize, color } = opts;
  return {
    ty: 5,
    ind: nextLayerIdx(),
    ip: 0,
    op: totalFrames,
    st: 0,
    ks: {
      a: staticVal([0, 0]),
      p: staticVal([pos.x, pos.y]),
      s: staticVal([100, 100]),
      r: staticVal([0]),
      o: fadeInAt(frame),
    },
    t: createTextData(text, config, fontSize, color),
  };
}

export interface RectLayerOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  fillColor: number[];
  frame: number;
  dur: number;
  totalFrames: number;
  radius?: number;
}

export function createRectLayer(opts: RectLayerOpts): LottieLayer {
  const { x, y, w, h, fillColor, frame, dur, totalFrames, radius = 4 } = opts;
  return {
    ty: 4,
    ind: nextLayerIdx(),
    ip: 0,
    op: totalFrames,
    st: 0,
    ks: {
      p: staticVal([0, 0]),
      o: {
        a: 1,
        k: [
          { t: 0, s: [0], h: 1 },
          {
            t: frame,
            s: [0],
            o: { x: [0.25], y: [0.1] },
            i: { x: [0.25], y: [1] },
          },
          { t: frame + 8, s: [50], h: 1 },
          {
            t: frame + dur,
            s: [50],
            o: { x: [0.25], y: [0.1] },
            i: { x: [0.25], y: [1] },
          },
          { t: frame + dur + 10, s: [0] },
        ],
      },
    },
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [x + w / 2, y + h / 2] },
            s: { a: 0, k: [w, h] },
            r: { a: 0, k: radius },
          },
          {
            ty: "fl",
            c: { a: 0, k: [...fillColor, 1] },
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

export interface LineLayerOpts {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  frame: number;
  totalFrames: number;
  color?: number[];
  strokeWidth?: number;
}

export function createLineLayer(opts: LineLayerOpts): LottieLayer {
  const {
    x1,
    y1,
    x2,
    y2,
    frame,
    totalFrames,
    color = [0.13, 0.13, 0.13],
    strokeWidth = 2,
  } = opts;
  return {
    ty: 4,
    ind: nextLayerIdx(),
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
                  [x1, y1],
                  [x2, y2],
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
            c: { a: 0, k: [...color, 1] },
            o: { a: 0, k: [100] },
            w: { a: 0, k: strokeWidth },
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
