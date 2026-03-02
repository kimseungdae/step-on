import type { Action } from "../dsl/actions";
import type { PositionTarget } from "../dsl/refs";
import type { Config } from "../types";
import type { PixelPos } from "../layout/grid";
import type { RenderState } from "./state";
import {
  createTextLayer,
  createRectLayer,
  createLineLayer,
  resetLayerIdx,
} from "./lottie-builders";
import { fadeInAt, positionAnimated } from "../keyframes";
import {
  scalePop,
  scalePulse,
  shakeX,
  arcPosition,
  shrinkScale,
} from "./effects";

export { resetLayerIdx };

function resolvePos(target: PositionTarget, state: RenderState): PixelPos {
  switch (target.type) {
    case "cell":
      return state.layout.grid.cellCenter(
        target.ref.address.row,
        target.ref.address.col,
      );
    case "minibox-slot":
      return state.layout.minibox.slotPos(target.slot);
    case "absolute":
      return { x: target.x, y: target.y };
  }
}

function cellPos(state: RenderState, row: number, col: number): PixelPos {
  return state.layout.grid.cellCenter(row, col);
}

export function getDefaultDuration(action: Action, config: Config): number {
  switch (action.type) {
    case "highlight":
      return config.highlightFrames;
    case "unhighlight":
      return 0;
    case "pulse":
      return 18;
    case "shake":
      return 15;
    case "confirmPulse":
      return 15;
    case "writeCell":
      return config.placeFrames;
    case "moveToken":
      return config.carryFrames;
    case "cloneDigit":
      return config.placeFrames;
    case "snapToCell":
      return config.placeFrames;
    case "composeExpression":
      return config.placeFrames;
    case "revealResult":
      return config.resultFrames;
    case "splitBase10":
      return 18;
    case "label":
      return config.annotationFrames;
    case "convertToCarryChip":
      return 15;
    case "moveChip":
      return config.carryFrames;
    case "applyCarry":
      return 8;
    case "decrementDigit":
      return config.placeFrames;
    case "spawnTenBlock":
      return config.placeFrames;
    case "mergeTenWithOnes":
      return config.placeFrames;
    case "borrowFromNextCol":
      return 0;
    case "drawLine":
      return config.lineFrames;
    case "showOperator":
      return config.placeFrames;
    case "showMinibox":
      return 12;
    case "hideMinibox":
      return 12;
    case "clearMinibox":
      return 0;
    case "wait":
      return config.placeFrames;
  }
}

