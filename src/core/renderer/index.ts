import type { Config, LottieAnimation } from "../types";
import type { Step } from "../dsl/step";
import type { StepMeta, GenerateResult } from "../dsl/step";
import type { Layout } from "../layout/index";
import { RenderState } from "./state";
import {
  handleAction,
  getDefaultDuration,
  resetLayerIdx,
} from "./action-handlers";

export function renderSteps(
  steps: Step[],
  layout: Layout,
  config: Config,
): GenerateResult {
  resetLayerIdx();
  const state = new RenderState(config, layout);
  const stepMetas: StepMeta[] = [];

  for (const step of steps) {
    const stepStart = state.frame;

    for (const sub of step.subSteps) {
      const defaultDur = getDefaultDuration(sub.action, config);
      const dur = sub.durationFrames ?? defaultDur;
      handleAction(sub.action, state, dur);
      state.advance(dur + (sub.delayAfter ?? 0));
    }

    const stepEnd = state.frame;
    const markerName = `step-${step.id}`;

    state.addMarker(markerName, stepStart, stepEnd - stepStart);

    stepMetas.push({
      id: step.id,
      ttsText: step.ttsText,
      startFrame: stepStart,
      endFrame: stepEnd,
      markerName,
    });
  }

  state.fixTotalFrames();

  const animation: LottieAnimation = {
    v: "5.7.4",
    fr: config.fps,
    ip: 0,
    op: state.frame,
    w: layout.canvasWidth,
    h: layout.canvasHeight,
    ddd: 0,
    assets: [],
    layers: state.layers,
    fonts: {
      list: [
        {
          fName: config.fontFamily,
          fFamily: config.fontFamily,
          fStyle: "Regular",
          ascent: 75,
        },
      ],
    },
    markers: state.markers,
  };

  return { animation, steps: stepMetas };
}
