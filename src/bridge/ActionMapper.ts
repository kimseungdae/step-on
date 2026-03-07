import type { Action } from "../core/dsl/actions";
import type { CellRef, PositionTarget, TokenId } from "../core/dsl/refs";
import type { WorksheetGrid } from "../core/layout/grid";
import type { MiniBoxLayout } from "../core/layout/minibox";
import type { Config } from "../core/types";
import { Timeline } from "../engine/Timeline";
import { createSpring } from "../engine/spring";
import { arcPoint, dynamicArcHeight, vec2 } from "../engine/math";
import { Digit, Highlight, RuleLine, MiniboxBg } from "../stage/elements";
import type { Stage } from "../stage/Stage";

// Timing constants (seconds)
const T = {
  POP_IN: 0.35,
  FADE: 0.25,
  HIGHLIGHT: 0.3,
  MOVE: 0.4,
  CARRY_MOVE: 0.5,
  LINE_DRAW: 0.2,
  WAIT: 0.3,
  PULSE: 0.4,
  SHAKE: 0.35,
  MINIBOX: 0.3,
  SPLIT: 0.35,
  BORROW: 0.4,
  OVERLAP: 0.1, // overlap with next action
} as const;

interface TrackedToken {
  digit: Digit;
  layer: "digits" | "minibox";
}

export class ActionMapper {
  private _stage: Stage;
  private _grid: WorksheetGrid;
  private _minibox: MiniBoxLayout;
  private _config: Config;
  private _tokens = new Map<TokenId, TrackedToken>();
  private _cellDigits = new Map<string, Digit>();
  private _activeHighlights = new Map<number, Highlight>();

  constructor(
    stage: Stage,
    grid: WorksheetGrid,
    minibox: MiniBoxLayout,
    config: Config,
  ) {
    this._stage = stage;
    this._grid = grid;
    this._minibox = minibox;
    this._config = config;
  }

  mapAction(tl: Timeline, action: Action, position?: number | string): void {
    switch (action.type) {
      case "highlight":
        return this._highlight(tl, action, position);
      case "unhighlight":
        return this._unhighlight(tl, action, position);
      case "pulse":
        return this._pulse(tl, action, position);
      case "shake":
        return this._shake(tl, action, position);
      case "confirmPulse":
        return this._confirmPulse(tl, action, position);
      case "writeCell":
        return this._writeCell(tl, action, position);
      case "cloneDigit":
        return this._cloneDigit(tl, action, position);
      case "moveToken":
        return this._moveToken(tl, action, position);
      case "snapToCell":
        return this._snapToCell(tl, action, position);
      case "composeExpression":
        return this._composeExpression(tl, action, position);
      case "revealResult":
        return this._revealResult(tl, action, position);
      case "splitBase10":
        return this._splitBase10(tl, action, position);
      case "label":
        return this._label(tl, action, position);
      case "convertToCarryChip":
        return this._convertToCarryChip(tl, action, position);
      case "moveChip":
        return this._moveChip(tl, action, position);
      case "applyCarry":
        return this._applyCarry(tl, action, position);
      case "decrementDigit":
        return this._decrementDigit(tl, action, position);
      case "spawnTenBlock":
        return this._spawnTenBlock(tl, action, position);
      case "mergeTenWithOnes":
        return this._mergeTenWithOnes(tl, action, position);
      case "borrowFromNextCol":
        return this._borrowFromNextCol(tl, action, position);
      case "drawLine":
        return this._drawLine(tl, action, position);
      case "showOperator":
        return this._showOperator(tl, action, position);
      case "showMinibox":
        return this._showMinibox(tl, action, position);
      case "hideMinibox":
        return this._hideMinibox(tl, action, position);
      case "clearMinibox":
        return this._clearMinibox(tl, action, position);
      case "wait":
        return this._wait(tl, position);
    }
  }

  private _cellKey(ref: CellRef): string {
    return `${ref.address.row}:${ref.address.col}`;
  }

  private _cellPos(ref: CellRef) {
    return this._grid.cellCenter(ref.address.row, ref.address.col);
  }

  private _resolveTarget(target: PositionTarget): { x: number; y: number } {
    switch (target.type) {
      case "cell":
        return this._cellPos(target.ref);
      case "minibox-slot":
        return this._minibox.slotPos(target.slot);
      case "absolute":
        return { x: target.x, y: target.y };
    }
  }

