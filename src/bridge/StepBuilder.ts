import type { Step } from "../core/dsl/step";
import type { Config } from "../core/types";
import type { Layout } from "../core/layout/index";
import { Timeline } from "../engine/Timeline";
import type { Stage } from "../stage/Stage";
import { ActionMapper } from "./ActionMapper";

export interface BuildResult {
  timeline: Timeline;
  totalDuration: number;
}

export function buildTimeline(
  steps: Step[],
  stage: Stage,
  layout: Layout,
  config: Config,
): BuildResult {
  const tl = new Timeline();
  const mapper = new ActionMapper(stage, layout.grid, layout.minibox, config);

  for (const step of steps) {
    // Mark step start with a label and marker
    const stepStart = tl.totalDuration();
    tl.addLabel(step.id, stepStart);

    for (const sub of step.subSteps) {
      mapper.mapAction(tl, sub.action);
    }

    const stepEnd = tl.totalDuration();

    tl.addMarker(step.id, stepStart, stepEnd - stepStart, {
      id: step.id,
      ttsText: step.ttsText,
    });
  }

  const totalDuration = tl.totalDuration();
  return { timeline: tl, totalDuration };
}
