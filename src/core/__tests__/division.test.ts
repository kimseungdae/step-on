import { describe, it, expect } from "vitest";
import { generateDivision } from "../division";
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

function quotientDigits(anim: LottieAnimation): number[] {
  return digitsAtRow(anim, 0);
}

describe("generateDivision", () => {
  it("produces valid Lottie structure", () => {
    const anim = generateDivision(84, 4);
    expect(anim.v).toBe("5.7.0");
    expect(anim.fr).toBe(30);
    expect(anim.assets.length).toBeGreaterThan(0);
    expect(anim.layers.length).toBeGreaterThan(0);
  });

  it("simple: 84 ÷ 4 = 21", () => {
    const anim = generateDivision(84, 4);
    expect(quotientDigits(anim)).toEqual([2, 1]);
  });

  it("exact: 100 ÷ 5 = 20", () => {
    const anim = generateDivision(100, 5);
    // per-digit long division: 1÷5=0, 10÷5=2, 0÷5=0
    expect(quotientDigits(anim)).toEqual([0, 2, 0]);
  });

  it("single digit: 9 ÷ 3 = 3", () => {
    const anim = generateDivision(9, 3);
    expect(quotientDigits(anim)).toEqual([3]);
  });

  it("with remainder: 10 ÷ 3 = 3 (r1)", () => {
    const anim = generateDivision(10, 3);
    // 1÷3=0, 10÷3=3
    expect(quotientDigits(anim)).toEqual([0, 3]);
  });

  it("144 ÷ 12 = 12", () => {
    const anim = generateDivision(144, 12);
    // 1÷12=0, 14÷12=1, 24÷12=2
    expect(quotientDigits(anim)).toEqual([0, 1, 2]);
  });

  it("has operator layer", () => {
    const anim = generateDivision(8, 4);
    const opLayer = anim.layers.find((l) => l.ty === 0 && l.refId === "op_div");
    expect(opLayer).toBeDefined();
  });

  it("has line layers", () => {
    const anim = generateDivision(84, 4);
    const shapeLines = anim.layers.filter((l) => l.ty === 4 && l.shapes);
    expect(shapeLines.length).toBeGreaterThanOrEqual(1);
  });

  it("more steps produce more layers", () => {
    const simple = generateDivision(8, 4);
    const complex = generateDivision(144, 12);
    expect(complex.layers.length).toBeGreaterThan(simple.layers.length);
  });

  it("respects custom config", () => {
    const anim = generateDivision(8, 4, { fps: 60 });
    expect(anim.fr).toBe(60);
  });
});
