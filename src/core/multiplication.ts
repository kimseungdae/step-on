import type { Config, LottieAnimation, LottieLayer } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { ASSETS } from "./assets";
import { toDigits, digitAtFromRight, canvasSize } from "./coord";
import {
  resetLayerIdx,
  digitLayer,
  operatorLayer,
  lineLayer,
  carryLayer,
  highlightLayer,
} from "./layers";

export function generateMultiplication(
  a: number,
  b: number,
  config: Partial<Config> = {},
): LottieAnimation {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  resetLayerIdx();

  const digitsA = toDigits(a);
  const digitsB = toDigits(b);
  const result = a * b;
  const digitsR = toDigits(result);

  // partial products: multiply a by each digit of b
  const partials: number[] = [];
  for (let i = 0; i < digitsB.length; i++) {
    const db = digitAtFromRight(digitsB, i);
    partials.push(a * db * Math.pow(10, i));
  }

  // layout:
  // row 0: a
  // row 1: × b
  // row 2: line
  // row 3..3+partials.length-1: partial products (skip if single digit b)
  // next row: line (if partials > 1)
  // final row: result
  const hasMultiplePartials = digitsB.length > 1;
  const partialRows = hasMultiplePartials ? digitsB.length : 0;
  const totalRows = 3 + partialRows + (hasMultiplePartials ? 1 : 0) + 1;
  const maxDigits = digitsR.length;
  const totalCols = maxDigits + 1; // +1 for operator column

  const layers: LottieLayer[] = [];
  let frame = 0;
  const estFrames =
    (digitsA.length * digitsB.length + maxDigits + 2) * 30 + 120;

  // 1. Place digits of a
  for (let i = 0; i < digitsA.length; i++) {
    const col = digitsA.length - 1 - i;
    layers.push(
      digitLayer(digitsA[i]!, col, totalCols, 0, frame, estFrames, cfg),
    );
  }
  frame += cfg.placeFrames;

  // 2. Place × + digits of b
  layers.push(
    operatorLayer("×", totalCols - 1, totalCols, 1, frame, estFrames, cfg),
  );
  for (let i = 0; i < digitsB.length; i++) {
    const col = digitsB.length - 1 - i;
    layers.push(
      digitLayer(digitsB[i]!, col, totalCols, 1, frame, estFrames, cfg),
    );
  }
  frame += cfg.placeFrames;

  // 3. First line
  layers.push(lineLayer(2, totalCols, frame, estFrames, cfg));
  frame += cfg.lineFrames;

  if (hasMultiplePartials) {
    // 4. Partial products: each digit of b × a
    for (let bi = 0; bi < digitsB.length; bi++) {
      const db = digitAtFromRight(digitsB, bi);
      const partialRow = 3 + bi;
      let carry = 0;

      // highlight the b digit
      layers.push(
        highlightLayer(
          bi,
          totalCols,
          [1],
          frame,
          cfg.highlightFrames,
          estFrames,
          cfg,
        ),
      );
      frame += cfg.highlightFrames;

      // trailing zeros for position shift
      for (let z = 0; z < bi; z++) {
        layers.push(
          digitLayer(0, z, totalCols, partialRow, frame, estFrames, cfg),
        );
      }

      for (let ai = 0; ai < digitsA.length; ai++) {
        const da = digitAtFromRight(digitsA, ai);
        const prod = da * db + carry;
        const col = ai + bi;

        layers.push(
          digitLayer(
            prod % 10,
            col,
            totalCols,
            partialRow,
            frame,
            estFrames,
            cfg,
          ),
        );
        carry = Math.floor(prod / 10);

        if (carry > 0 && ai === digitsA.length - 1) {
          layers.push(
            digitLayer(
              carry,
              col + 1,
              totalCols,
              partialRow,
              frame,
              estFrames,
              cfg,
            ),
          );
        }
      }
      frame += cfg.resultFrames;
    }

    // 5. Second line before sum
    const sumLineRow = 3 + digitsB.length;
    layers.push(lineLayer(sumLineRow, totalCols, frame, estFrames, cfg));
    frame += cfg.lineFrames;

    // 6. Final result (sum of partials)
    const resultRow = sumLineRow + 1;
    for (let i = 0; i < digitsR.length; i++) {
      const col = digitsR.length - 1 - i;
      layers.push(
        digitLayer(
          digitsR[i]!,
          col,
          totalCols,
          resultRow,
          frame,
          estFrames,
          cfg,
        ),
      );
    }
    frame += cfg.resultFrames;
  } else {
    // single digit b: directly compute result in row 3
    const db = digitsB[0]!;
    let carry = 0;
    const resultRow = 3;

    for (let ai = 0; ai < digitsA.length; ai++) {
      const da = digitAtFromRight(digitsA, ai);
      const prod = da * db + carry;
      const col = ai;

      layers.push(
        highlightLayer(
          col,
          totalCols,
          [0, 1],
          frame,
          cfg.highlightFrames,
          estFrames,
          cfg,
        ),
      );
      frame += cfg.highlightFrames;

      layers.push(
        digitLayer(prod % 10, col, totalCols, resultRow, frame, estFrames, cfg),
      );
      frame += cfg.resultFrames;

      carry = Math.floor(prod / 10);
      if (carry > 0) {
        layers.push(
          carryLayer(carry, ai + 1, totalCols, 0, frame, estFrames, cfg),
        );
        if (ai < digitsA.length - 1) {
          frame += cfg.carryFrames;
        }
      }
    }

    if (carry > 0) {
      const col = digitsA.length;
      layers.push(
        digitLayer(carry, col, totalCols, resultRow, frame, estFrames, cfg),
      );
      frame += cfg.resultFrames;
    }
  }

  frame += 10; // hold

  const { w, h } = canvasSize(totalCols, totalRows, cfg);
  return {
    v: "5.7.0",
    fr: cfg.fps,
    ip: 0,
    op: frame,
    w,
    h,
    ddd: 0,
    assets: ASSETS,
    layers,
  };
}
