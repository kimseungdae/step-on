export interface CellAddress {
  row: number;
  col: number;
}

export interface CellRef {
  region: "worksheet";
  address: CellAddress;
}

export type TokenId = string;

export type MiniboxSlot =
  | "left"
  | "op"
  | "right"
  | "carry-prefix"
  | "eq"
  | "result"
  | "tens"
  | "ones";

export type PositionTarget =
  | { type: "cell"; ref: CellRef }
  | { type: "minibox-slot"; slot: MiniboxSlot }
  | { type: "absolute"; x: number; y: number };

export function cell(row: number, col: number): CellRef {
  return { region: "worksheet", address: { row, col } };
}

export function toCell(ref: CellRef): PositionTarget {
  return { type: "cell", ref };
}

export function toSlot(slot: MiniboxSlot): PositionTarget {
  return { type: "minibox-slot", slot };
}
