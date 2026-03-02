import type { Step } from "../dsl/step";
import type { Problem } from "../types";
import type { CompileResult } from "./addition";
import { cell } from "../dsl/refs";
import { digitCount } from "./helpers";

export function compileDivision(problem: Problem): CompileResult {
  const { a, b } = problem;
  const quotient = Math.floor(a / b);
  const remainder = a % b;
  const aDigits = a.toString().split("").map(Number);
  const aLen = aDigits.length;
  const dLen = b.toString().length;

  const intermediateSteps = computeDivisionSteps(a, b);
  const numRows = 2 + intermediateSteps.length * 2;
  // Cols 0..aLen-1: dividend/quotient area (col 0 = ones)
  // Col aLen: bracket ")"
  // Cols aLen+1..aLen+dLen: divisor digits
  const numCols = aLen + 1 + dLen;

  const steps: Step[] = [];

  // --- Setup ---
  const setupSubs: Step["subSteps"] = [];

  // Divisor (row 1): ones at col aLen+1, tens at aLen+2, ...
  const divisorStr = b.toString();
  for (let i = 0; i < dLen; i++) {
    setupSubs.push({
      action: {
        type: "writeCell",
        ref: cell(1, aLen + 1 + i),
        value: divisorStr[dLen - 1 - i]!,
      },
    });
  }

  // Bracket
  setupSubs.push({
    action: { type: "showOperator", op: ")", row: 1, col: aLen },
  });

  // Dividend (row 1)
  for (let i = 0; i < aLen; i++) {
    setupSubs.push({
      action: {
        type: "writeCell",
        ref: cell(1, aLen - 1 - i),
        value: String(aDigits[i]),
      },
    });
  }

  // Vinculum (line after row 0, spanning dividend area)
  setupSubs.push({
    action: { type: "drawLine", afterRow: 0, fromCol: aLen - 1, toCol: 0 },
  });

  steps.push({
    id: "setup",
    ttsText: `${a} ÷ ${b}를 계산합니다`,
    subSteps: setupSubs,
  });

  // --- Division steps ---
  let currentRow = 2;
  const quotientCols: number[] = [];

  for (let i = 0; i < intermediateSteps.length; i++) {
    const { bringDown, qDigit, product, remain, position } =
      intermediateSteps[i]!;
    const rightCol = aLen - 1 - position;
    const stepSubs: Step["subSteps"] = [];

    // Quotient digit (row 0)
    quotientCols.push(rightCol);
    stepSubs.push({
      action: {
        type: "writeCell",
        ref: cell(0, rightCol),
        value: String(qDigit),
        color: [0.18, 0.6, 0.33],
      },
      delayAfter: 6,
    });

    // Product digits (right-aligned at rightCol)
    const prodStr = product.toString();
    for (let j = 0; j < prodStr.length; j++) {
      const col = rightCol + (prodStr.length - 1 - j);
      stepSubs.push({
        action: {
          type: "writeCell",
          ref: cell(currentRow, col),
          value: prodStr[j]!,
          color: [0.55, 0.27, 0.68],
        },
      });
    }

    // Subtraction line
    const prodLeftCol = rightCol + prodStr.length - 1;
    stepSubs.push({
      action: {
        type: "drawLine",
        afterRow: currentRow,
        fromCol: prodLeftCol,
        toCol: rightCol,
      },
      delayAfter: 4,
    });
    currentRow++;

    // Remainder digits (right-aligned at rightCol)
    const remainStr = remain.toString();
    for (let j = 0; j < remainStr.length; j++) {
      const col = rightCol + (remainStr.length - 1 - j);
      stepSubs.push({
        action: {
          type: "writeCell",
          ref: cell(currentRow, col),
          value: remainStr[j]!,
          color: [0.85, 0.2, 0.2],
        },
      });
    }

    // Bring down next digit
    if (i < intermediateSteps.length - 1 && position + 1 < aLen) {
      stepSubs.push({
        action: {
          type: "writeCell",
          ref: cell(currentRow, rightCol - 1),
          value: String(aDigits[position + 1]),
        },
        delayAfter: 4,
      });
    }
    currentRow++;

    steps.push({
      id: `div-step-${i}`,
      ttsText: `${bringDown} ÷ ${b} = ${qDigit}, 나머지 ${remain}`,
      subSteps: stepSubs,
    });
  }

  // --- Confirm ---
  const confirmText =
    remainder > 0
      ? `${a} ÷ ${b} = ${quotient} 나머지 ${remainder}`
      : `${a} ÷ ${b} = ${quotient}`;

  steps.push({
    id: "confirm",
    ttsText: confirmText,
    subSteps: [
      {
        action: {
          type: "confirmPulse",
          rows: [0],
          cols: quotientCols,
        },
      },
    ],
  });

  return { steps, numCols, numRows };
}

interface DivStep {
  bringDown: number;
  qDigit: number;
  product: number;
  remain: number;
  position: number;
}

function computeDivisionSteps(a: number, b: number): DivStep[] {
  const result: DivStep[] = [];
  const aStr = a.toString();
  let current = 0;

  for (let i = 0; i < aStr.length; i++) {
    current = current * 10 + Number(aStr[i]);
    const qDigit = Math.floor(current / b);
    const product = qDigit * b;
    const remain = current - product;

    if (result.length > 0 || qDigit > 0) {
      result.push({
        bringDown: current,
        qDigit,
        product,
        remain,
        position: i,
      });
    }

    current = remain;
  }

  if (result.length === 0) {
    result.push({
      bringDown: a,
      qDigit: 0,
      product: 0,
      remain: a,
      position: aStr.length - 1,
    });
  }

  return result;
}
