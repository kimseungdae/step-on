import { describe, it, expect, beforeEach } from "vitest";
import {
  createTextLayer,
  createRectLayer,
  createLineLayer,
  resetLayerIdx,
} from "../renderer/lottie-builders";
import {
  scalePop,
  scalePulse,
  shakeX,
  arcPosition,
  crossfade,
  shrinkScale,
} from "../renderer/effects";
import { RenderState } from "../renderer/state";
import { createLayout } from "../layout/index";
import { DEFAULT_CONFIG } from "../types";

const cfg = DEFAULT_CONFIG;

describe("lottie-builders", () => {
  beforeEach(() => resetLayerIdx());

  it("createTextLayer produces ty:5 text layer", () => {
    const layer = createTextLayer({
      text: "7",
      pos: { x: 100, y: 50 },
      frame: 10,
      totalFrames: 200,
      config: cfg,
    });
    expect(layer.ty).toBe(5);
    expect(layer.t?.d.k[0].s.t).toBe("7");
    expect(layer.t?.d.k[0].s.fc).toEqual(cfg.fontColor);
  });

  it("createTextLayer respects custom color", () => {
    const layer = createTextLayer({
      text: "3",
      pos: { x: 0, y: 0 },
      frame: 0,
      totalFrames: 100,
      config: cfg,
      color: [1, 0, 0],
    });
    expect(layer.t?.d.k[0].s.fc).toEqual([1, 0, 0]);
  });

  it("createRectLayer produces ty:4 shape layer with rect", () => {
    const layer = createRectLayer({
      x: 10,
      y: 20,
      w: 50,
      h: 60,
      fillColor: [0.3, 0.5, 0.8],
      frame: 5,
      dur: 30,
      totalFrames: 200,
    });
    expect(layer.ty).toBe(4);
    expect(layer.shapes).toBeDefined();
    expect(layer.shapes!.length).toBe(1);
  });

  it("createLineLayer produces line shape", () => {
    const layer = createLineLayer({
      x1: 0,
      y1: 100,
      x2: 200,
      y2: 100,
      frame: 15,
      totalFrames: 200,
    });
    expect(layer.ty).toBe(4);
    expect(layer.shapes).toBeDefined();
  });

  it("layer indices increment sequentially", () => {
    const l1 = createTextLayer({
      text: "a",
      pos: { x: 0, y: 0 },
      frame: 0,
      totalFrames: 100,
      config: cfg,
    });
    const l2 = createRectLayer({
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      fillColor: [0, 0, 0],
      frame: 0,
      dur: 10,
      totalFrames: 100,
    });
    const l3 = createLineLayer({
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 0,
      frame: 0,
      totalFrames: 100,
    });
    expect(l1.ind).toBe(0);
    expect(l2.ind).toBe(1);
    expect(l3.ind).toBe(2);
  });
});

describe("effects", () => {
  it("scalePop has 3 keyframes (start, peak, end)", () => {
    const prop = scalePop(10, 12);
    expect(prop.a).toBe(1);
    const kf = prop.k as Array<{ t: number; s: number[] }>;
    expect(kf.length).toBe(3);
    expect(kf[0].t).toBe(10);
    expect(kf[1].s).toEqual([120, 120]);
    expect(kf[2].t).toBe(22);
    expect(kf[2].s).toEqual([100, 100]);
  });

  it("scalePulse has 5 keyframes", () => {
    const prop = scalePulse(0, 12);
    const kf = prop.k as Array<{ t: number }>;
    expect(kf.length).toBe(5);
  });

  it("shakeX oscillates around center x", () => {
    const prop = shakeX(5, 100, 10);
    const kf = prop.k as Array<{ t: number; s: number[] }>;
    expect(kf[0].s[0]).toBe(100);
    expect(kf[1].s[0]).toBeLessThan(100);
    expect(kf[2].s[0]).toBeGreaterThan(100);
    expect(kf[kf.length - 1].s[0]).toBe(100);
  });

  it("arcPosition moves via upward midpoint", () => {
    const prop = arcPosition(0, 50, 200, 150, 100, 24);
    const kf = prop.k as Array<{ t: number; s: number[] }>;
    expect(kf.length).toBe(3);
    expect(kf[1].s[1]).toBeLessThan(Math.min(200, 100));
  });

  it("crossfade produces complementary opacity pairs", () => {
    const { fadeOutOpacity, fadeInOpacity } = crossfade(10, 12);
    const out = fadeOutOpacity.k as Array<{ t: number; s: number[] }>;
    const inn = fadeInOpacity.k as Array<{ t: number; s: number[] }>;
    expect(out[0].s[0]).toBe(100);
    expect(out[out.length - 1].s[0]).toBe(0);
    expect(inn[inn.length - 1].s[0]).toBe(100);
  });

  it("shrinkScale transitions between two scales", () => {
    const prop = shrinkScale(5, 100, 75, 8);
    const kf = prop.k as Array<{ t: number; s: number[] }>;
    expect(kf[0].s).toEqual([100, 100]);
    expect(kf[1].s).toEqual([75, 75]);
  });
});

describe("RenderState", () => {
  let state: RenderState;

  beforeEach(() => {
    const layout = createLayout(3, 4, cfg);
    state = new RenderState(cfg, layout);
  });

  it("starts at frame 0", () => {
    expect(state.frame).toBe(0);
  });

  it("advance increments frame", () => {
    state.advance(10);
    expect(state.frame).toBe(10);
    state.advance(5);
    expect(state.frame).toBe(15);
  });

  it("addLayer appends and returns index", () => {
    const idx = state.addLayer({
      ty: 5,
      ip: 0,
      op: 100,
      st: 0,
      ks: {} as never,
    });
    expect(idx).toBe(0);
    expect(state.layers.length).toBe(1);
  });

  it("addMarker records marker", () => {
    state.addMarker("step-1", 0, 30);
    expect(state.markers.length).toBe(1);
    expect(state.markers[0]).toEqual({ tm: 0, cm: "step-1", dr: 30 });
  });

  it("token CRUD operations", () => {
    state.registerToken("t1", { x: 10, y: 20 }, "7", 0);
    expect(state.getToken("t1")?.value).toBe("7");
    state.updateTokenPos("t1", { x: 50, y: 60 });
    expect(state.getToken("t1")?.pos).toEqual({ x: 50, y: 60 });
    state.removeToken("t1");
    expect(state.getToken("t1")).toBeUndefined();
  });

  it("fixTotalFrames updates all layer op values", () => {
    state.addLayer({ ty: 5, ip: 0, op: 0, st: 0, ks: {} as never });
    state.addLayer({ ty: 4, ip: 0, op: 0, st: 0, ks: {} as never });
    state.advance(120);
    state.fixTotalFrames();
    expect(state.layers[0].op).toBe(120);
    expect(state.layers[1].op).toBe(120);
  });
});