export function handleAction(
  action: Action,
  state: RenderState,
  dur: number,
): void {
  const f = state.frame;
  const tf = 0; // placeholder; fixTotalFrames sets real value for persistent layers

  switch (action.type) {
    case "writeCell": {
      const pos = cellPos(
        state,
        action.ref.address.row,
        action.ref.address.col,
      );
      const idx = state.addLayer(
        createTextLayer({
          text: action.value,
          pos,
          frame: f,
          totalFrames: tf,
          config: state.config,
          color: action.color,
        }),
      );
      state.registerCellLayer(
        action.ref.address.row,
        action.ref.address.col,
        idx,
      );
      break;
    }

    case "highlight": {
      const grid = state.layout.grid;
      const tl = grid.cellTopLeft(Math.min(...action.rows), action.col);
      const rowSpan = Math.max(...action.rows) - Math.min(...action.rows) + 1;
      const idx = state.addLayer(
        createRectLayer({
          x: tl.x - 2,
          y: tl.y - 4,
          w: state.config.cellW + 4,
          h: rowSpan * state.config.rowH + 8,
          fillColor: action.color ?? [0.29, 0.56, 0.85],
          frame: f,
          dur: 99999,
          totalFrames: tf,
        }),
      );
      state.activeHighlightIdx = idx;
      break;
    }

    case "unhighlight":
      if (state.activeHighlightIdx !== undefined) {
        state.endLayerAt(state.activeHighlightIdx, f);
        state.activeHighlightIdx = undefined;
      }
      break;

    case "drawLine": {
      const grid = state.layout.grid;
      const y = grid.lineY(action.afterRow);
      const x1 =
        action.fromCol !== undefined
          ? grid.cellTopLeft(0, action.fromCol).x - 4
          : grid.lineX1();
      const x2 =
        action.toCol !== undefined
          ? grid.cellTopLeft(0, action.toCol).x + state.config.cellW + 4
          : grid.lineX2();
      state.addLayer(
        createLineLayer({
          x1,
          y1: y,
          x2,
          y2: y,
          frame: f,
          totalFrames: tf,
        }),
      );
      break;
    }

    case "showOperator": {
      const pos = cellPos(state, action.row, action.col);
      const display = action.op === "-" ? "\u2212" : action.op;
      state.addLayer(
        createTextLayer({
          text: display,
          pos,
          frame: f,
          totalFrames: tf,
          config: state.config,
          color: action.color,
        }),
      );
      break;
    }

    case "cloneDigit": {
      const fromPos = cellPos(
        state,
        action.from.address.row,
        action.from.address.col,
      );
      const toPos = resolvePos(action.to, state);
      const layer = createMovingTextLayer(
        action.value,
        fromPos,
        toPos,
        f,
        dur,
        state,
      );
      const idx = state.addLayer(layer);
      state.registerToken(action.tokenId, toPos, action.value, idx);
      if (action.to.type === "minibox-slot") {
        state.addMiniboxLayer(idx);
      }
      break;
    }

    case "moveToken": {
      const tok = state.getToken(action.tokenId);
      if (!tok) break;
      const toPos = resolvePos(action.to, state);
      state.endLayerAt(tok.layerIndex, f);
      const layer = createMovingTextLayer(
        tok.value,
        tok.pos,
        toPos,
        f,
        dur,
        state,
      );
      const idx = state.addLayer(layer);
      tok.layerIndex = idx;
      state.updateTokenPos(action.tokenId, toPos);
      break;
    }

    case "snapToCell": {
      const tok = state.getToken(action.tokenId);
      if (!tok) break;
      const toPos = cellPos(
        state,
        action.ref.address.row,
        action.ref.address.col,
      );
      if (action.writeValue) {
        const idx = state.addLayer(
          createTextLayer({
            text: action.writeValue,
            pos: toPos,
            frame: f,
            totalFrames: tf,
            config: state.config,
          }),
        );
        state.registerCellLayer(
          action.ref.address.row,
          action.ref.address.col,
          idx,
        );
      }
      state.updateTokenPos(action.tokenId, toPos);
      state.removeToken(action.tokenId);
      break;
    }

    case "composeExpression": {
      const mb = state.layout.minibox;
      let positions: PixelPos[];

      if (action.parts.length <= 3) {
        positions = [mb.slotPos("left"), mb.slotPos("op"), mb.slotPos("right")];
      } else {
        // 5-part expression like "1 + 2 + 3": distribute evenly
        const ox = mb.originX;
        const cw = state.config.cellW;
        const y = mb.slotPos("left").y;
        const n = action.parts.length;
        positions = [];
        for (let i = 0; i < n; i++) {
          const x = ox + cw * (0.8 + (i * 4.0) / (n - 1));
          positions.push({ x, y });
        }
      }

      for (let i = 0; i < action.parts.length; i++) {
        const pos = positions[i]!;
        const idx = state.addLayer(
          createTextLayer({
            text: action.parts[i]!,
            pos,
            frame: f + i * 2,
            totalFrames: tf,
            config: state.config,
          }),
        );
        state.addMiniboxLayer(idx);
      }
      break;
    }

    case "revealResult": {
      const pos = state.layout.minibox.slotPos("result");
      const eqPos = state.layout.minibox.slotPos("eq");
      const eqIdx = state.addLayer(
        createTextLayer({
          text: "=",
          pos: eqPos,
          frame: f,
          totalFrames: tf,
          config: state.config,
        }),
      );
      state.addMiniboxLayer(eqIdx);
      const layer = createTextLayer({
        text: action.value,
        pos,
        frame: f,
        totalFrames: tf,
        config: state.config,
      });
      layer.ks.s = scalePop(f, dur);
      const idx = state.addLayer(layer);
      state.registerToken(action.tokenId, pos, action.value, idx);
      state.addMiniboxLayer(idx);
      break;
    }

    case "splitBase10": {
      const tok = state.getToken(action.sourceTokenId);
      if (!tok) break;

      // End source "12" layer
      state.endLayerAt(tok.layerIndex, f);

      // Both tokens start from the source (=12) position, animate to tens/ones slots
      const sourcePos = tok.pos;
      const tensTarget = state.layout.minibox.slotPos("tens");
      const onesTarget = state.layout.minibox.slotPos("ones");

      // Tens: animate from "12" position spreading to left slot
      const tLayer = createMovingTextLayer(
        String(action.tens.value),
        sourcePos,
        tensTarget,
        f,
        dur,
        state,
      );
      const tIdx = state.addLayer(tLayer);
      state.registerToken(
        action.tens.tokenId,
        tensTarget,
        String(action.tens.value),
        tIdx,
      );
      state.addMiniboxLayer(tIdx);

      // Ones: animate from "12" position spreading to right slot
      const oLayer = createMovingTextLayer(
        String(action.ones.value),
        sourcePos,
        onesTarget,
        f,
        dur,
        state,
      );
      const oIdx = state.addLayer(oLayer);
      state.registerToken(
        action.ones.tokenId,
        onesTarget,
        String(action.ones.value),
        oIdx,
      );
      state.addMiniboxLayer(oIdx);

      // Remove source token without ending layer again
      state.tokens.delete(action.sourceTokenId);
      break;
    }

    case "label": {
      const pos = resolvePos(action.target, state);
      const fontSize = Math.round(state.config.fontSize * 0.55);
      const idx = state.addLayer(
        createTextLayer({
          text: action.text,
          pos,
          frame: f,
          totalFrames: tf,
          config: state.config,
          fontSize,
          color: action.color,
        }),
      );
      state.addMiniboxLayer(idx);
      break;
    }

    case "convertToCarryChip": {
      const tok = state.getToken(action.tokenId);
      if (!tok) break;
      state.endLayerAt(tok.layerIndex, f);
      const layer = createTextLayer({
        text: String(action.value),
        pos: tok.pos,
        frame: f,
        totalFrames: tf,
        config: state.config,
        fontSize: Math.round(
          (state.config.fontSize * state.config.carryScale) / 100,
        ),
      });
      layer.ks.s = shrinkScale(f, 100, state.config.carryScale, dur);
      const idx = state.addLayer(layer);
      state.registerToken(action.chipId, tok.pos, String(action.value), idx);
      state.tokens.delete(action.tokenId);
      break;
    }

    case "moveChip": {
      const tok = state.getToken(action.chipId);
      if (!tok) break;
      state.endLayerAt(tok.layerIndex, f);
      const toPos = cellPos(
        state,
        action.to.address.row,
        action.to.address.col,
      );
      const carryY = toPos.y - state.config.rowH * 0.1;
      const destPos = { x: toPos.x, y: carryY };
      const layer = createTextLayer({
        text: tok.value,
        pos: tok.pos,
        frame: f,
        totalFrames: tf,
        config: state.config,
        fontSize: Math.round(
          (state.config.fontSize * state.config.carryScale) / 100,
        ),
      });
      layer.ks.p = arcPosition(
        f,
        tok.pos.x,
        tok.pos.y,
        destPos.x,
        destPos.y,
        dur,
      );
      layer.ks.o = fadeInAt(f, dur);
      const idx = state.addLayer(layer);
      tok.layerIndex = idx;
      state.updateTokenPos(action.chipId, destPos);
      break;
    }

    case "applyCarry": {
      state.removeToken(action.chipId);
      break;
    }

    case "decrementDigit": {
      const pos = cellPos(
        state,
        action.ref.address.row,
        action.ref.address.col,
      );
      const newLayer = createTextLayer({
        text: String(action.to),
        pos,
        frame: f,
        totalFrames: tf,
        config: state.config,
      });
      const idx = state.addLayer(newLayer);
      state.registerCellLayer(
        action.ref.address.row,
        action.ref.address.col,
        idx,
      );
      break;
    }

    case "spawnTenBlock": {
      const fromPos = cellPos(
        state,
        action.from.address.row,
        action.from.address.col,
      );
      const layer = createTextLayer({
        text: "10",
        pos: fromPos,
        frame: f,
        totalFrames: tf,
        config: state.config,
        fontSize: Math.round(state.config.fontSize * 0.7),
        color: [0.85, 0.2, 0.2],
      });
      layer.ks.s = scalePop(f, dur);
      const idx = state.addLayer(layer);
      state.registerToken(action.tokenId, fromPos, "10", idx);
      break;
    }

    case "mergeTenWithOnes": {
      const tenTok = state.getToken(action.tenTokenId);
      const toPos = cellPos(
        state,
        action.onesRef.address.row,
        action.onesRef.address.col,
      );
      if (tenTok) {
        state.endLayerAt(tenTok.layerIndex, f);
        const mLayer = createMovingTextLayer(
          "10",
          tenTok.pos,
          toPos,
          f,
          dur,
          state,
          Math.round(state.config.fontSize * 0.7),
        );
        const mIdx = state.addLayer(mLayer);
        state.endLayerAt(mIdx, f + dur);
        state.tokens.delete(action.tenTokenId);
      }
      const newLayer = createTextLayer({
        text: String(action.newValue),
        pos: toPos,
        frame: f + dur,
        totalFrames: tf,
        config: state.config,
      });
      const newIdx = state.addLayer(newLayer);
      state.registerCellLayer(
        action.onesRef.address.row,
        action.onesRef.address.col,
        newIdx,
      );
      break;
    }

    case "borrowFromNextCol":
      break;

    case "pulse": {
      const pos = cellPos(
        state,
        action.ref.address.row,
        action.ref.address.col,
      );
      const layer = createTextLayer({
        text: "",
        pos,
        frame: f,
        totalFrames: tf,
        config: state.config,
      });
      layer.ks.s = scalePulse(f, dur);
      state.addLayer(layer);
      break;
    }

    case "shake": {
      const pos = cellPos(
        state,
        action.ref.address.row,
        action.ref.address.col,
      );
      const layer = createTextLayer({
        text: "",
        pos,
        frame: f,
        totalFrames: tf,
        config: state.config,
      });
      layer.ks.p = {
        a: 1,
        k: (shakeX(f, pos.x, dur).k as Array<{ t: number; s: number[] }>).map(
          (kf) => ({ ...kf, s: [kf.s[0]!, pos.y] }),
        ),
      };
      state.addLayer(layer);
      break;
    }

    case "confirmPulse": {
      for (const row of action.rows) {
        for (const col of action.cols) {
          const pos = cellPos(state, row, col);
          const layer = createTextLayer({
            text: "",
            pos,
            frame: f,
            totalFrames: tf,
            config: state.config,
          });
          layer.ks.s = scalePulse(f, dur);
          state.addLayer(layer);
        }
      }
      break;
    }

    case "showMinibox": {
      if (action.nearRow !== undefined) {
        state.layout.minibox.setActiveRow(action.nearRow);
      }
      const rect = state.layout.minibox.boxRect();
      const idx = state.addLayer(
        createRectLayer({
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
          fillColor: [0.95, 0.95, 0.95],
          frame: f,
          dur: 99999,
          totalFrames: tf,
          radius: 8,
        }),
      );
      state.addMiniboxLayer(idx);
      break;
    }

    case "hideMinibox":
      state.clearMiniboxLayersAt(f);
      break;

    case "clearMinibox":
      state.clearMiniboxLayersAt(f);
      break;

    case "wait":
      break;
  }
}

function createMovingTextLayer(
  text: string,
  from: PixelPos,
  to: PixelPos,
  frame: number,
  dur: number,
  state: RenderState,
  fontSize?: number,
) {
  const layer = createTextLayer({
    text,
    pos: from,
    frame,
    totalFrames: 0,
    config: state.config,
    fontSize,
  });
  layer.ks.p = positionAnimated(frame, from.x, from.y, to.x, to.y, dur);
  return layer;
}
