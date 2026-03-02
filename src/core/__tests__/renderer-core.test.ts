import { describe, it, expect } from "vitest";
import { renderSteps } from "../renderer/index";
import { createLayout } from "../layout/index";
import { DEFAULT_CONFIG } from "../types";
import { cell } from "../dsl/refs";
import type { Step } from "../dsl/step";

const cfg = DEFAULT_CONFIG;

describe("renderSteps", () => {
  it("empty steps produces valid Lottie with 0 frames", () => {
    const layout = createLayout(3, 4, cfg);
    const result = renderSteps([], layout, cfg);
    expect(result.animation.op).toBe(0);
    expect(result.animation.layers).toEqual([]);
    expect(result.steps).toEqual([]);
  });

  it("writeCell creates a text layer at correct position", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      {
        id: "write-7",
        ttsText: "7을 씁니다",
        subSteps: [
          { action: { type: "writeCell", ref: cell(1, 0), value: "7" } },
        ],
      },
    ];
    const result = renderSteps(steps, layout, cfg);

    expect(result.animation.layers.length).toBe(1);
    expect(result.animation.layers[0].ty).toBe(5);
    expect(result.animation.layers[0].t?.d.k[0].s.t).toBe("7");

    expect(result.steps.length).toBe(1);
    expect(result.steps[0].id).toBe("write-7");
    expect(result.steps[0].startFrame).toBe(0);
    expect(result.steps[0].endFrame).toBe(cfg.placeFrames);
  });

  it("highlight + writeCell sequence advances frames correctly", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      {
        id: "col-0",
        ttsText: "일의 자리를 봅시다",
        subSteps: [
          { action: { type: "highlight", col: 0, rows: [1, 2] } },
          { action: { type: "writeCell", ref: cell(3, 0), value: "5" } },
        ],
      },
    ];
    const result = renderSteps(steps, layout, cfg);

    expect(result.animation.layers.length).toBe(2);
    expect(result.animation.layers[0].ty).toBe(4);
    expect(result.animation.layers[1].ty).toBe(5);

    const expectedFrames = cfg.highlightFrames + cfg.placeFrames;
    expect(result.steps[0].endFrame).toBe(expectedFrames);
  });

  it("drawLine creates a shape layer", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      {
        id: "line",
        ttsText: "선을 긋습니다",
        subSteps: [{ action: { type: "drawLine", afterRow: 2 } }],
      },
    ];
    const result = renderSteps(steps, layout, cfg);
    expect(result.animation.layers[0].ty).toBe(4);
    expect(result.animation.layers[0].shapes).toBeDefined();
  });

  it("showOperator creates text with unicode minus", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      {
        id: "op",
        ttsText: "빼기 연산자",
        subSteps: [
          { action: { type: "showOperator", op: "-", row: 1, col: 2 } },
        ],
      },
    ];
    const result = renderSteps(steps, layout, cfg);
    expect(result.animation.layers[0].t?.d.k[0].s.t).toBe("\u2212");
  });

  it("durationFrames override works", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      {
        id: "custom",
        ttsText: "커스텀 듀레이션",
        subSteps: [
          {
            action: { type: "writeCell", ref: cell(0, 0), value: "1" },
            durationFrames: 50,
          },
        ],
      },
    ];
    const result = renderSteps(steps, layout, cfg);
    expect(result.steps[0].endFrame).toBe(50);
  });

  it("delayAfter adds pause between substeps", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      {
        id: "delay",
        ttsText: "딜레이 테스트",
        subSteps: [
          {
            action: { type: "writeCell", ref: cell(0, 0), value: "1" },
            delayAfter: 10,
          },
          { action: { type: "writeCell", ref: cell(0, 1), value: "2" } },
        ],
      },
    ];
    const result = renderSteps(steps, layout, cfg);
    expect(result.steps[0].endFrame).toBe(
      cfg.placeFrames + 10 + cfg.placeFrames,
    );
  });

  it("markers are generated per step", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      { id: "s1", ttsText: "step 1", subSteps: [{ action: { type: "wait" } }] },
      { id: "s2", ttsText: "step 2", subSteps: [{ action: { type: "wait" } }] },
    ];
    const result = renderSteps(steps, layout, cfg);
    expect(result.animation.markers?.length).toBe(2);
    expect(result.animation.markers?.[0].cm).toBe("step-s1");
    expect(result.animation.markers?.[1].cm).toBe("step-s2");
    expect(result.animation.markers?.[1].tm).toBeGreaterThan(0);
  });

  it("fixTotalFrames sets op on all layers", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      {
        id: "multi",
        ttsText: "여러 레이어",
        subSteps: [
          { action: { type: "writeCell", ref: cell(0, 0), value: "1" } },
          { action: { type: "writeCell", ref: cell(0, 1), value: "2" } },
          { action: { type: "drawLine", afterRow: 0 } },
        ],
      },
    ];
    const result = renderSteps(steps, layout, cfg);
    const total = result.animation.op;
    for (const layer of result.animation.layers) {
      expect(layer.op).toBe(total);
    }
  });

  it("multi-step addition-like sequence produces complete Lottie", () => {
    const layout = createLayout(3, 4, cfg);
    const steps: Step[] = [
      {
        id: "setup",
        ttsText: "47 더하기 58을 계산합니다",
        subSteps: [
          { action: { type: "writeCell", ref: cell(1, 0), value: "7" } },
          { action: { type: "writeCell", ref: cell(1, 1), value: "4" } },
          { action: { type: "writeCell", ref: cell(2, 0), value: "8" } },
          { action: { type: "writeCell", ref: cell(2, 1), value: "5" } },
          { action: { type: "showOperator", op: "+", row: 2, col: 2 } },
          { action: { type: "drawLine", afterRow: 2 } },
        ],
      },
      {
        id: "col-0",
        ttsText: "일의 자리: 7 + 8 = 15",
        subSteps: [
          { action: { type: "highlight", col: 0, rows: [1, 2] } },
          { action: { type: "writeCell", ref: cell(3, 0), value: "5" } },
          { action: { type: "unhighlight", col: 0 } },
        ],
      },
    ];
    const result = renderSteps(steps, layout, cfg);

    expect(result.animation.w).toBe(layout.canvasWidth);
    expect(result.animation.h).toBe(layout.canvasHeight);
    expect(result.animation.fr).toBe(cfg.fps);
    expect(result.animation.layers.length).toBeGreaterThan(0);
    expect(result.steps.length).toBe(2);
    expect(result.steps[1].startFrame).toBeGreaterThan(
      result.steps[0].startFrame,
    );
  });
});
