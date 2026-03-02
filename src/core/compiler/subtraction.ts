import type { Step } from "../dsl/step";
import type { Problem } from "../types";
import type { CompileResult } from "./addition";
import { cell, toSlot } from "../dsl/refs";
import { digitAt, digitCount, colName } from "./helpers";

export function compileSubtraction(problem: Problem): CompileResult {
  const { a, b } = problem;
  const maxDigits = Math.max(digitCount(a), digitCount(b));
  const numCols = maxDigits + 1;
  const numRows = 3; // A(0), B(1), result(2)
  const opCol = numCols - 1;

  const steps: Step[] = [];

  // Working copy of A's digits (mutable for borrows)
  const aDigits: number[] = [];
  for (let c = 0; c < maxDigits; c++) {
    aDigits[c] = digitAt(a, c);
  }

  // Setup
  const setupSubs: Step["subSteps"] = [];
  for (let c = 0; c < maxDigits; c++) {
    if (c < digitCount(a)) {
      setupSubs.push({
        action: {
          type: "writeCell",
          ref: cell(0, c),
          value: String(digitAt(a, c)),
        },
      });
    }
    if (c < digitCount(b)) {
      setupSubs.push({
        action: {
          type: "writeCell",
          ref: cell(1, c),
          value: String(digitAt(b, c)),
        },
      });
    }
  }
  setupSubs.push({
    action: { type: "showOperator", op: "-", row: 1, col: opCol },
  });
  setupSubs.push({
    action: { type: "drawLine", afterRow: 1 },
  });
  steps.push({
    id: "setup",
    ttsText: `${a} - ${b}를 계산합니다`,
    subSteps: setupSubs,
  });

  // Process columns right to left
  for (let c = 0; c < maxDigits; c++) {
    const origDa = aDigits[c]!;
    const db = c < digitCount(b) ? digitAt(b, c) : 0;

    if (origDa === 0 && db === 0 && c >= digitCount(a) && c >= digitCount(b)) {
      continue;
    }

    const needsBorrow = origDa < db;
    const colSubs: Step["subSteps"] = [];

    // Highlight column
    colSubs.push({
      action: { type: "highlight", col: c, rows: [0, 1] },
      delayAfter: 6,
    });
    colSubs.push({ action: { type: "showMinibox", nearRow: 0 } });

    if (needsBorrow) {
      // Show original values first, then shake
      colSubs.push({
        action: {
          type: "composeExpression",
          parts: [String(origDa), "\u2212", String(db)],
        },
        delayAfter: 6,
      });
      colSubs.push({
        action: { type: "shake", ref: cell(0, c) },
        delayAfter: 8,
      });

      // Borrow animation
      colSubs.push(...generateBorrowSubs(aDigits, c));

      // Clear old expression, show new with borrowed value
      colSubs.push({ action: { type: "clearMinibox" } });
      colSubs.push({
        action: { type: "showMinibox", nearRow: 0 },
      });

      const da = aDigits[c]!;
      colSubs.push({
        action: {
          type: "composeExpression",
          parts: [String(da), "\u2212", String(db)],
        },
        delayAfter: 8,
      });

      const diff = da - db;
      colSubs.push({
        action: {
          type: "revealResult",
          value: String(diff),
          tokenId: `diff-${c}`,
        },
        delayAfter: 10,
      });
      colSubs.push({
        action: { type: "writeCell", ref: cell(2, c), value: String(diff) },
        delayAfter: 6,
      });

      // TTS
      const borrowFrom = colName(findBorrowSource(aDigits, origDa, c));
      steps.push({
        id: `col-${c}`,
        ttsText: `${colName(c)}: ${origDa}에서 ${db}를 뺄 수 없어 ${borrowFrom}에서 빌려옵니다. ${da} - ${db} = ${diff}`,
        subSteps: [
          ...colSubs,
          { action: { type: "clearMinibox" } },
          { action: { type: "hideMinibox" } },
          { action: { type: "unhighlight", col: c } },
        ],
      });
    } else {
      const da = aDigits[c]!;

      // Clone digits to minibox
      colSubs.push({
        action: {
          type: "cloneDigit",
          from: cell(0, c),
          tokenId: `da-${c}`,
          to: toSlot("left"),
          value: String(da),
        },
        delayAfter: 4,
      });
      colSubs.push({
        action: {
          type: "cloneDigit",
          from: cell(1, c),
          tokenId: `db-${c}`,
          to: toSlot("right"),
          value: String(db),
        },
        delayAfter: 4,
      });

      // Compose expression
      colSubs.push({
        action: {
          type: "composeExpression",
          parts: [String(da), "\u2212", String(db)],
        },
        delayAfter: 8,
      });

      const diff = da - db;
      colSubs.push({
        action: {
          type: "revealResult",
          value: String(diff),
          tokenId: `diff-${c}`,
        },
        delayAfter: 10,
      });
      colSubs.push({
        action: { type: "writeCell", ref: cell(2, c), value: String(diff) },
        delayAfter: 6,
      });

      // Cleanup
      colSubs.push({ action: { type: "clearMinibox" } });
      colSubs.push({ action: { type: "hideMinibox" } });
      colSubs.push({ action: { type: "unhighlight", col: c } });

      steps.push({
        id: `col-${c}`,
        ttsText: `${colName(c)}: ${da} - ${db} = ${diff}`,
        subSteps: colSubs,
      });
    }
  }

  // Confirm
  const result = a - b;
  const resultLen = Math.max(digitCount(result), 1);
  steps.push({
    id: "confirm",
    ttsText: `${a} - ${b} = ${result}`,
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

function findBorrowSource(
  aDigits: number[],
  origDa: number,
  col: number,
): number {
  // Before borrow was applied, find which column we borrow from
  // Simply the next column (even if it cascades, the user sees "tens place")
  return col + 1;
}

function generateBorrowSubs(aDigits: number[], col: number): Step["subSteps"] {
  const subs: Step["subSteps"] = [];

  // Find nearest non-zero column to borrow from
  let source = col + 1;
  while (source < aDigits.length && aDigits[source] === 0) {
    source++;
  }

  // Decrement source
  const oldSource = aDigits[source]!;
  aDigits[source] = oldSource - 1;
  subs.push({
    action: {
      type: "decrementDigit",
      ref: cell(0, source),
      from: oldSource,
      to: aDigits[source]!,
    },
    delayAfter: 8,
  });

  // Intermediate zeros become 9 (cascade borrow)
  for (let i = source - 1; i > col; i--) {
    aDigits[i] = 9;
    subs.push({
      action: {
        type: "decrementDigit",
        ref: cell(0, i),
        from: 0,
        to: 9,
      },
      delayAfter: 6,
    });
  }

  // Spawn "10" from next column and merge with current
  aDigits[col] = aDigits[col]! + 10;
  subs.push({
    action: {
      type: "spawnTenBlock",
      from: cell(0, col + 1),
      tokenId: `ten-${col}`,
    },
    delayAfter: 6,
  });
  subs.push({
    action: {
      type: "mergeTenWithOnes",
      tenTokenId: `ten-${col}`,
      onesRef: cell(0, col),
      newValue: aDigits[col]!,
    },
    delayAfter: 8,
  });

  return subs;
}
