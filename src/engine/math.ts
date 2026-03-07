export interface Vec2 {
  x: number;
  y: number;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function vec2Lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function vec2Dist(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function arcPoint(
  from: Vec2,
  to: Vec2,
  t: number,
  arcHeight: number,
): Vec2 {
  const x = lerp(from.x, to.x, t);
  const baseY = lerp(from.y, to.y, t);
  const arc = -4 * arcHeight * t * (1 - t);
  return { x, y: baseY + arc };
}

export function dynamicArcHeight(from: Vec2, to: Vec2): number {
  const dist = vec2Dist(from, to);
  return Math.max(20, dist * 0.35);
}
