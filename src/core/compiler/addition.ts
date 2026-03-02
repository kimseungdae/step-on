import type { Step } from "../dsl/step";
import type { Problem } from "../types";
import { cell, toCell, toSlot } from "../dsl/refs";
import { digitAt, digitCount, colName } from "./helpers";

export interface CompileResult {
  steps: Step[];
  numCols: number;
  numRows: number;
}

export function compileAddition(problem: Problem): CompileResult {
  const { a, b } = problem;
  const maxDigits = Math.max(digitCount(a), digitCount(b));
  const numCols = maxDigits + 1;
  const numRows = 4; // carry(0), A(1), B(2), result(3)
  const opCol = numCols - 1;

  const steps: Step[] = [];

  // Setup: write digits, operator, line
  const setupSubs: Step["subSteps"] = [];
  for (let c = 0; c < maxDigits; c++) {
    if (c < digitCount(a)) {
      setupSubs.push({
        action: {
          type: "writeCell",
          ref: cell(1, c),
          value: String(digitAt(a, c)),
        },
      });
    }
    if (c < digitCount(b)) {
      setupSubs.push({
        action: {
          type: "writeCell",
          ref: cell(2, c),
          value: String(digitAt(b, c)),
        },
      });
    }
  }
  setupSubs.push({
    action: { type: "showOperator", op: "+", row: 2, col: opCol },
  });
  setupSubs.push({
    action: { type: "drawLine", afterRow: 2 },
  });
  steps.push({
    id: "setup",
    ttsText: `${a} + ${b}를 계산합니다`,
    subSteps: setupSubs,
  });

  // Process columns right to left
  let carry = 0;
  for (let c = 0; c < maxDigits; c++) {
    const da = c < digitCount(a) ? digitAt(a, c) : 0;
    const db = c < digitCount(b) ? digitAt(b, c) : 0;
    const sum = da + db + carry;
    const resultDigit = sum % 10;
    const newCarry = Math.floor(sum / 10);

    const colSubs: Step["subSteps"] = [];

    // Highlight column (include carry row when carry exists)
    colSubs.push({
      action: {
        type: "highlight",
        col: c,
        rows: carry > 0 ? [0, 1, 2] : [1, 2],
      },
      delayAfter: 6,
    });

    // Show minibox
    colSubs.push({
      action: { type: "showMinibox", nearRow: 1 },
    });

    if (carry > 0) {
      // 5-part expression already includes all values, no separate clone needed
      colSubs.push({
        action: {
          type: "composeExpression",
          parts: [String(carry), "+", String(da), "+", String(db)],
        },
        delayAfter: 8,
      });
    } else {
      // Clone digits to minibox then compose 3-part expression
      colSubs.push({
        action: {
          type: "cloneDigit",
          from: cell(1, c),
          tokenId: `da-${c}`,
          to: toSlot("left"),
          value: String(da),
        },
        delayAfter: 4,
      });
      colSubs.push({
        action: {
          type: "cloneDigit",
          from: cell(2, c),
          tokenId: `db-${c}`,
          to: toSlot("right"),
          value: String(db),
        },
        delayAfter: 4,
      });
      colSubs.push({
        action: {
          type: "composeExpression",
          parts: [String(da), "+", String(db)],
        },
        delayAfter: 8,
      });
    }

    // Reveal result
    colSubs.push({
      action: { type: "revealResult", value: String(sum), tokenId: `sum-${c}` },
      delayAfter: 10,
    });

    if (sum < 10) {
      // Simple: write result digit to cell
      colSubs.push({
        action: {
          type: "writeCell",
          ref: cell(3, c),
          value: String(resultDigit),
        },
        delayAfter: 6,
      });
    } else {
      // Split "=12" → "1" and "2" spread apart from result position
      colSubs.push({
        action: {
          type: "splitBase10",
          sourceTokenId: `sum-${c}`,
          tens: { value: newCarry, tokenId: `tens-${c}` },
          ones: { value: resultDigit, tokenId: `ones-${c}` },
        },
        delayAfter: 6,
      });
      // Move "2" down to result cell
      colSubs.push({
        action: {
          type: "moveToken",
          tokenId: `ones-${c}`,
          to: toCell(cell(3, c)),
        },
        delayAfter: 4,
      });
      // Write permanent result and cleanup ones token
      colSubs.push({
        action: {
          type: "snapToCell",
          tokenId: `ones-${c}`,
          ref: cell(3, c),
          writeValue: String(resultDigit),
        },
        durationFrames: 0,
      });
      // Convert "1" to carry chip and move to carry row
      colSubs.push({
        action: {
          type: "convertToCarryChip",
          tokenId: `tens-${c}`,
          chipId: `carry-${c}`,
          value: newCarry,
        },
        delayAfter: 6,
      });
      colSubs.push({
        action: { type: "moveChip", chipId: `carry-${c}`, to: cell(0, c + 1) },
        delayAfter: 8,
      });
    }

    // Cleanup
    colSubs.push({ action: { type: "clearMinibox" } });
    colSubs.push({ action: { type: "hideMinibox" } });
    colSubs.push({ action: { type: "unhighlight", col: c } });

    const exprText =
      carry > 0
        ? `${carry} + ${da} + ${db} = ${sum}`
        : `${da} + ${db} = ${sum}`;
    steps.push({
      id: `col-${c}`,
      ttsText: `${colName(c)}: ${exprText}`,
      subSteps: colSubs,
    });

    carry = newCarry;
  }

  // Final carry
  if (carry > 0) {
    steps.push({
      id: "final-carry",
      ttsText: `올림 ${carry}을 씁니다`,
      subSteps: [
        {
          action: {
            type: "writeCell",
            ref: cell(3, maxDigits),
            value: String(carry),
          },
        },
      ],
    });
  }

  // Confirm
  const result = a + b;
  const resultLen = digitCount(result);
  steps.push({
    id: "confirm",
    ttsText: `${a} + ${b} = ${result}`,
    subSteps: [
      {
        action: {
          type: "confirmPulse",
          rows: [3],
          cols: Array.from({ length: resultLen }, (_, i) => i),
        },
      },
    ],
  });

  return { steps, numCols, numRows };
}
