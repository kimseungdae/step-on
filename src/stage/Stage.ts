import { GridLayer } from "./GridLayer";
import { DigitLayer } from "./DigitLayer";
import { HighlightLayer } from "./HighlightLayer";
import { MiniboxLayer } from "./MiniboxLayer";

export interface StageConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pixelRatio?: number;
  background?: string;
}

export class Stage {
  readonly grid: GridLayer;
  readonly digits: DigitLayer;
  readonly highlights: HighlightLayer;
  readonly minibox: MiniboxLayer;

  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _width: number;
  private _height: number;
  private _pixelRatio: number;
  private _background: string;

  constructor(config: StageConfig) {
    this._canvas = config.canvas;
    this._width = config.width;
    this._height = config.height;
    this._pixelRatio =
      config.pixelRatio ??
      (typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1);
    this._background = config.background ?? "#FFFFFF";

    const ctx = this._canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");
    this._ctx = ctx;

    this._applySize();

    this.grid = new GridLayer(this._width, this._height, this._pixelRatio);
    this.digits = new DigitLayer();
    this.highlights = new HighlightLayer();
    this.minibox = new MiniboxLayer();
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get pixelRatio(): number {
    return this._pixelRatio;
  }

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  get ctx(): CanvasRenderingContext2D {
    return this._ctx;
  }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this._applySize();
    this.grid.resize(width, height);
  }

  render(): void {
    const ctx = this._ctx;

    // Clear
    ctx.setTransform(this._pixelRatio, 0, 0, this._pixelRatio, 0, 0);
    ctx.clearRect(0, 0, this._width, this._height);

    // Background
    ctx.fillStyle = this._background;
    ctx.fillRect(0, 0, this._width, this._height);

    // Layer compositing order:
    // 1. Grid (static cache — rules, operators, static digits)
    // 2. Highlights (column glow)
    // 3. Digits (animated numbers)
    // 4. Minibox (calculation box overlay)
    this.grid.render(ctx);
    this.highlights.render(ctx);
    this.digits.render(ctx);
    this.minibox.render(ctx);

    // Reset alpha
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.highlights.clear();
    this.digits.clear();
    this.minibox.clear();
  }

  destroy(): void {
    this.clear();
    const ctx = this._ctx;
    ctx.setTransform(this._pixelRatio, 0, 0, this._pixelRatio, 0, 0);
    ctx.clearRect(0, 0, this._width, this._height);
  }

  private _applySize(): void {
    const pr = this._pixelRatio;
    this._canvas.width = this._width * pr;
    this._canvas.height = this._height * pr;
    this._canvas.style.width = `${this._width}px`;
    this._canvas.style.height = `${this._height}px`;
  }
}
