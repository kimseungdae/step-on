import { describe, it, expect } from "vitest";
import { clamp, lerp, arcPoint, dynamicArcHeight, vec2 } from "../math";
import {
  parseColor,
  rgbaToString,
  lerpColor,
  normalizedToRgba,
} from "../color";
import { ease, cubicBezier, resolveEasing } from "../easing";
import { SpringSolver, createSpring, springPresets } from "../spring";
import { Tween } from "../Tween";
import { Timeline } from "../Timeline";

describe("math", () => {
  it("clamp", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("lerp", () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it("arcPoint", () => {
    const from = vec2(0, 100);
    const to = vec2(100, 100);
    const mid = arcPoint(from, to, 0.5, 40);
    expect(mid.x).toBe(50);
    expect(mid.y).toBeLessThan(100); // 아치 위로 올라감
  });

  it("dynamicArcHeight scales with distance", () => {
    const near = dynamicArcHeight(vec2(0, 0), vec2(10, 0));
    const far = dynamicArcHeight(vec2(0, 0), vec2(200, 0));
    expect(far).toBeGreaterThan(near);
  });
});

describe("color", () => {
  it("parseColor hex", () => {
    const c = parseColor("#ff0000");
    expect(c.r).toBe(255);
    expect(c.g).toBe(0);
    expect(c.b).toBe(0);
    expect(c.a).toBeCloseTo(1);
  });

  it("parseColor short hex", () => {
    const c = parseColor("#f00");
    expect(c.r).toBe(255);
  });

  it("parseColor rgba string", () => {
    const c = parseColor("rgba(128, 64, 32, 0.5)");
    expect(c.r).toBe(128);
    expect(c.g).toBe(64);
    expect(c.b).toBe(32);
    expect(c.a).toBeCloseTo(0.5);
  });

  it("lerpColor", () => {
    const a = { r: 0, g: 0, b: 0, a: 1 };
    const b = { r: 255, g: 255, b: 255, a: 1 };
    const mid = lerpColor(a, b, 0.5);
    expect(mid.r).toBeCloseTo(127.5);
  });

  it("normalizedToRgba", () => {
    const c = normalizedToRgba([0.13, 0.13, 0.13]);
    expect(c.r).toBe(33);
    expect(c.a).toBe(1);
  });
});

describe("easing", () => {
  const easings = Object.entries(ease);

  it("all easings: t=0 → 0, t=1 → 1", () => {
    for (const [name, fn] of easings) {
      expect(fn(0)).toBeCloseTo(0, 3);
      expect(fn(1)).toBeCloseTo(1, 3);
    }
  });

  it("outCubic is faster start", () => {
    const mid = ease.outCubic(0.5);
    expect(mid).toBeGreaterThan(0.5);
  });

  it("cubicBezier CSS ease", () => {
    const fn = cubicBezier(0.25, 0.1, 0.25, 1);
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
    expect(fn(0.5)).toBeGreaterThan(0.4);
  });

  it("resolveEasing by name", () => {
    const fn = resolveEasing("outBack");
    expect(fn(1)).toBeCloseTo(1);
  });

  it("resolveEasing cubic-bezier string", () => {
    const fn = resolveEasing("cubic-bezier(0.25, 0.1, 0.25, 1)");
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
  });

  it("resolveEasing function passthrough", () => {
    const custom = (t: number) => t * t;
    expect(resolveEasing(custom)).toBe(custom);
  });
});

describe("spring", () => {
  it("solver converges to 1", () => {
    const solver = new SpringSolver({
      stiffness: 170,
      damping: 26,
      mass: 1,
      velocity: 0,
      restThreshold: 0.01,
    });
    const fn = solver.solve();
    expect(fn(0)).toBeCloseTo(0, 1);
    expect(fn(1)).toBeCloseTo(1, 2);
  });

  it("solver overshoots with low damping", () => {
    const solver = new SpringSolver({
      stiffness: 300,
      damping: 10,
      mass: 1,
      velocity: 0,
      restThreshold: 0.01,
    });
    const fn = solver.solve();
    // With low damping, should overshoot (value > 1 at some point)
    let maxVal = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      maxVal = Math.max(maxVal, fn(t));
    }
    expect(maxVal).toBeGreaterThan(1);
  });

  it("duration auto-calculated", () => {
    const solver = new SpringSolver(springPresets.popIn);
    expect(solver.duration).toBeGreaterThan(0);
    expect(solver.duration).toBeLessThan(5);
  });

  it("presets all produce valid EasingFn", () => {
    for (const [name, config] of Object.entries(springPresets)) {
      const fn = createSpring(name as keyof typeof springPresets);
      expect(fn(0)).toBeCloseTo(0, 1);
      expect(fn(1)).toBeCloseTo(1, 1);
    }
  });
});

describe("Tween", () => {
  it("to: interpolates numeric props", () => {
    const obj = { x: 0, y: 0, opacity: 0 };
    const tween = Tween.to(obj, {
      x: 100,
      y: 200,
      opacity: 1,
      duration: 1,
      ease: "linear",
    });
    tween.startTime = 0;

    tween.render(0);
    expect(obj.x).toBe(0);

    tween.render(0.5);
    expect(obj.x).toBeCloseTo(50);
    expect(obj.y).toBeCloseTo(100);
    expect(obj.opacity).toBeCloseTo(0.5);

    tween.render(1);
    expect(obj.x).toBeCloseTo(100);
  });

  it("from: starts from specified values", () => {
    const obj = { scale: 1 };
    const tween = Tween.from(obj, { scale: 0, duration: 1, ease: "linear" });
    tween.startTime = 0;

    expect(obj.scale).toBe(0); // from 적용

    tween.render(0.5);
    expect(obj.scale).toBeCloseTo(0.5);

    tween.render(1);
    expect(obj.scale).toBeCloseTo(1);
  });

  it("callbacks fire", () => {
    let started = false;
    let completed = false;
    let lastProgress = 0;

    const obj = { x: 0 };
    const tween = Tween.to(obj, {
      x: 100,
      duration: 1,
      ease: "linear",
      onStart: () => {
        started = true;
      },
      onUpdate: (p) => {
        lastProgress = p;
      },
      onComplete: () => {
        completed = true;
      },
    });
    tween.startTime = 0;

    tween.render(0);
    expect(started).toBe(true);

    tween.render(0.5);
    expect(lastProgress).toBeCloseTo(0.5);

    tween.render(1);
    expect(completed).toBe(true);
  });

  it("delay works", () => {
    const obj = { x: 0 };
    const tween = Tween.to(obj, {
      x: 100,
      duration: 1,
      delay: 0.5,
      ease: "linear",
    });
    tween.startTime = 0;

    tween.render(0.3);
    expect(obj.x).toBe(0); // still in delay

    tween.render(1.0);
    expect(obj.x).toBeCloseTo(50); // 0.5s into animation
  });
});

describe("Timeline", () => {
  it("sequential tweens", () => {
    const a = { x: 0 };
    const b = { x: 0 };
    const tl = new Timeline();

    tl.to(a, { x: 100, duration: 1, ease: "linear" });
    tl.to(b, { x: 200, duration: 1, ease: "linear" });

    expect(tl.totalDuration()).toBe(2);

    tl.render(0.5);
    expect(a.x).toBeCloseTo(50);
    expect(b.x).toBe(0);

    tl.render(1.5);
    expect(a.x).toBeCloseTo(100);
    expect(b.x).toBeCloseTo(100);
  });

  it('position "<" for parallel', () => {
    const a = { x: 0 };
    const b = { y: 0 };
    const tl = new Timeline();

    tl.to(a, { x: 100, duration: 1, ease: "linear" });
    tl.to(b, { y: 200, duration: 1, ease: "linear" }, "<");

    expect(tl.totalDuration()).toBe(1); // parallel

    tl.render(0.5);
    expect(a.x).toBeCloseTo(50);
    expect(b.y).toBeCloseTo(100);
  });

  it('position "+=" offset', () => {
    const a = { x: 0 };
    const b = { x: 0 };
    const tl = new Timeline();

    tl.to(a, { x: 100, duration: 1, ease: "linear" });
    tl.to(b, { x: 100, duration: 1, ease: "linear" }, "-=0.5");

    expect(tl.totalDuration()).toBe(1.5); // 0.5s overlap
  });

  it("labels", () => {
    const obj = { x: 0 };
    const tl = new Timeline();

    tl.addLabel("start", 0);
    tl.to(obj, { x: 100, duration: 1, ease: "linear" }, "start");
    tl.addLabel("end");

    expect(tl.labels.get("start")).toBe(0);
    expect(tl.labels.get("end")).toBe(1);
  });

  it("markers", () => {
    const tl = new Timeline();
    tl.addMarker("step-1", 0, 1, { id: "s1", ttsText: "First step" });
    tl.addMarker("step-2", 1, 1.5, { id: "s2", ttsText: "Second step" });

    expect(tl.getMarkerAt(0.5)?.name).toBe("step-1");
    expect(tl.getMarkerAt(1.5)?.name).toBe("step-2");
    expect(tl.getMarkerAt(3)).toBeNull();
  });

  it("stagger", () => {
    const items = [{ x: 0 }, { x: 0 }, { x: 0 }];
    const tl = new Timeline();
    tl.stagger(
      items,
      { x: 100, duration: 0.5, ease: "linear" },
      { each: 0.1 },
      0,
    );

    tl.render(0.1);
    expect(items[0]!.x).toBeGreaterThan(0);
    // item 1 should have started by now (0.1s stagger)
    // item 2 should not have started yet (0.2s stagger)
  });

  it("nested timeline", () => {
    const obj = { x: 0 };
    const child = new Timeline();
    child.to(obj, { x: 100, duration: 1, ease: "linear" });

    const parent = new Timeline();
    parent.add(child, 0.5);

    expect(parent.totalDuration()).toBe(1.5);

    parent.render(1.0);
    expect(obj.x).toBeCloseTo(50);
  });
});
