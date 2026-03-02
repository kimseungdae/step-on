import type { Action } from "./actions";
import type { LottieAnimation } from "../types";

export interface SubStep {
  action: Action;
  durationFrames?: number;
  delayAfter?: number;
}

export interface Step {
  id: string;
  ttsText: string;
  subSteps: SubStep[];
}

export interface StepMeta {
  id: string;
  ttsText: string;
  startFrame: number;
  endFrame: number;
  markerName: string;
}

export interface GenerateResult {
  animation: LottieAnimation;
  steps: StepMeta[];
}
