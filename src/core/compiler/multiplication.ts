import type { Step } from "../dsl/step";
import type { Problem } from "../types";
import type { CompileResult } from "./addition";
import { cell, toSlot } from "../dsl/refs";
import { digitAt, digitCount, colName } from "./helpers";

export function compileMultiplication(problem: Problem): CompileResult {
  const { a, b } = problem;
  const bLen = digitCount(b);

  if (bLen === 1) {
    return compileSingleDigitMul(a, b);
  }
  return compileMultiDigitMul(a, b);
}

function compileSingleDigitMul(a: number, b: number): CompileResult {
  const aLen = digitCount(a);
  const result = a * b;
  const resultLen = digitCount(result);
  const numCols = resultLen + 1;
  const numRows = 3; // A(0), B(1), result(2)
  const opCol = numCols - 1;

  const steps: Step[] = [];

  // Setup
  const setupSubs: Step["subSteps"] = [];
  for (let c = 0; c < aLen; c++) {
    setupSubs.push({
      action: {
        type: "writeCell",
        ref: cell(0, c),
        value: String(digitAt(a, c)),
      },
    });
  }
  setupSubs.push({
    action: { type: "writeCell", ref: cell(1, 0), value: String(b) },
  });
  setupSubs.push({
    action: { type: "showOperator", op: "×", row: 1, col: opCol },
  });
  setupSubs.push({ action: { type: "drawLine", afterRow: 1 } });
  steps.push({
    id: "setup",
    ttsText: `${a} × ${b}를 계산합니다`,
    subSteps: setupSubs,
  });

  // Process columns
  let carry = 0;
  for (let c = 0; c < aLen; c++) {
    const da = digitAt(a, c);
    const prod = da * b + carry;
    const digit = prod % 10;
    const newCarry = Math.floor(prod / 10);
    const isLast = c === aLen - 1;

    const colSubs: Step["subSteps"] = [];
    colSubs.push({ action: { type: "highlight", col: c, rows: [0, 1] } });
    colSubs.push({ action: { type: "showMinibox", nearRow: 0 } });
    colSubs.push({
      action: {
        type: "composeExpression",
        parts: [String(da), "×", String(b)],
      },
    });

    if (carry > 0) {
      colSubs.push({
        action: {
          type: "label",
          text: `+${carry}`,
          target: toSlot("carry-prefix"),
          color: [0.85, 0.2, 0.2],
        },
      });
    }

    colSubs.push({
      action: {
        type: "revealResult",
        value: String(prod),
        tokenId: `prod-${c}`,
      },
    });

    // Write result
    colSubs.push({
      action: { type: "writeCell", ref: cell(2, c), value: String(digit) },
    });
    if (isLast && newCarry > 0) {
      colSubs.push({
        action: {
          type: "writeCell",
          ref: cell(2, c + 1),
          value: String(newCarry),
        },
      });
    }

    colSubs.push({ action: { type: "clearMinibox" } });
    colSubs.push({ action: { type: "hideMinibox" } });
    colSubs.push({ action: { type: "unhighlight", col: c } });

    const exprText =
      carry > 0
        ? `${da} × ${b} + ${carry} = ${prod}`
        : `${da} × ${b} = ${prod}`;
    steps.push({
      id: `col-${c}`,
      ttsText: `${colName(c)}: ${exprText}`,
      subSteps: colSubs,
    });

    carry = newCarry;
  }

  // Confirm
  steps.push({
    id: "confirm",
    ttsText: `${a} × ${b} = ${result}`,
    subSteps: [
      {
        action: {
          type: "confirmPulse",
          rows: [2],
          cols: Array.from({ length: resultLen }, (_, i) => i),
        },
      },
    ],
  });

  return { steps, numCols, numRows };
}

function compileMultiDigitMul(a: number, b: number): CompileResult {
  const bLen = digitCount(b);
  const result = a * b;
  const resultLen = digitCount(result);
  const numCols = resultLen + 1;
  const numRows = 2 + bLen + 1; // A, B, bLen partials, result
  const opCol = numCols - 1;
  const aLen = digitCount(a);

  const steps: Step[] = [];

  // Setup
  const setupSubs: Step["subSteps"] = [];
  for (let c = 0; c < aLen; c++) {
    setupSubs.push({
      action: {
        type: "writeCell",
        ref: cell(0, c),
        value: String(digitAt(a, c)),
      },
    });
  }
  for (let c = 0; c < bLen; c++) {
    setupSubs.push({
      action: {
        type: "writeCell",
        ref: cell(1, c),
        value: String(digitAt(b, c)),
      },
    });
  }
  setupSubs.push({
    action: { type: "showOperator", op: "×", row: 1, col: opCol },
  });
  setupSubs.push({ action: { type: "drawLine", afterRow: 1 } });
  steps.push({
    id: "setup",
    ttsText: `${a} × ${b}를 계산합니다`,
    subSteps: setupSubs,
  });

  // Partial products
  for (let k = 0; k < bLen; k++) {
    const bDigit = digitAt(b, k);
    const partial = a * bDigit;
    const partialRow = 2 + k;

    const partialSubs: Step["subSteps"] = [];
    partialSubs.push({ action: { type: "highlight", col: k, rows: [1] } });

    // Trailing zeros for shift
    for (let z = 0; z < k; z++) {
      partialSubs.push({
        action: { type: "writeCell", ref: cell(partialRow, z), value: "0" },
      });
    }

    // Write partial product digits
    const pLen = partial === 0 ? 1 : digitCount(partial);
    for (let d = 0; d < pLen; d++) {
      partialSubs.push({
        action: {
          type: "writeCell",
          ref: cell(partialRow, k + d),
          value: String(digitAt(partial, d)),
        },
      });
    }

    partialSubs.push({ action: { type: "unhighlight", col: k } });

    steps.push({
      id: `partial-${k}`,
      ttsText: `${a} × ${bDigit} = ${partial}`,
      subSteps: partialSubs,
    });
  }

  // Sum line and final result
  const resultRow = 2 + bLen;
  const sumSubs: Step["subSteps"] = [];
  sumSubs.push({ action: { type: "drawLine", afterRow: resultRow - 1 } });

  const rLen = digitCount(result);
  for (let d = 0; d < rLen; d++) {
    sumSubs.push({
      action: {
        type: "writeCell",
        ref: cell(resultRow, d),
        value: String(digitAt(result, d)),
      },
    });
  }
  steps.push({
    id: "sum",
    ttsText: `부분곱을 더합니다: ${result}`,
    subSteps: sumSubs,
  });

  // Confirm
  steps.push({
    id: "confirm",
    ttsText: `${a} × ${b} = ${result}`,
    subSteps: [
      {
        action: {
          type: "confirmPulse",
          rows: [resultRow],
          cols: Array.from({ length: rLen }, (_, i) => i),
        },
      },
    ],
  });

  return { steps, numCols, numRows };
}