  private _colorStr(c?: number[]): string {
    if (!c || c.length < 3) return "#222222";
    const r = Math.round(c[0]! * 255);
    const g = Math.round(c[1]! * 255);
    const b = Math.round(c[2]! * 255);
    return `rgb(${r},${g},${b})`;
  }

  // --- A. Highlight/Guide ---

  private _highlight(
    tl: Timeline,
    action: Extract<Action, { type: "highlight" }>,
    pos?: number | string,
  ): void {
    const { col, rows } = action;
    const color = action.color
      ? this._colorStr(action.color)
      : "rgba(66,133,244,0.15)";

    // Calculate highlight rect covering all rows in this column
    const topLeft = this._grid.cellTopLeft(Math.min(...rows), col);
    const bottomLeft = this._grid.cellTopLeft(Math.max(...rows) + 1, col);

    const hl = new Highlight(
      topLeft.x,
      topLeft.y,
      this._config.cellW,
      bottomLeft.y - topLeft.y,
      color,
    );
    this._stage.highlights.add(hl);
    this._activeHighlights.set(col, hl);

    tl.to(
      hl,
      {
        opacity: 0.6,
        duration: T.HIGHLIGHT,
        ease: "outCubic",
      },
      pos,
    );
  }

  private _unhighlight(
    tl: Timeline,
    action: Extract<Action, { type: "unhighlight" }>,
    pos?: number | string,
  ): void {
    const hl = this._activeHighlights.get(action.col);
    if (!hl) return;

    tl.to(
      hl,
      {
        opacity: 0,
        duration: T.FADE,
        ease: "outCubic",
        onComplete: () => {
          this._stage.highlights.remove(hl);
          this._activeHighlights.delete(action.col);
        },
      },
      pos,
    );
  }

  private _pulse(
    tl: Timeline,
    action: Extract<Action, { type: "pulse" }>,
    pos?: number | string,
  ): void {
    const digit = this._cellDigits.get(this._cellKey(action.ref));
    if (!digit) return;

    // scale up then back down
    const sub = new Timeline();
    sub
      .to(digit, { scale: 1.3, duration: T.PULSE * 0.4, ease: "outCubic" })
      .to(digit, {
        scale: 1.0,
        duration: T.PULSE * 0.6,
        ease: createSpring("snap"),
      });
    tl.add(sub, pos);
  }

  private _shake(
    tl: Timeline,
    action: Extract<Action, { type: "shake" }>,
    pos?: number | string,
  ): void {
    const digit = this._cellDigits.get(this._cellKey(action.ref));
    if (!digit) return;

    const origX = digit.x;
    const amp = 4;
    const sub = new Timeline();
    sub
      .to(digit, { x: origX - amp, duration: 0.05, ease: "linear" })
      .to(digit, { x: origX + amp, duration: 0.07, ease: "linear" })
      .to(digit, { x: origX - amp * 0.6, duration: 0.06, ease: "linear" })
      .to(digit, { x: origX + amp * 0.3, duration: 0.05, ease: "linear" })
      .to(digit, { x: origX, duration: 0.07, ease: "outCubic" });
    tl.add(sub, pos);
  }

  private _confirmPulse(
    tl: Timeline,
    action: Extract<Action, { type: "confirmPulse" }>,
    pos?: number | string,
  ): void {
    const targets: Digit[] = [];
    for (const row of action.rows) {
      for (const col of action.cols) {
        const d = this._cellDigits.get(`${row}:${col}`);
        if (d) targets.push(d);
      }
    }
    if (targets.length === 0) return;

    tl.stagger(
      targets,
      {
        scale: 1.15,
        duration: T.PULSE * 0.4,
        ease: "outCubic",
      },
      { each: 0.03 },
      pos,
    );

    // Return to normal
    const returnPos = `+=${T.PULSE * 0.4 + 0.03 * targets.length}`;
    tl.stagger(
      targets,
      {
        scale: 1.0,
        duration: T.PULSE * 0.5,
        ease: createSpring("snap"),
      },
      { each: 0.03 },
      returnPos,
    );
  }

  // --- B. Clone/Move ---

