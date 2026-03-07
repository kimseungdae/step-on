import type { MiniboxBg, Digit } from "./elements";

export class MiniboxLayer {
  private _bg: MiniboxBg | null = null;
  private _slots: Digit[] = [];

  setBg(bg: MiniboxBg): void {
    this._bg = bg;
  }

  addSlot(digit: Digit): void {
    this._slots.push(digit);
  }

  clearSlots(): void {
    this._slots.length = 0;
  }

  clear(): void {
    this._bg = null;
    this._slots.length = 0;
  }

  get bg(): MiniboxBg | null {
    return this._bg;
  }

  get slots(): readonly Digit[] {
    return this._slots;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Background
    if (this._bg && this._bg.opacity > 0) {
      const bg = this._bg;
      ctx.globalAlpha = bg.opacity;
      ctx.fillStyle = bg.color;

      // Rounded rect
      ctx.beginPath();
      const r = bg.radius;
      ctx.moveTo(bg.x + r, bg.y);
      ctx.lineTo(bg.x + bg.width - r, bg.y);
      ctx.quadraticCurveTo(bg.x + bg.width, bg.y, bg.x + bg.width, bg.y + r);
      ctx.lineTo(bg.x + bg.width, bg.y + bg.height - r);
      ctx.quadraticCurveTo(
        bg.x + bg.width,
        bg.y + bg.height,
        bg.x + bg.width - r,
        bg.y + bg.height,
      );
      ctx.lineTo(bg.x + r, bg.y + bg.height);
      ctx.quadraticCurveTo(bg.x, bg.y + bg.height, bg.x, bg.y + bg.height - r);
      ctx.lineTo(bg.x, bg.y + r);
      ctx.quadraticCurveTo(bg.x, bg.y, bg.x + r, bg.y);
      ctx.closePath();
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Slot digits
    for (const d of this._slots) {
      if (d.opacity <= 0 || d.scale <= 0) continue;

      ctx.save();
      ctx.globalAlpha = d.opacity;
      ctx.translate(d.x, d.y);

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

    ctx.globalAlpha = 1;
  }
}
