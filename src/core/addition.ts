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

export function generateAddition(
  a: number,
  b: number,
  config: Partial<Config> = {},
): LottieAnimation {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  resetLayerIdx();

  const digitsA = toDigits(a);
  const digitsB = toDigits(b);
  const result = a + b;
  const digitsR = toDigits(result);
  const maxLen = Math.max(digitsA.length, digitsB.length);
  const totalCols = digitsR.length + 1; // +1 for operator column
  const totalRows = 4; // a, op+b, line, result

  const layers: LottieLayer[] = [];
  let frame = 0;

  // estimate total frames for layer op range
  const estFrames = (maxLen + 1) * 30 + 60;

  // 1. Place digits of a (right-aligned)
  for (let i = 0; i < digitsA.length; i++) {
    const col = digitsA.length - 1 - i;
    layers.push(
      digitLayer(digitsA[i]!, col, totalCols, 0, frame, estFrames, cfg),
    );
  }
  frame += cfg.placeFrames;

  // 2. Place operator + digits of b
  layers.push(
    operatorLayer("+", totalCols - 1, totalCols, 1, frame, estFrames, cfg),
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

  // 4. Calculate right to left
  let carry = 0;
  for (let i = 0; i < maxLen; i++) {
    const da = digitAtFromRight(digitsA, i);
    const db = digitAtFromRight(digitsB, i);
    const sum = da + db + carry;
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

    // result digit
    layers.push(digitLayer(sum % 10, col, totalCols, 3, frame, estFrames, cfg));
    frame += cfg.resultFrames;

    // carry
    if (sum >= 10) {
      layers.push(carryLayer(1, i + 1, totalCols, 0, frame, estFrames, cfg));
      carry = 1;
      frame += cfg.carryFrames;
    } else {
      carry = 0;
    }
  }

  // leading carry digit in result
  if (carry) {
    const col = maxLen;
    layers.push(digitLayer(1, col, totalCols, 3, frame, estFrames, cfg));
    frame += cfg.resultFrames;
  }

  frame += 10; // hold at end

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