  private _cloneDigit(
    tl: Timeline,
    action: Extract<Action, { type: "cloneDigit" }>,
    pos?: number | string,
  ): void {
    const fromPos = this._cellPos(action.from);
    const toPos = this._resolveTarget(action.to);

    const digit = new Digit(
      action.value,
      fromPos.x,
      fromPos.y,
      this._config.fontSize * 0.8,
      "#4285F4",
    );
    digit.opacity = 1;
    digit.scale = 1;

    // Add to minibox layer if target is minibox-slot, else digits layer
    if (action.to.type === "minibox-slot") {
      this._stage.minibox.addSlot(digit);
      this._tokens.set(action.tokenId, { digit, layer: "minibox" });
    } else {
      this._stage.digits.add(digit);
      this._tokens.set(action.tokenId, { digit, layer: "digits" });
    }

    const arcH = dynamicArcHeight(
      vec2(fromPos.x, fromPos.y),
      vec2(toPos.x, toPos.y),
    );
    const dur = T.MOVE;
    const springEase = createSpring("slide");

    // Animate position with arc
    tl.to(
      digit,
      {
        x: toPos.x,
        duration: dur,
        ease: springEase,
        onUpdate: (p: number) => {
          const ap = arcPoint(
            vec2(fromPos.x, fromPos.y),
            vec2(toPos.x, toPos.y),
            p,
            arcH,
          );
          digit.y = ap.y;
        },
      },
      pos,
    );
  }

  private _moveToken(
    tl: Timeline,
    action: Extract<Action, { type: "moveToken" }>,
    pos?: number | string,
  ): void {
    const tracked = this._tokens.get(action.tokenId);
    if (!tracked) return;

    const digit = tracked.digit;
    const fromPos = vec2(digit.x, digit.y);
    const toPos = this._resolveTarget(action.to);
    const arcH = dynamicArcHeight(fromPos, vec2(toPos.x, toPos.y));
    const springEase = createSpring("slide");

    tl.to(
      digit,
      {
        x: toPos.x,
        duration: T.MOVE,
        ease: springEase,
        onUpdate: (p: number) => {
          const ap = arcPoint(fromPos, vec2(toPos.x, toPos.y), p, arcH);
          digit.y = ap.y;
        },
      },
      pos,
    );
  }

  private _snapToCell(
    tl: Timeline,
    action: Extract<Action, { type: "snapToCell" }>,
    pos?: number | string,
  ): void {
    const tracked = this._tokens.get(action.tokenId);
    if (!tracked) return;

    const digit = tracked.digit;
    const targetPos = this._cellPos(action.ref);

    if (action.writeValue) {
      digit.text = action.writeValue;
    }

    // Quick snap with spring
    tl.to(
      digit,
      {
        x: targetPos.x,
        y: targetPos.y,
        scale: 1,
        duration: 0.2,
        ease: createSpring("snap"),
        onComplete: () => {
          // Transfer to digits layer if was in minibox
          if (tracked.layer === "minibox") {
            this._stage.minibox.clearSlots();
            digit.color = this._colorStr(this._config.fontColor);
            digit.fontSize = this._config.fontSize;
            this._stage.digits.add(digit);
            tracked.layer = "digits";
          }
          this._cellDigits.set(this._cellKey(action.ref), digit);
        },
      },
      pos,
    );
  }

  // --- C. Calculation ---

  private _composeExpression(
    tl: Timeline,
    action: Extract<Action, { type: "composeExpression" }>,
    pos?: number | string,
  ): void {
    // Expression parts are displayed as minibox slot digits
    // This is handled by cloneDigit actions that follow
    // composeExpression is a semantic grouping — add a small pause
    tl.to({}, { duration: 0.05 }, pos);
  }

  private _revealResult(
    tl: Timeline,
    action: Extract<Action, { type: "revealResult" }>,
    pos?: number | string,
  ): void {
    const tracked = this._tokens.get(action.tokenId);
    if (tracked) {
      tracked.digit.text = action.value;
      tl.to(
        tracked.digit,
        {
          scale: 1,
          opacity: 1,
          duration: T.POP_IN,
          ease: createSpring("popIn"),
        },
        pos,
      );
      return;
    }

    // Create new digit in minibox result slot
    const resultPos = this._minibox.slotPos("result");
    const digit = new Digit(
      action.value,
      resultPos.x,
      resultPos.y,
      this._config.fontSize * 0.8,
      "#4285F4",
    );
    this._stage.minibox.addSlot(digit);
    this._tokens.set(action.tokenId, { digit, layer: "minibox" });

    tl.to(
      digit,
      {
        scale: 1,
        opacity: 1,
        duration: T.POP_IN,
        ease: createSpring("popIn"),
      },
      pos,
    );
  }

