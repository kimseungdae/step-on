import { clamp, lerp } from "./math";

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSLA {
  h: number;
  s: number;
  l: number;
  a: number;
}

export function rgba(r: number, g: number, b: number, a = 1): RGBA {
  return { r, g, b, a };
}

export function parseColor(str: string): RGBA {
  if (str.startsWith("#")) {
    return parseHex(str);
  }
  if (str.startsWith("rgb")) {
    return parseRgb(str);
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function parseHex(hex: string): RGBA {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
  }
  if (hex.length === 6) {
    hex += "ff";
  }
  const n = parseInt(hex, 16);
  return {
    r: (n >> 24) & 0xff,
    g: (n >> 16) & 0xff,
    b: (n >> 8) & 0xff,
    a: (n & 0xff) / 255,
  };
}

function parseRgb(str: string): RGBA {
  const nums = str.match(/[\d.]+/g);
  if (!nums) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: Number(nums[0]),
    g: Number(nums[1]),
    b: Number(nums[2]),
    a: nums[3] !== undefined ? Number(nums[3]) : 1,
  };
}

export function rgbaToString(c: RGBA): string {
  return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${c.a.toFixed(3)})`;
}

export function lerpColor(a: RGBA, b: RGBA, t: number): RGBA {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
    a: lerp(a.a, b.a, t),
  };
}

export function rgbaToHsla(c: RGBA): HSLA {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100, a: c.a };
}

export function hslaToRgba(c: HSLA): RGBA {
  const h = c.h / 360;
  const s = c.s / 100;
  const l = c.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v, a: c.a };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    a: c.a,
  };
}

export function lerpColorHSL(a: RGBA, b: RGBA, t: number): RGBA {
  const ha = rgbaToHsla(a);
  const hb = rgbaToHsla(b);
  const result: HSLA = {
    h: lerp(ha.h, hb.h, t),
    s: lerp(ha.s, hb.s, t),
    l: lerp(ha.l, hb.l, t),
    a: lerp(ha.a, hb.a, t),
  };
  return hslaToRgba(result);
}

export function normalizedToRgba(arr: number[]): RGBA {
  return {
    r: Math.round((arr[0] ?? 0) * 255),
    g: Math.round((arr[1] ?? 0) * 255),
    b: Math.round((arr[2] ?? 0) * 255),
    a: arr[3] ?? 1,
  };
}
