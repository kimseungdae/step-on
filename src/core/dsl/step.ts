import type { Action } from "./actions";

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

export interface CompileResult {
  steps: Step[];
  numCols: number;
  numRows: number;
}