  private _splitBase10(
    tl: Timeline,
    action: Extract<Action, { type: "splitBase10" }>,
    pos?: number | string,
  ): void {
    const source = this._tokens.get(action.sourceTokenId);
    if (!source) return;

    const srcDigit = source.digit;
    const tensPos = this._minibox.slotPos("tens");
    const onesPos = this._minibox.slotPos("ones");

    // Fade out source
    tl.to(
      srcDigit,
      {
        opacity: 0,
        scale: 0.5,
        duration: T.SPLIT * 0.4,
        ease: "outCubic",
      },
      pos,
    );

    // Create tens digit
    const tensDigit = new Digit(
      String(action.tens.value),
      srcDigit.x,
      srcDigit.y,
      this._config.fontSize * 0.8,
      "#E91E63",
    );
    this._stage.minibox.addSlot(tensDigit);
    this._tokens.set(action.tens.tokenId, {
      digit: tensDigit,
      layer: "minibox",
    });

    // Create ones digit
    const onesDigit = new Digit(
      String(action.ones.value),
      srcDigit.x,
      srcDigit.y,
      this._config.fontSize * 0.8,
      "#4285F4",
    );
    this._stage.minibox.addSlot(onesDigit);
    this._tokens.set(action.ones.tokenId, {
      digit: onesDigit,
      layer: "minibox",
    });

    // Animate tens and ones from source position
    const splitStart = `+=${T.SPLIT * 0.3}`;
    tl.to(
      tensDigit,
      {
        x: tensPos.x,
        y: tensPos.y,
        scale: 1,
        opacity: 1,
        duration: T.SPLIT,
        ease: createSpring("popIn"),
      },
      splitStart,
    );

    tl.to(
      onesDigit,
      {
        x: onesPos.x,
        y: onesPos.y,
        scale: 1,
        opacity: 1,
        duration: T.SPLIT,
        ease: createSpring("popIn"),
      },
      "<",
    );
  }

  private _label(
    tl: Timeline,
    action: Extract<Action, { type: "label" }>,
    pos?: number | string,
  ): void {
    const targetPos = this._resolveTarget(action.target);
    const color = action.color ? this._colorStr(action.color) : "#888888";

    const digit = new Digit(
      action.text,
      targetPos.x,
      targetPos.y,
      this._config.fontSize * 0.6,
      color,
    );
    this._stage.digits.add(digit);

    tl.to(
      digit,
      {
        scale: 1,
        opacity: 1,
        duration: T.FADE,
        ease: "outCubic",
      },
      pos,
    );
  }

  private _writeCell(
    tl: Timeline,
    action: Extract<Action, { type: "writeCell" }>,
    pos?: number | string,
  ): void {
    const cellPos = this._cellPos(action.ref);
    const color = action.color
      ? this._colorStr(action.color)
      : this._colorStr(this._config.fontColor);

    const digit = new Digit(
      action.value,
      cellPos.x,
      cellPos.y,
      this._config.fontSize,
      color,
    );
    this._stage.digits.add(digit);
    this._cellDigits.set(this._cellKey(action.ref), digit);

    tl.to(
      digit,
      {
        scale: 1,
        opacity: 1,
        duration: T.POP_IN,
        ease: createSpring("popIn"),
      },
      pos,
    );
  }

  // --- D. Carry ---

  private _convertToCarryChip(
    tl: Timeline,
    action: Extract<Action, { type: "convertToCarryChip" }>,
    pos?: number | string,
  ): void {
    const source = this._tokens.get(action.tokenId);
    if (!source) return;

    const digit = source.digit;

    // Shrink and change appearance to carry chip
    tl.to(
      digit,
      {
        scale: this._config.carryScale / 100,
        fontSize: this._config.fontSize * 0.6,
        color: "#E91E63",
        duration: 0.25,
        ease: "outCubic",
      },
      pos,
    );

    digit.text = String(action.value);
    this._tokens.set(action.chipId, source);
  }

