import { describe, it, expect } from "vitest";
import { generate } from "../generate";
import { compileAddition } from "../compiler/addition";
import type { Problem } from "../types";

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

describe("generate (addition end-to-end)", () => {
  it("12+34 produces valid LottieAnimation", () => {
    const result = generate({ a: 12, b: 34, op: "+" });
    expect(result.animation.v).toBe("5.7.4");
    expect(result.animation.fr).toBe(30);
    expect(result.animation.op).toBeGreaterThan(0);
    expect(result.animation.layers.length).toBeGreaterThan(0);
    expect(result.animation.w).toBeGreaterThan(0);
    expect(result.animation.h).toBeGreaterThan(0);
    expect(result.animation.fonts?.list.length).toBe(1);
  });

  it("12+34 StepMeta frames are sequential", () => {
    const result = generate({ a: 12, b: 34, op: "+" });
    for (let i = 1; i < result.steps.length; i++) {
      expect(result.steps[i].startFrame).toBeGreaterThanOrEqual(
        result.steps[i - 1].endFrame,
      );
    }
  });

  it("12+34 markers match steps", () => {
    const result = generate({ a: 12, b: 34, op: "+" });
    expect(result.animation.markers?.length).toBe(result.steps.length);
    for (let i = 0; i < result.steps.length; i++) {
      expect(result.animation.markers![i].cm).toBe(result.steps[i].markerName);
    }
  });

  it("27+35=62 result layers contain correct digits", () => {
    const result = generate({ a: 27, b: 35, op: "+" });
    const textLayers = result.animation.layers
      .filter((l) => l.ty === 5 && l.t)
      .map((l) => l.t!.d.k[0].s.t);
    // Result digits 2 and 6 should be present
    expect(textLayers).toContain("2");
    expect(textLayers).toContain("6");
  });

  it("999+1=1000 produces final carry step", () => {
    const result = generate({ a: 999, b: 1, op: "+" });
    const hasFinalCarry = result.steps.some((s) => s.id === "final-carry");
    expect(hasFinalCarry).toBe(true);
    expect(result.steps.find((s) => s.id === "confirm")!.ttsText).toBe(
      "999 + 1 = 1000",
    );
  });

  it("all layers have valid op (0 < op <= totalFrames)", () => {
    const result = generate({ a: 47, b: 58, op: "+" });
    for (const layer of result.animation.layers) {
      expect(layer.op).toBeGreaterThan(0);
      expect(layer.op).toBeLessThanOrEqual(result.animation.op);
    }
  });
});
