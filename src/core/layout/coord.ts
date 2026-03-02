export function toDigits(n: number): number[] {
  if (n === 0) return [0];
  const digits: number[] = [];
  let v = Math.abs(n);
  while (v > 0) {
    digits.push(v % 10);
    v = Math.floor(v / 10);
  }
  return digits;
}

export function digitAt(n: number, col: number): number {
  return Math.floor(Math.abs(n) / 10 ** col) % 10;
}

export function digitCount(n: number): number {
  if (n === 0) return 1;
  return Math.floor(Math.log10(Math.abs(n))) + 1;
}
