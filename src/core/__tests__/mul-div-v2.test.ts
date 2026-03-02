import { describe, it, expect } from "vitest";
import { generate } from "../generate";
import { compileMultiplication } from "../compiler/multiplication";
import { compileDivision } from "../compiler/division";

describe("compileMultiplication", () => {
  it("3×4 single digit: setup + col steps + confirm", () => {
    const result = compileMultiplication({ a: 3, b: 4, op: "×" });
    const ids = result.steps.map((s) => s.id);
    expect(ids).toContain("setup");
    expect(ids).toContain("col-0");
    expect(ids).toContain("confirm");
    expect(result.steps.find((s) => s.id === "confirm")!.ttsText).toBe(
      "3 × 4 = 12",
    );
  });

  it("23×4 single digit with carry", () => {
    const result = compileMultiplication({ a: 23, b: 4, op: "×" });
    const ids = result.steps.map((s) => s.id);
    expect(ids).toContain("col-0");
    expect(ids).toContain("col-1");
    expect(result.steps.find((s) => s.id === "confirm")!.ttsText).toBe(
      "23 × 4 = 92",
    );
  });

  it("12×34 multi digit: has partial products + sum", () => {
    const result = compileMultiplication({ a: 12, b: 34, op: "×" });
    const ids = result.steps.map((s) => s.id);
    expect(ids).toContain("partial-0");
    expect(ids).toContain("partial-1");
    expect(ids).toContain("sum");
    expect(ids).toContain("confirm");
    expect(result.steps.find((s) => s.id === "confirm")!.ttsText).toBe(
      "12 × 34 = 408",
    );
  });

  it("99×9 carry cascade", () => {
    const result = compileMultiplication({ a: 99, b: 9, op: "×" });
    expect(result.steps.find((s) => s.id === "confirm")!.ttsText).toBe(
      "99 × 9 = 891",
    );
  });
});

describe("compileDivision", () => {
  it("84÷4 = 21", () => {
    const result = compileDivision({ a: 84, b: 4, op: "÷" });
    const confirm = result.steps.find((s) => s.id === "confirm")!;
    expect(confirm.ttsText).toBe("84 ÷ 4 = 21");
  });

  it("100÷5 = 20", () => {
    const result = compileDivision({ a: 100, b: 5, op: "÷" });
    const confirm = result.steps.find((s) => s.id === "confirm")!;
    expect(confirm.ttsText).toBe("100 ÷ 5 = 20");
  });

  it("10÷3 = 3 remainder 1", () => {
    const result = compileDivision({ a: 10, b: 3, op: "÷" });
    const confirm = result.steps.find((s) => s.id === "confirm")!;
    expect(confirm.ttsText).toBe("10 ÷ 3 = 3 나머지 1");
  });

  it("144÷12 = 12", () => {
    const result = compileDivision({ a: 144, b: 12, op: "÷" });
    const confirm = result.steps.find((s) => s.id === "confirm")!;
    expect(confirm.ttsText).toBe("144 ÷ 12 = 12");
  });

  it("has setup + div-steps + confirm", () => {
    const result = compileDivision({ a: 84, b: 4, op: "÷" });
    const ids = result.steps.map((s) => s.id);
    expect(ids[0]).toBe("setup");
    expect(ids[ids.length - 1]).toBe("confirm");
    expect(ids.some((id) => id.startsWith("div-step-"))).toBe(true);
  });
});

describe("generate (mul/div end-to-end)", () => {
  it("23×4 produces valid Lottie", () => {
    const result = generate({ a: 23, b: 4, op: "×" });
    expect(result.animation.op).toBeGreaterThan(0);
    expect(result.animation.layers.length).toBeGreaterThan(0);
    for (const layer of result.animation.layers) {
      expect(layer.op).toBeGreaterThan(0);
      expect(layer.op).toBeLessThanOrEqual(result.animation.op);
    }
  });

  it("12×34 produces valid Lottie", () => {
    const result = generate({ a: 12, b: 34, op: "×" });
    expect(result.animation.op).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it("84÷4 produces valid Lottie", () => {
    const result = generate({ a: 84, b: 4, op: "÷" });
    expect(result.animation.op).toBeGreaterThan(0);
    expect(result.animation.layers.length).toBeGreaterThan(0);
    for (const layer of result.animation.layers) {
      expect(layer.op).toBeGreaterThan(0);
      expect(layer.op).toBeLessThanOrEqual(result.animation.op);
    }
  });

  it("144÷12 produces valid Lottie", () => {
    const result = generate({ a: 144, b: 12, op: "÷" });
    expect(result.animation.op).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it("all 4 operations produce consistent output", () => {
    const ops = [
      { a: 47, b: 58, op: "+" as const },
      { a: 100, b: 37, op: "-" as const },
      { a: 23, b: 4, op: "×" as const },
      { a: 84, b: 4, op: "÷" as const },
    ];
    for (const problem of ops) {
      const result = generate(problem);
      expect(result.animation.v).toBe("5.7.4");
      expect(result.animation.fr).toBe(30);
      expect(result.animation.op).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.animation.markers?.length).toBe(result.steps.length);
    }
  });
});
