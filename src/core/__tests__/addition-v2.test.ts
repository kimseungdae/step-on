import { describe, it, expect } from "vitest";
import { prepare } from "../generate";
import { compileAddition } from "../compiler/addition";

describe("compileAddition", () => {
  it("12+34 no carry: setup + 2 col steps + confirm", () => {
    const result = compileAddition({ a: 12, b: 34, op: "+" });
    const ids = result.steps.map((s) => s.id);
    expect(ids).toContain("setup");
    expect(ids).toContain("col-0");
    expect(ids).toContain("col-1");
    expect(ids).toContain("confirm");
    expect(ids).not.toContain("final-carry");

    // No splitBase10 actions (no carry)
    for (const step of result.steps) {
      for (const sub of step.subSteps) {
        expect(sub.action.type).not.toBe("splitBase10");
      }
    }
  });

  it("27+35 carry: col-0 splits result then moves ones down + carry up", () => {
    const result = compileAddition({ a: 27, b: 35, op: "+" });

    const col0 = result.steps.find((s) => s.id === "col-0")!;
    const actionTypes = col0.subSteps.map((s) => s.action.type);
    expect(actionTypes).toContain("revealResult");
    expect(actionTypes).toContain("splitBase10");
    expect(actionTypes).toContain("moveToken");
    expect(actionTypes).toContain("snapToCell");
    expect(actionTypes).toContain("convertToCarryChip");
    expect(actionTypes).toContain("moveChip");
  });

  it("27+35 col-1 TTS includes carry", () => {
    const result = compileAddition({ a: 27, b: 35, op: "+" });
    const col1 = result.steps.find((s) => s.id === "col-1")!;
    expect(col1.ttsText).toContain("1 + 2 + 3");
  });

  it("999+1 cascade carry: 3 col steps + final-carry", () => {
    const result = compileAddition({ a: 999, b: 1, op: "+" });
    const ids = result.steps.map((s) => s.id);
    expect(ids).toContain("col-0");
    expect(ids).toContain("col-1");
    expect(ids).toContain("col-2");
    expect(ids).toContain("final-carry");
  });

  it("5+123 different digit counts", () => {
    const result = compileAddition({ a: 5, b: 123, op: "+" });
    expect(result.numCols).toBe(4); // 3 digits + 1
    const confirm = result.steps.find((s) => s.id === "confirm")!;
    expect(confirm.ttsText).toBe("5 + 123 = 128");
  });
});

describe("prepare (addition end-to-end)", () => {
  it("12+34 produces valid PrepareResult", () => {
    const result = prepare({ a: 12, b: 34, op: "+" });
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.layout.canvasWidth).toBeGreaterThan(0);
    expect(result.layout.canvasHeight).toBeGreaterThan(0);
    expect(result.config.fps).toBe(30);
  });

  it("999+1=1000 produces final carry step", () => {
    const result = prepare({ a: 999, b: 1, op: "+" });
    const hasFinalCarry = result.steps.some((s) => s.id === "final-carry");
    expect(hasFinalCarry).toBe(true);
    expect(result.steps.find((s) => s.id === "confirm")!.ttsText).toBe(
      "999 + 1 = 1000",
    );
  });
});