  private _moveChip(
    tl: Timeline,
    action: Extract<Action, { type: "moveChip" }>,
    pos?: number | string,
  ): void {
    const tracked = this._tokens.get(action.chipId);
    if (!tracked) return;

    const digit = tracked.digit;
    const fromPos = vec2(digit.x, digit.y);
    const toPos = this._cellPos(action.to);
    const arcH = dynamicArcHeight(fromPos, vec2(toPos.x, toPos.y));

    // Move to target cell top (carry position — slightly above)
    const carryY = toPos.y - this._config.rowH * 0.35;

    tl.to(
      digit,
      {
        x: toPos.x,
        duration: T.CARRY_MOVE,
        ease: createSpring("carry"),
        onUpdate: (p: number) => {
          const ap = arcPoint(fromPos, vec2(toPos.x, carryY), p, arcH);
          digit.y = ap.y;
        },
      },
      pos,
    );

    // Transfer to digits layer if in minibox
    if (tracked.layer === "minibox") {
      this._stage.digits.add(digit);
      tracked.layer = "digits";
    }
  }

  private _applyCarry(
    tl: Timeline,
    action: Extract<Action, { type: "applyCarry" }>,
    pos?: number | string,
  ): void {
    const tracked = this._tokens.get(action.chipId);
    if (!tracked) return;

    // Pulse then fade
    const sub = new Timeline();
    sub
      .to(tracked.digit, { scale: 1.2, duration: 0.15, ease: "outCubic" })
      .to(tracked.digit, {
        scale: 0.6,
        opacity: 0.3,
        duration: 0.3,
        ease: "outCubic",
      });
    tl.add(sub, pos);
  }

  // --- E. Borrow ---

  private _decrementDigit(
    tl: Timeline,
    action: Extract<Action, { type: "decrementDigit" }>,
    pos?: number | string,
  ): void {
    const digit = this._cellDigits.get(this._cellKey(action.ref));
    if (!digit) return;

    // Cross out old value and write new
    const sub = new Timeline();
    sub
      .to(digit, { opacity: 0.3, scale: 0.8, duration: 0.15, ease: "outCubic" })
      .to(digit, {
        duration: 0.01,
        onComplete: () => {
          digit.text = String(action.to);
          digit.color = "#E91E63";
        },
      })
      .to(digit, {
        opacity: 1,
        scale: 1,
        duration: T.POP_IN,
        ease: createSpring("popIn"),
      });
    tl.add(sub, pos);
  }

  private _spawnTenBlock(
    tl: Timeline,
    action: Extract<Action, { type: "spawnTenBlock" }>,
    pos?: number | string,
  ): void {
    const fromPos = this._cellPos(action.from);

    const digit = new Digit(
      "10",
      fromPos.x,
      fromPos.y,
      this._config.fontSize * 0.7,
      "#E91E63",
    );
    this._stage.digits.add(digit);
    this._tokens.set(action.tokenId, { digit, layer: "digits" });

    tl.to(
      digit,
      {
        scale: 1,
        opacity: 1,
        duration: T.POP_IN,
        ease: createSpring("popIn"),
      },
      pos,
    );
  }

  private _mergeTenWithOnes(
    tl: Timeline,
    action: Extract<Action, { type: "mergeTenWithOnes" }>,
    pos?: number | string,
  ): void {
    const tenTracked = this._tokens.get(action.tenTokenId);
    const onesDigit = this._cellDigits.get(this._cellKey(action.onesRef));
    if (!tenTracked || !onesDigit) return;

    const tenDigit = tenTracked.digit;
    const targetPos = this._cellPos(action.onesRef);

    // Move ten block toward ones digit
    const sub = new Timeline();
    sub.to(tenDigit, {
      x: targetPos.x,
      y: targetPos.y,
      opacity: 0,
      duration: T.BORROW,
      ease: "outCubic",
    });

    // Update ones digit value
    sub.to(
      onesDigit,
      {
        duration: 0.01,
        onComplete: () => {
          onesDigit.text = String(action.newValue);
          onesDigit.color = "#E91E63";
        },
      },
      `-=${T.BORROW * 0.3}`,
    );

    sub.to(
      onesDigit,
      {
        scale: 1.2,
        duration: 0.15,
        ease: "outCubic",
      },
      "<",
    );
    sub.to(onesDigit, {
      scale: 1.0,
      duration: 0.2,
      ease: createSpring("snap"),
    });

    tl.add(sub, pos);
  }

