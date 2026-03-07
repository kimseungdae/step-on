import type { RuleLine, Digit } from "./elements";

export class GridLayer {
  private _canvas: OffscreenCanvas | null = null;
  private _dirty = true;
  private _width: number;
  private _height: number;
  private _pixelRatio: number;
  private _rules: RuleLine[] = [];
  private _operators: Digit[] = [];
  private _staticDigits: Digit[] = [];

  constructor(width: number, height: number, pixelRatio: number) {
    this._width = width;
    this._height = height;
    this._pixelRatio = pixelRatio;
  }

  addRule(rule: RuleLine): void {
    this._rules.push(rule);
    this._dirty = true;
  }

  addOperator(digit: Digit): void {
    this._operators.push(digit);
    this._dirty = true;
  }

  addStaticDigit(digit: Digit): void {
    this._staticDigits.push(digit);
    this._dirty = true;
  }

  markDirty(): void {
    this._dirty = true;
  }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this._canvas = null;
    this._dirty = true;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this._dirty || !this._canvas) {
      this._rebuildCache();
    }
    if (this._canvas) {
      ctx.drawImage(this._canvas, 0, 0, this._width, this._height);
    }
  }

  private _rebuildCache(): void {
    const pr = this._pixelRatio;
    const w = this._width * pr;
    const h = this._height * pr;

    this._canvas = new OffscreenCanvas(w, h);
    const ctx = this._canvas.getContext("2d")!;
    ctx.scale(pr, pr);

    // Rules (밑줄)
    for (const rule of this._rules) {
      if (rule.opacity <= 0) continue;
      ctx.globalAlpha = rule.opacity;
      ctx.strokeStyle = rule.color;
      ctx.lineWidth = rule.lineWidth;
      ctx.beginPath();
      ctx.moveTo(rule.x1, rule.y);
      ctx.lineTo(rule.x2, rule.y);
      ctx.stroke();
    }

    // Operators
    for (const op of this._operators) {
      if (op.opacity <= 0) continue;
      ctx.globalAlpha = op.opacity;
      ctx.fillStyle = op.color;
      ctx.font = `${op.fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(op.text, op.x, op.y);
    }

    // Static digits (setup 단계에서 이미 쓰여진 숫자)
    for (const d of this._staticDigits) {
      if (d.opacity <= 0) continue;
      ctx.globalAlpha = d.opacity;
      ctx.fillStyle = d.color;
      ctx.font = `${d.fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.text, d.x, d.y);
    }

    ctx.globalAlpha = 1;
    this._dirty = false;
  }
}
