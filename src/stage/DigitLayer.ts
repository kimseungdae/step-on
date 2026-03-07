import type { Digit } from "./elements";

// 텍스트 측정 캐시
const measureCache = new Map<string, number>();

export class DigitLayer {
  private _digits: Digit[] = [];

  add(digit: Digit): void {
    this._digits.push(digit);
  }

  remove(digit: Digit): void {
    const idx = this._digits.indexOf(digit);
    if (idx >= 0) this._digits.splice(idx, 1);
  }

  get(index: number): Digit | undefined {
    return this._digits[index];
  }

  findByText(text: string): Digit | undefined {
    return this._digits.find((d) => d.text === text);
  }

  get count(): number {
    return this._digits.length;
  }

  clear(): void {
    this._digits.length = 0;
    measureCache.clear();
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const d of this._digits) {
      if (d.opacity <= 0 || d.scale <= 0) continue;

      ctx.save();
      ctx.globalAlpha = d.opacity;
      ctx.translate(d.x, d.y);

      // Spring pop-in: scale transform from center
      if (d.scale !== 1) {
        ctx.scale(d.scale, d.scale);
      }

      ctx.fillStyle = d.color;
      ctx.font = `${d.fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.text, 0, 0);
      ctx.restore();
    }
  }

  measureWidth(
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
  ): number {
    const key = `${text}:${fontSize}`;
    let w = measureCache.get(key);
    if (w !== undefined) return w;

    ctx.font = `${fontSize}px Arial`;
    w = ctx.measureText(text).width;
    measureCache.set(key, w);
    return w;
  }
}
