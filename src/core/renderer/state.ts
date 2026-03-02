import type { Config, LottieLayer, LottieMarker } from "../types";
import type { Layout } from "../layout/index";
import type { PixelPos } from "../layout/grid";

export interface TokenState {
  pos: PixelPos;
  value: string;
  visible: boolean;
  layerIndex: number;
}

export class RenderState {
  frame = 0;
  layers: LottieLayer[] = [];
  markers: LottieMarker[] = [];
  tokens = new Map<string, TokenState>();
  config: Config;
  layout: Layout;

  // Layer lifecycle tracking
  cellLayers = new Map<string, number>(); // "row-col" -> layer index
  miniboxLayers: number[] = [];
  activeHighlightIdx: number | undefined = undefined;

  constructor(config: Config, layout: Layout) {
    this.config = config;
    this.layout = layout;
  }

  advance(frames: number): void {
    this.frame += frames;
  }

  addLayer(layer: LottieLayer): number {
    this.layers.push(layer);
    return this.layers.length - 1;
  }

  addMarker(name: string, frame: number, duration: number): void {
    this.markers.push({ tm: frame, cm: name, dr: duration });
  }

  endLayerAt(layerIdx: number, frame: number): void {
    const layer = this.layers[layerIdx];
    if (layer && layer.op === 0) {
      layer.op = frame;
    }
  }

  registerCellLayer(row: number, col: number, layerIdx: number): void {
    const key = `${row}-${col}`;
    const old = this.cellLayers.get(key);
    if (old !== undefined) {
      this.endLayerAt(old, this.frame);
    }
    this.cellLayers.set(key, layerIdx);
  }

  addMiniboxLayer(layerIdx: number): void {
    this.miniboxLayers.push(layerIdx);
  }

  clearMiniboxLayersAt(frame: number): void {
    for (const idx of this.miniboxLayers) {
      this.endLayerAt(idx, frame);
    }
    this.miniboxLayers = [];
  }

  registerToken(
    id: string,
    pos: PixelPos,
    value: string,
    layerIndex: number,
  ): void {
    this.tokens.set(id, { pos, value, visible: true, layerIndex });
  }

  getToken(id: string): TokenState | undefined {
    return this.tokens.get(id);
  }

  updateTokenPos(id: string, pos: PixelPos): void {
    const token = this.tokens.get(id);
    if (token) token.pos = pos;
  }

  removeToken(id: string): void {
    const tok = this.tokens.get(id);
    if (tok) {
      this.endLayerAt(tok.layerIndex, this.frame);
    }
    this.tokens.delete(id);
  }

  fixTotalFrames(): void {
    for (const layer of this.layers) {
      if (layer.op === 0) {
        layer.op = this.frame;
      }
    }
  }
}
