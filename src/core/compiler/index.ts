import type { Problem } from "../types";
import type { CompileResult } from "./addition";
import { compileAddition } from "./addition";
import { compileSubtraction } from "./subtraction";
import { compileMultiplication } from "./multiplication";
import { compileDivision } from "./division";

export type { CompileResult };

export function compileSteps(problem: Problem): CompileResult {
  switch (problem.op) {
    case "+":
      return compileAddition(problem);
    case "-":
      return compileSubtraction(problem);
    case "×":
      return compileMultiplication(problem);
    case "÷":
      return compileDivision(problem);
  }
}