  private _borrowFromNextCol(
    tl: Timeline,
    action: Extract<Action, { type: "borrowFromNextCol" }>,
    pos?: number | string,
  ): void {
    // This is a semantic action — actual work is done by decrementDigit + spawnTenBlock + mergeTenWithOnes
    tl.to({}, { duration: 0.05 }, pos);
  }

  // --- F. Layout ---

  private _drawLine(
    tl: Timeline,
    action: Extract<Action, { type: "drawLine" }>,
    pos?: number | string,
  ): void {
    const y = this._grid.lineY(action.afterRow);
    const x1 =
      action.fromCol !== undefined
        ? this._grid.cellTopLeft(0, action.fromCol).x - 4
        : this._grid.lineX1();
    const x2 =
      action.toCol !== undefined
        ? this._grid.cellTopLeft(0, action.toCol).x + this._config.cellW + 4
        : this._grid.lineX2();

    const rule = new RuleLine(x1, y, x2);
    this._stage.grid.addRule(rule);

    tl.to(
      rule,
      {
        opacity: 1,
        duration: T.LINE_DRAW,
        ease: "outCubic",
        onComplete: () => this._stage.grid.markDirty(),
      },
      pos,
    );
    // markDirty during animation too
    rule.opacity = 1;
    this._stage.grid.markDirty();
  }

  private _showOperator(
    tl: Timeline,
    action: Extract<Action, { type: "showOperator" }>,
    pos?: number | string,
  ): void {
    const cellPos = this._grid.cellCenter(action.row, action.col);
    const color = action.color
      ? this._colorStr(action.color)
      : this._colorStr(this._config.fontColor);

    const digit = new Digit(
      action.op,
      cellPos.x,
      cellPos.y,
      this._config.fontSize,
      color,
    );
    digit.opacity = 1;
    digit.scale = 1;
    this._stage.grid.addOperator(digit);
    this._stage.grid.markDirty();

    // No animation needed — static element shown immediately
    tl.to({}, { duration: 0.01 }, pos);
  }

  private _showMinibox(
    tl: Timeline,
    action: Extract<Action, { type: "showMinibox" }>,
    pos?: number | string,
  ): void {
    if (action.nearRow !== undefined) {
      this._minibox.setActiveRow(action.nearRow);
    }

    const rect = this._minibox.boxRect();
    const bg = new MiniboxBg(rect.x, rect.y, rect.w, rect.h);
    this._stage.minibox.setBg(bg);

    tl.to(
      bg,
      {
        opacity: 1,
        duration: T.MINIBOX,
        ease: "outCubic",
      },
      pos,
    );
  }

  private _hideMinibox(
    tl: Timeline,
    action: Extract<Action, { type: "hideMinibox" }>,
    pos?: number | string,
  ): void {
    const bg = this._stage.minibox.bg;
    if (!bg) return;

    tl.to(
      bg,
      {
        opacity: 0,
        duration: T.FADE,
        ease: "outCubic",
        onComplete: () => {
          this._stage.minibox.clear();
        },
      },
      pos,
    );
  }

  private _clearMinibox(
    tl: Timeline,
    action: Extract<Action, { type: "clearMinibox" }>,
    pos?: number | string,
  ): void {
    // Fade out all minibox slots
    const slots = this._stage.minibox.slots;
    if (slots.length > 0) {
      for (const slot of slots) {
        tl.to(
          slot,
          {
            opacity: 0,
            scale: 0.5,
            duration: T.FADE * 0.6,
            ease: "outCubic",
          },
          pos,
        );
      }
    }
    tl.to(
      {},
      {
        duration: 0.01,
        onComplete: () => this._stage.minibox.clearSlots(),
      },
    );
  }

  // --- G. Control ---

  private _wait(tl: Timeline, pos?: number | string): void {
    tl.to({}, { duration: T.WAIT }, pos);
  }
}
