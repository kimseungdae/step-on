import { describe, it, expect } from "vitest";
import { generateMultiplication } from "../multiplication";
import type { LottieAnimation } from "../types";

function findDigitLayersAtRow(anim: LottieAnimation, row: number) {
  return anim.layers.filter((l) => {
    if (l.ty !== 0 || !l.refId?.startsWith("d")) return false;
    const p = l.ks.p;
    const y = Array.isArray(p.k) && typeof p.k[0] === "number" ? p.k[1] : NaN;
    if (isNaN(y as number)) return false;
    const r = Math.round(((y as number) - 32) / 64);
    return r === row && l.ks.s === undefined;
  });
}

function digitsAtRow(anim: LottieAnimation, row: number): number[] {
  const layers = findDigitLayersAtRow(anim, row);
  layers.sort((a, b) => {
    const ax = (a.ks.p.k as number[])[0];
    const bx = (b.ks.p.k as number[])[0];
    return ax - bx;
  });
  return layers.map((l) => Number(l.refId!.slice(1)));
}

describe("generateMultiplication", () => {
  it("produces valid Lottie structure", () => {
    const anim = generateMultiplication(12, 3);
    expect(anim.v).toBe("5.7.0");
    expect(anim.fr).toBe(30);
    expect(anim.assets.length).toBeGreaterThan(0);
    expect(anim.layers.length).toBeGreaterThan(0);
  });

  it("single digit × single digit: 3 × 4 = 12", () => {
    const anim = generateMultiplication(3, 4);
    // single digit b → result at row 3
    expect(digitsAtRow(anim, 3)).toEqual([1, 2]);
  });

  it("multi × single: 23 × 4 = 92", () => {
    const anim = generateMultiplication(23, 4);
    expect(digitsAtRow(anim, 3)).toEqual([9, 2]);
  });

  it("multi × multi: 12 × 34 = 408", () => {
    const anim = generateMultiplication(12, 34);
    // partial products at row 3,4 → final result at row 6
    expect(digitsAtRow(anim, 3)).toEqual([4, 8]); // 12×4=48
    expect(digitsAtRow(anim, 4)).toEqual([3, 6, 0]); // 12×3=36, shifted
    expect(digitsAtRow(anim, 6)).toEqual([4, 0, 8]);
  });

  it("carry in single digit: 99 × 9 = 891", () => {
    const anim = generateMultiplication(99, 9);
    expect(digitsAtRow(anim, 3)).toEqual([8, 9, 1]);
  });

  it("has operator layer", () => {
    const anim = generateMultiplication(2, 3);
    const opLayer = anim.layers.find((l) => l.ty === 0 && l.refId === "op_mul");
    expect(opLayer).toBeDefined();
  });

  it("has line layers", () => {
    const anim = generateMultiplication(12, 34);
    const shapeLines = anim.layers.filter((l) => l.ty === 4 && l.shapes);
    // first line + second line (for multi-digit b)
    expect(shapeLines.length).toBeGreaterThanOrEqual(2);
  });

  it("multi × multi has more layers than single", () => {
    const single = generateMultiplication(12, 3);
    const multi = generateMultiplication(12, 34);
    expect(multi.layers.length).toBeGreaterThan(single.layers.length);
  });

  it("respects custom config", () => {
    const anim = generateMultiplication(2, 3, { fps: 60 });
    expect(anim.fr).toBe(60);
  });

  it("100 × 10 = 1000", () => {
    const anim = generateMultiplication(100, 10);
    // multi digit b → final result at last row
    const totalRows = 3 + 2 + 1 + 1; // header + 2 partials + line + result
    expect(digitsAtRow(anim, totalRows - 1)).toEqual([1, 0, 0, 0]);
  });
});
