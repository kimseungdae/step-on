import type { Config, LottieAnimation, LottieLayer } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { ASSETS } from "./assets";
import { toDigits, digitAtFromRight, canvasSize } from "./coord";
import {
  resetLayerIdx,
  digitLayer,
  operatorLayer,
  lineLayer,
  borrowLayer,
  highlightLayer,
} from "./layers";

export function generateSubtraction(
  a: number,
  b: number,
  config: Partial<Config> = {},
): LottieAnimation {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  resetLayerIdx();

  const digitsA = toDigits(a);
  const digitsB = toDigits(b);
  const result = a - b;
  const digitsR = toDigits(result);
  const maxLen = Math.max(digitsA.length, digitsB.length);
  const totalCols = maxLen + 1; // +1 for operator column
  const totalRows = 4; // a, op+b, line, result

  const layers: LottieLayer[] = [];
  let frame = 0;

  const estFrames = (maxLen + 1) * 40 + 60;

  // track current working digits of a (for borrow mutations)
  const workA = digitsA.slice();

  // 1. Place digits of a
  for (let i = 0; i < digitsA.length; i++) {
    const col = digitsA.length - 1 - i;
    layers.push(
      digitLayer(digitsA[i]!, col, totalCols, 0, frame, estFrames, cfg),
    );
  }
  frame += cfg.placeFrames;

  // 2. Place operator + digits of b
  layers.push(
    operatorLayer("-", totalCols - 1, totalCols, 1, frame, estFrames, cfg),
  );
  for (let i = 0; i < digitsB.length; i++) {
    const col = digitsB.length - 1 - i;
    layers.push(
      digitLayer(digitsB[i]!, col, totalCols, 1, frame, estFrames, cfg),
    );
  }
  frame += cfg.placeFrames;

  // 3. Line
  layers.push(lineLayer(2, totalCols, frame, estFrames, cfg));
  frame += cfg.lineFrames;

  // 4. Calculate right to left with borrow
  for (let i = 0; i < maxLen; i++) {
    const posA = workA.length - 1 - i;
    let da = posA >= 0 ? workA[posA]! : 0;
    const db = digitAtFromRight(digitsB, i);
    const col = i;

    // highlight
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

    // borrow if needed
    if (da < db) {
      // find next non-zero digit to borrow from
      let borrowFrom = posA - 1;
      while (borrowFrom >= 0 && workA[borrowFrom]! === 0) {
        borrowFrom--;
      }

      if (borrowFrom >= 0) {
        // cascade borrow: reduce source by 1, set intermediate zeros to 9, add 10 to current
        const oldSource = workA[borrowFrom]!;
        workA[borrowFrom] = oldSource - 1;
        const borrowCol = workA.length - 1 - borrowFrom;
        layers.push(
          ...borrowLayer(
            oldSource,
            workA[borrowFrom]!,
            borrowCol,
            totalCols,
            0,
            frame,
            estFrames,
            cfg,
          ),
        );

        for (let j = borrowFrom + 1; j < posA; j++) {
          workA[j] = 9;
          const zCol = workA.length - 1 - j;
          layers.push(
            ...borrowLayer(0, 9, zCol, totalCols, 0, frame, estFrames, cfg),
          );
        }

        workA[posA] = da + 10;
        da = workA[posA]!;
        layers.push(
          ...borrowLayer(da - 10, da, col, totalCols, 0, frame, estFrames, cfg),
        );
        frame += cfg.carryFrames;
      }
    }

    // result digit
    const diff = da - db;
    layers.push(digitLayer(diff, col, totalCols, 3, frame, estFrames, cfg));
    frame += cfg.resultFrames;
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
