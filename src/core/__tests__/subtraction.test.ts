import { describe, it, expect } from "vitest";
import { generateSubtraction } from "../subtraction";
import type { LottieAnimation } from "../types";

function findDigitLayers(anim: LottieAnimation, row: number) {
  return anim.layers.filter((l) => {
    if (l.ty !== 0 || !l.refId?.startsWith("d")) return false;
    const p = l.ks.p;
    const y = Array.isArray(p.k) && typeof p.k[0] === "number" ? p.k[1] : NaN;
    if (isNaN(y as number)) return false;
    const r = Math.round(((y as number) - 32) / 64);
    return r === row && l.ks.s === undefined;
  });
}

function resultDigits(anim: LottieAnimation): number[] {
  const layers = findDigitLayers(anim, 3);
  layers.sort((a, b) => {
    const ax = (a.ks.p.k as number[])[0];
    const bx = (b.ks.p.k as number[])[0];
    return ax - bx;
  });
  return layers.map((l) => Number(l.refId!.slice(1)));
}

describe("generateSubtraction", () => {
  it("produces valid Lottie structure", () => {
    const anim = generateSubtraction(34, 12);
    expect(anim.v).toBe("5.7.0");
    expect(anim.fr).toBe(30);
    expect(anim.assets.length).toBeGreaterThan(0);
    expect(anim.layers.length).toBeGreaterThan(0);
  });

  it("no borrow: 56 - 23 = 33", () => {
    const anim = generateSubtraction(56, 23);
    expect(resultDigits(anim)).toEqual([3, 3]);
  });

  it("single borrow: 42 - 17 = 25", () => {
    const anim = generateSubtraction(42, 17);
    expect(resultDigits(anim)).toEqual([2, 5]);
  });

  it("cascading borrow: 100 - 1 = 99", () => {
    const anim = generateSubtraction(100, 1);
    // leading zero shown in column layout
    expect(resultDigits(anim)).toEqual([0, 9, 9]);
  });

  it("cascading borrow through zeros: 1000 - 1 = 999", () => {
    const anim = generateSubtraction(1000, 1);
    expect(resultDigits(anim)).toEqual([0, 9, 9, 9]);
  });

  it("result with leading zeros stripped: 100 - 99 = 1", () => {
    const anim = generateSubtraction(100, 99);
    expect(resultDigits(anim)).toEqual([0, 0, 1]);
  });

  it("same number: 50 - 50 = 0", () => {
    const anim = generateSubtraction(50, 50);
    expect(resultDigits(anim)).toEqual([0, 0]);
  });

  it("3-digit: 500 - 123 = 377", () => {
    const anim = generateSubtraction(500, 123);
    expect(resultDigits(anim)).toEqual([3, 7, 7]);
  });

  it("has operator layer", () => {
    const anim = generateSubtraction(5, 3);
    const opLayer = anim.layers.find(
      (l) => l.ty === 0 && l.refId === "op_minus",
    );
    expect(opLayer).toBeDefined();
  });

  it("has line layer", () => {
    const anim = generateSubtraction(5, 3);
    const lineLayers = anim.layers.filter((l) => l.ty === 4 && l.shapes);
    expect(lineLayers.length).toBeGreaterThanOrEqual(1);
  });

  it("borrow produces extra layers", () => {
    const simple = generateSubtraction(99, 11);
    const borrow = generateSubtraction(42, 17);
    expect(borrow.layers.length).toBeGreaterThan(simple.layers.length);
  });

  it("respects custom config", () => {
    const anim = generateSubtraction(5, 3, { fps: 60 });
    expect(anim.fr).toBe(60);
  });
});
