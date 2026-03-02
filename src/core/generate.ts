import type { Problem, Config } from "./types";
import type { GenerateResult } from "./dsl/step";
import { DEFAULT_CONFIG } from "./types";
import { compileSteps } from "./compiler/index";
import { createLayout } from "./layout/index";
import { renderSteps } from "./renderer/index";

export function generate(
  problem: Problem,
  config?: Partial<Config>,
): GenerateResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { steps, numCols, numRows } = compileSteps(problem);
  const layout = createLayout(numCols, numRows, cfg);
  return renderSteps(steps, layout, cfg);
}
