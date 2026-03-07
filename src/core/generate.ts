import type { Problem, Config } from "./types";
import type { CompileResult } from "./dsl/step";
import { DEFAULT_CONFIG } from "./types";
import { compileSteps } from "./compiler/index";
import { createLayout } from "./layout/index";
import type { Layout } from "./layout/index";

export interface PrepareResult {
  steps: CompileResult["steps"];
  layout: Layout;
  config: Config;
}

export function prepare(
  problem: Problem,
  config?: Partial<Config>,
): PrepareResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { steps, numCols, numRows } = compileSteps(problem);
  const layout = createLayout(numCols, numRows, cfg);
  return { steps, layout, config: cfg };
}
