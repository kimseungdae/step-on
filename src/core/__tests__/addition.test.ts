import { describe, it, expect } from "vitest";
import { generateAddition } from "../addition";
import type { LottieAnimation } from "../types";

function findDigitLayers(anim: LottieAnimation, row: number) {
  return anim.layers.filter(
    (l) =>
      l.ty === 0 &&
      l.refId?.startsWith("d") &&
      !l.refId.startsWith("d-") &&
      l.ks.s === undefined && // exclude carry (scaled 70%)
      getRow(l, anim) === row,
  );
}

function getRow(layer: { ks: { p: { k: unknown } } }, anim: LottieAnimation) {
  const p = layer.ks.p;
  const y = Array.isArray(p.k) && typeof p.k[0] === "number" ? p.k[1] : NaN;
  if (isNaN(y as number)) return -1;
  return Math.round(((y as number) - 32) / 64);
}

function resultDigits(anim: LottieAnimation): number[] {
  const layers = findDigitLayers(anim, 3);
  // sort by x ascending (left to right = reading order)
  layers.sort((a, b) => {
    const ax = (a.ks.p.k as number[])[0];
    const bx = (b.ks.p.k as number[])[0];
    return ax - bx;
  });
  return layers.map((l) => Number(l.refId!.slice(1)));
}

describe("generateAddition", () => {
  it("produces valid Lottie structure", () => {
    const anim = generateAddition(12, 34);
    expect(anim.v).toBe("5.7.0");
    expect(anim.fr).toBe(30);
    expect(anim.ip).toBe(0);
    expect(anim.op).toBeGreaterThan(0);
    expect(anim.w).toBeGreaterThan(0);
    expect(anim.h).toBeGreaterThan(0);
    expect(anim.ddd).toBe(0);
    expect(anim.assets.length).toBeGreaterThan(0);
    expect(anim.layers.length).toBeGreaterThan(0);
  });

  it("no carry: 12 + 34 = 46", () => {
    const anim = generateAddition(12, 34);
    const digits = resultDigits(anim);
    expect(digits).toEqual([4, 6]);
  });

  it("single carry: 27 + 35 = 62", () => {
    const anim = generateAddition(27, 35);
    const digits = resultDigits(anim);
    expect(digits).toEqual([6, 2]);
    // should have carry layer (scaled 70%)
    const carryLayers = anim.layers.filter(
      (l) => l.ty === 0 && l.ks.s !== undefined,
    );
    expect(carryLayers.length).toBe(1);
  });

  it("cascading carry: 999 + 1 = 1000", () => {
    const anim = generateAddition(999, 1);
    const digits = resultDigits(anim);
    expect(digits).toEqual([1, 0, 0, 0]);
  });

  it("carry chain: 456 + 789 = 1245", () => {
    const anim = generateAddition(456, 789);
    const digits = resultDigits(anim);
    expect(digits).toEqual([1, 2, 4, 5]);
  });

  it("different digit counts: 5 + 123 = 128", () => {
    const anim = generateAddition(5, 123);
    const digits = resultDigits(anim);
    expect(digits).toEqual([1, 2, 8]);
  });

  it("zero handling: 100 + 200 = 300", () => {
    const anim = generateAddition(100, 200);
    const digits = resultDigits(anim);
    expect(digits).toEqual([3, 0, 0]);
  });

  it("has operator layer", () => {
    const anim = generateAddition(1, 2);
    const opLayer = anim.layers.find(
      (l) => l.ty === 0 && l.refId === "op_plus",
    );
    expect(opLayer).toBeDefined();
  });

  it("has line layer", () => {
    const anim = generateAddition(1, 2);
    const lineLayers = anim.layers.filter((l) => l.ty === 4 && l.shapes);
    expect(lineLayers.length).toBeGreaterThanOrEqual(1);
  });

  it("frame count increases with more carries", () => {
    const simple = generateAddition(11, 11);
    const complex = generateAddition(999, 1);
    expect(complex.op).toBeGreaterThan(simple.op);
  });

  it("respects custom config", () => {
    const anim = generateAddition(1, 2, { fps: 60 });
    expect(anim.fr).toBe(60);
  });
});
