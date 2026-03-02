export { toDigits, digitAt, digitCount } from "../layout/coord";

export function colName(c: number): string {
  const names = ["일의 자리", "십의 자리", "백의 자리", "천의 자리"];
  return names[c] ?? `${10 ** c}의 자리`;
}
