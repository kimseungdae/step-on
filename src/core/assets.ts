import type { LottieAsset, LottieLayer } from "./types";

const GLYPH_W = 28;
const GLYPH_H = 44;
const SW = 4;

function shapePath(vertices: number[][]) {
  return {
    ty: "sh" as const,
    ks: {
      a: 0,
      k: {
        c: false,
        v: vertices,
        i: vertices.map(() => [0, 0]),
        o: vertices.map(() => [0, 0]),
      },
    },
  };
}

function groupTransform() {
  return {
    ty: "tr" as const,
    p: { a: 0, k: [0, 0] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] },
    r: { a: 0, k: 0 },
    o: { a: 0, k: [100] },
  };
}

function makeStrokeLayer(paths: number[][][]): LottieLayer {
  const shapes = paths.map((verts) => ({
    ty: "gr" as const,
    it: [
      shapePath(verts),
      {
        ty: "st" as const,
        c: { a: 0, k: [0.13, 0.13, 0.13, 1] },
        o: { a: 0, k: [100] },
        w: { a: 0, k: SW },
        lc: 2,
        lj: 2,
      },
      groupTransform(),
    ],
  }));
  return {
    ty: 4,
    ip: 0,
    op: 9999,
    st: 0,
    ks: {
      p: { a: 0, k: [0, 0] },
      o: { a: 0, k: [100] },
    },
    shapes,
  };
}

// Stroke-based digit glyphs (28x44 canvas, 2px padding)
const STROKE_DIGITS: number[][][][] = [
  [
    [
      [4, 2],
      [24, 2],
      [24, 42],
      [4, 42],
      [4, 2],
    ],
  ], // 0
  [
    [
      [14, 2],
      [14, 42],
    ],
  ], // 1
  [
    [
      [4, 2],
      [24, 2],
      [24, 22],
      [4, 22],
      [4, 42],
      [24, 42],
    ],
  ], // 2
  [
    [
      [4, 2],
      [24, 2],
      [24, 42],
      [4, 42],
    ],
    [
      [4, 22],
      [24, 22],
    ],
  ], // 3
  [
    [
      [4, 2],
      [4, 22],
      [24, 22],
    ],
    [
      [24, 2],
      [24, 42],
    ],
  ], // 4
  [
    [
      [24, 2],
      [4, 2],
      [4, 22],
      [24, 22],
      [24, 42],
      [4, 42],
    ],
  ], // 5
  [
    [
      [24, 2],
      [4, 2],
      [4, 42],
      [24, 42],
      [24, 22],
      [4, 22],
    ],
  ], // 6
  [
    [
      [4, 2],
      [24, 2],
      [14, 42],
    ],
  ], // 7
  [
    [
      [4, 2],
      [24, 2],
      [24, 42],
      [4, 42],
      [4, 2],
    ],
    [
      [4, 22],
      [24, 22],
    ],
  ], // 8
  [
    [
      [4, 42],
      [24, 42],
      [24, 2],
      [4, 2],
      [4, 22],
      [24, 22],
    ],
  ], // 9
];

const OPERATOR_PATHS: Record<string, number[][][]> = {
  "+": [
    [
      [14, 6],
      [14, 38],
    ],
    [
      [4, 22],
      [24, 22],
    ],
  ],
  "-": [
    [
      [4, 22],
      [24, 22],
    ],
  ],
  "×": [
    [
      [4, 6],
      [24, 38],
    ],
    [
      [24, 6],
      [4, 38],
    ],
  ],
  "÷": [
    [
      [4, 22],
      [24, 22],
    ],
    [
      [14, 8],
      [14, 10],
    ],
    [
      [14, 34],
      [14, 36],
    ],
  ],
};

function makeAsset(id: string, layer: LottieLayer): LottieAsset {
  return { id, w: GLYPH_W, h: GLYPH_H, layers: [layer] };
}

export const ASSETS: LottieAsset[] = [
  ...STROKE_DIGITS.map((paths, i) =>
    makeAsset(`d${i}`, makeStrokeLayer(paths)),
  ),
  ...Object.entries(OPERATOR_PATHS).map(([op, paths]) =>
    makeAsset(operatorAssetId(op), makeStrokeLayer(paths)),
  ),
];

export const ASSET_W = GLYPH_W;
export const ASSET_H = GLYPH_H;

export function operatorAssetId(op: string): string {
  if (op === "+") return "op_plus";
  if (op === "-") return "op_minus";
  if (op === "×") return "op_mul";
  return "op_div";
}
