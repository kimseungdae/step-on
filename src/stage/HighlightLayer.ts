import type { Highlight } from "./elements";

export class HighlightLayer {
  private _highlights: Highlight[] = [];

  add(highlight: Highlight): void {
    this._highlights.push(highlight);
  }

  remove(highlight: Highlight): void {
    const idx = this._highlights.indexOf(highlight);
    if (idx >= 0) this._highlights.splice(idx, 1);
  }

  clear(): void {
    this._highlights.length = 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const hl of this._highlights) {
      if (hl.opacity <= 0) continue;

      ctx.globalAlpha = hl.opacity;
      ctx.fillStyle = hl.color;

      // 부드러운 glow 효과: 약간의 blur
      ctx.shadowColor = hl.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(hl.x, hl.y, hl.width, hl.height);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }
}
