import type { CellRef, TokenId, PositionTarget } from "./refs";

// A. Highlight/Guide
export interface HighlightAction {
  type: "highlight";
  col: number;
  rows: number[];
  color?: number[];
}

export interface UnhighlightAction {
  type: "unhighlight";
  col: number;
}

export interface PulseAction {
  type: "pulse";
  ref: CellRef;
}

export interface ShakeAction {
  type: "shake";
  ref: CellRef;
}

export interface ConfirmPulseAction {
  type: "confirmPulse";
  rows: number[];
  cols: number[];
}

// B. Clone/Move
export interface CloneDigitAction {
  type: "cloneDigit";
  from: CellRef;
  tokenId: TokenId;
  to: PositionTarget;
  value: string;
}

export interface MoveTokenAction {
  type: "moveToken";
  tokenId: TokenId;
  to: PositionTarget;
}

export interface SnapToCellAction {
  type: "snapToCell";
  tokenId: TokenId;
  ref: CellRef;
  writeValue?: string;
}

// C. Calculation
export interface ComposeExpressionAction {
  type: "composeExpression";
  parts: string[];
}

export interface RevealResultAction {
  type: "revealResult";
  value: string;
  tokenId: TokenId;
}

export interface SplitBase10Action {
  type: "splitBase10";
  sourceTokenId: TokenId;
  tens: { value: number; tokenId: TokenId };
  ones: { value: number; tokenId: TokenId };
}

export interface LabelAction {
  type: "label";
  text: string;
  target: PositionTarget;
  color?: number[];
}

export interface WriteCellAction {
  type: "writeCell";
  ref: CellRef;
  value: string;
  color?: number[];
}

// D. Carry
export interface ConvertToCarryChipAction {
  type: "convertToCarryChip";
  tokenId: TokenId;
  chipId: TokenId;
  value: number;
}

export interface MoveChipAction {
  type: "moveChip";
  chipId: TokenId;
  to: CellRef;
}

export interface ApplyCarryAction {
  type: "applyCarry";
  chipId: TokenId;
}

// E. Borrow
export interface DecrementDigitAction {
  type: "decrementDigit";
  ref: CellRef;
  from: number;
  to: number;
}

export interface SpawnTenBlockAction {
  type: "spawnTenBlock";
  from: CellRef;
  tokenId: TokenId;
}

export interface MergeTenWithOnesAction {
  type: "mergeTenWithOnes";
  tenTokenId: TokenId;
  onesRef: CellRef;
  newValue: number;
}

export interface BorrowFromNextColAction {
  type: "borrowFromNextCol";
  col: number;
}

// F. Layout
export interface DrawLineAction {
  type: "drawLine";
  afterRow: number;
  fromCol?: number;
  toCol?: number;
}

export interface ShowOperatorAction {
  type: "showOperator";
  op: string;
  row: number;
  col: number;
  color?: number[];
}

export interface ShowMiniboxAction {
  type: "showMinibox";
  nearRow?: number;
}

export interface HideMiniboxAction {
  type: "hideMinibox";
}

export interface ClearMiniboxAction {
  type: "clearMinibox";
}

// G. Control
export interface WaitAction {
  type: "wait";
}

export type Action =
  | HighlightAction
  | UnhighlightAction
  | PulseAction
  | ShakeAction
  | ConfirmPulseAction
  | CloneDigitAction
  | MoveTokenAction
  | SnapToCellAction
  | ComposeExpressionAction
  | RevealResultAction
  | SplitBase10Action
  | LabelAction
  | WriteCellAction
  | ConvertToCarryChipAction
  | MoveChipAction
  | ApplyCarryAction
  | DecrementDigitAction
  | SpawnTenBlockAction
  | MergeTenWithOnesAction
  | BorrowFromNextColAction
  | DrawLineAction
  | ShowOperatorAction
  | ShowMiniboxAction
  | HideMiniboxAction
  | ClearMiniboxAction
  | WaitAction;
