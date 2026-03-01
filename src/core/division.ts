import type { Config, LottieAnimation, LottieLayer } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { ASSETS } from "./assets";
import { toDigits, canvasSize } from "./coord";
import {
  resetLayerIdx,
  digitLayer,
  operatorLayer,
  lineLayer,
  highlightLayer,
} from "./layers";

export function generateDivision(
  a: number,
  b: number,
  config: Partial<Config> = {},
): LottieAnimation {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  resetLayerIdx();

  const quotient = Math.floor(a / b);
  const remainder = a % b;
  const digitsA = toDigits(a);
  const digitsQ = toDigits(quotient);

  // Long division layout:
  // row 0: quotient (right-aligned above dividend)
  // row 1: divisor ÷ | dividend  (with line under quotient)
  // row 2+: repeating blocks of: subtract line, partial product, remainder
  //
  // Simplified layout for clarity:
  // row 0: quotient digits
  // row 1: b ) a  (divisor, bracket implied by operator, dividend)
  // row 2: line under dividend
  // then for each step: subtract, line, bring-down result

  // calculate steps: one per digit of dividend processed
  const steps: {
    partialDividend: number;
    qDigit: number;
    product: number;
    remainder: number;
  }[] = [];
  let running = 0;
  for (let i = 0; i < digitsA.length; i++) {
    running = running * 10 + digitsA[i]!;
    const qd = Math.floor(running / b);
    const prod = qd * b;
    const rem = running - prod;
    steps.push({
      partialDividend: running,
      qDigit: qd,
      product: prod,
      remainder: rem,
    });
    running = rem;
  }

  // layout dimensions
  const maxDigits = Math.max(digitsA.length, digitsQ.length + 1);
  const totalCols = maxDigits + 2; // +1 for divisor col, +1 padding
  const divStepRows = steps.length * 2; // each step: product row + remainder row
  const totalRows = 2 + 1 + divStepRows + 1; // quotient, dividend, line, steps, hold
  const estFrames = (steps.length * 3 + 4) * 30 + 60;

  const layers: LottieLayer[] = [];
  let frame = 0;

  // 1. Place divisor on left
  const divisorDigits = toDigits(b);
  for (let i = 0; i < divisorDigits.length; i++) {
    const col = totalCols - 1 - i;
    layers.push(
      digitLayer(
        divisorDigits[divisorDigits.length - 1 - i]!,
        col,
        totalCols,
        1,
        frame,
        estFrames,
        cfg,
      ),
    );
  }

  // 2. Place operator (÷) next to divisor
  layers.push(
    operatorLayer(
      "÷",
      totalCols - divisorDigits.length - 1,
      totalCols,
      1,
      frame,
      estFrames,
      cfg,
    ),
  );
  frame += cfg.placeFrames;

  // 3. Place dividend digits
  for (let i = 0; i < digitsA.length; i++) {
    const col = digitsA.length - 1 - i;
    layers.push(
      digitLayer(digitsA[i]!, col, totalCols, 1, frame, estFrames, cfg),
    );
  }
  frame += cfg.placeFrames;

  // 4. Line under dividend
  layers.push(lineLayer(2, totalCols, frame, estFrames, cfg));
  frame += cfg.lineFrames;

  // 5. Process each step
  let currentRow = 3;
  for (let si = 0; si < steps.length; si++) {
    const step = steps[si]!;

    // quotient digit (row 0, aligned with dividend digit position)
    const qCol = digitsA.length - 1 - si;
    layers.push(
      highlightLayer(
        qCol,
        totalCols,
        [1],
        frame,
        cfg.highlightFrames,
        estFrames,
        cfg,
      ),
    );
    frame += cfg.highlightFrames;

    layers.push(
      digitLayer(step.qDigit, qCol, totalCols, 0, frame, estFrames, cfg),
    );
    frame += cfg.resultFrames;

    // product (what we subtract)
    if (step.product > 0 || si < steps.length - 1) {
      const prodDigits = toDigits(step.product);
      for (let pi = 0; pi < prodDigits.length; pi++) {
        const col = qCol - (prodDigits.length - 1 - pi);
        layers.push(
          digitLayer(
            prodDigits[pi]!,
            col,
            totalCols,
            currentRow,
            frame,
            estFrames,
            cfg,
          ),
        );
      }
      frame += cfg.resultFrames;

      // subtract line
      currentRow++;
      layers.push(lineLayer(currentRow, totalCols, frame, estFrames, cfg));
      frame += cfg.lineFrames;

      // remainder
      if (step.remainder > 0) {
        const remDigits = toDigits(step.remainder);
        for (let ri = 0; ri < remDigits.length; ri++) {
          const col = qCol - (remDigits.length - 1 - ri);
          layers.push(
            digitLayer(
              remDigits[ri]!,
              col,
              totalCols,
              currentRow,
              frame,
              estFrames,
              cfg,
            ),
          );
        }
      } else {
        layers.push(
          digitLayer(0, qCol, totalCols, currentRow, frame, estFrames, cfg),
        );
      }
      frame += cfg.resultFrames;
      currentRow++;
    }
  }

  frame += 10; // hold

  const { w, h } = canvasSize(
    totalCols,
    Math.max(totalRows, currentRow + 1),
    cfg,
  );
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
