import { describe, it, expect } from "vitest";
import { generate } from "../generate";
import { compileSubtraction } from "../compiler/subtraction";

describe("compileSubtraction", () => {
  it("56-23 no borrow: setup + 2 col steps + confirm", () => {
    const result = compileSubtraction({ a: 56, b: 23, op: "-" });
    const ids = result.steps.map((s) => s.id);
    expect(ids).toEqual(["setup", "col-0", "col-1", "confirm"]);

    // No borrow actions
    for (const step of result.steps) {
      for (const sub of step.subSteps) {
        expect(sub.action.type).not.toBe("shake");
        expect(sub.action.type).not.toBe("decrementDigit");
      }
    }
  });

  it("42-17 borrow: col-0 has shake + decrementDigit + spawnTenBlock", () => {
    const result = compileSubtraction({ a: 42, b: 17, op: "-" });

    const col0 = result.steps.find((s) => s.id === "col-0")!;
    const types = col0.subSteps.map((s) => s.action.type);
    expect(types).toContain("shake");
    expect(types).toContain("decrementDigit");
    expect(types).toContain("spawnTenBlock");
    expect(types).toContain("mergeTenWithOnes");
  });

  it("42-17 col-0 TTS shows 12 - 7 after borrow", () => {
    const result = compileSubtraction({ a: 42, b: 17, op: "-" });
    const col0 = result.steps.find((s) => s.id === "col-0")!;
    expect(col0.ttsText).toContain("12");
    expect(col0.ttsText).toContain("7");
    expect(col0.ttsText).toContain("5");
  });

  it("100-1 cascade borrow: col-0 has multiple decrementDigit", () => {
    const result = compileSubtraction({ a: 100, b: 1, op: "-" });

    const col0 = result.steps.find((s) => s.id === "col-0")!;
    const decrements = col0.subSteps.filter(
      (s) => s.action.type === "decrementDigit",
    );
    // Decrement col 2 (1→0) and intermediate col 1 (0→9)
    expect(decrements.length).toBe(2);
  });

  it("1000-1 deep cascade borrow", () => {
    const result = compileSubtraction({ a: 1000, b: 1, op: "-" });
    const col0 = result.steps.find((s) => s.id === "col-0")!;
    const decrements = col0.subSteps.filter(
      (s) => s.action.type === "decrementDigit",
    );
    // Decrement col 3 (1→0) + intermediates col 2 (0→9) + col 1 (0→9)
    expect(decrements.length).toBe(3);

    const confirm = result.steps.find((s) => s.id === "confirm")!;
    expect(confirm.ttsText).toBe("1000 - 1 = 999");
  });
});

describe("generate (subtraction end-to-end)", () => {
  it("56-23 produces valid Lottie", () => {
    const result = generate({ a: 56, b: 23, op: "-" });
    expect(result.animation.op).toBeGreaterThan(0);
    expect(result.animation.layers.length).toBeGreaterThan(0);
  });

  it("42-17=25 StepMeta sequential", () => {
    const result = generate({ a: 42, b: 17, op: "-" });
    for (let i = 1; i < result.steps.length; i++) {
      expect(result.steps[i].startFrame).toBeGreaterThanOrEqual(
        result.steps[i - 1].endFrame,
      );
    }
  });

  it("42-17=25 all layers have valid op", () => {
    const result = generate({ a: 42, b: 17, op: "-" });
    for (const layer of result.animation.layers) {
      expect(layer.op).toBeGreaterThan(0);
      expect(layer.op).toBeLessThanOrEqual(result.animation.op);
    }
  });

  it("100-1=99 produces correct confirm", () => {
    const result = generate({ a: 100, b: 1, op: "-" });
    const confirm = result.steps.find((s) => s.id === "confirm")!;
    expect(confirm.ttsText).toBe("100 - 1 = 99");
  });
});
