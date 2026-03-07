import type { EasingFn } from "./types";
import { lerp } from "./math";

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  velocity: number;
  restThreshold: number;
}

const DEFAULT_SPRING: SpringConfig = {
  stiffness: 170,
  damping: 26,
  mass: 1,
  velocity: 0,
  restThreshold: 0.01,
};

// Verlet integration 기반 Spring Solver
// 에너지 보존이 RK4보다 우수하고, 안정적
export class SpringSolver {
  private readonly _config: SpringConfig;
  private _lut: Float64Array | null = null;
  private _duration = 0;

  constructor(config?: Partial<SpringConfig>) {
    this._config = { ...DEFAULT_SPRING, ...config };
  }

  get duration(): number {
    if (!this._lut) this._precompute();
    return this._duration;
  }

  solve(): EasingFn {
    const lut = this._precompute();
    const len = lut.length;
    const duration = this._duration;

    return (t: number): number => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;

      const pos = t * (len - 1);
      const idx = Math.floor(pos);
      const frac = pos - idx;

      if (idx >= len - 1) return lut[len - 1]!;
      return lerp(lut[idx]!, lut[idx + 1]!, frac);
    };
  }

  private _precompute(): Float64Array {
    if (this._lut) return this._lut;

    const { stiffness, damping, mass, velocity, restThreshold } = this._config;
    const dt = 1 / 60; // 60fps 시뮬레이션
    const maxFrames = 600; // 최대 10초

    const values: number[] = [];
    let x = 0; // 현재 위치 (0 = start, 1 = end)
    let v = velocity;
    let prevX = x - v * dt; // Verlet에 필요한 이전 위치

    for (let i = 0; i < maxFrames; i++) {
      // Spring force: F = -k * (x - target)
      // Damping force: F = -c * v
      const springForce = -stiffness * (x - 1);
      const dampingForce = -damping * v;
      const acceleration = (springForce + dampingForce) / mass;

      // Verlet integration
      const nextX = 2 * x - prevX + acceleration * dt * dt;
      v = (nextX - prevX) / (2 * dt); // velocity estimate

      prevX = x;
      x = nextX;

      values.push(x);

      // 수렴 체크
      if (Math.abs(x - 1) < restThreshold && Math.abs(v) < restThreshold) {
        values[values.length - 1] = 1; // 정확히 1로 안착
        break;
      }
    }

    // 마지막 값이 1이 아니면 강제 수렴
    if (values[values.length - 1] !== 1) {
      values.push(1);
    }

    this._lut = new Float64Array(values);
    this._duration = values.length * dt;
    return this._lut;
  }
}

// 수학 풀이 맥락에 최적화된 프리셋
export const springPresets = {
  // 숫자 등장: 빠르고 탄력적인 pop
  popIn: {
    stiffness: 300,
    damping: 20,
    mass: 1,
    velocity: 0,
    restThreshold: 0.01,
  },

  // 올림 칩 이동: 바운스 있는 호 이동
  carry: {
    stiffness: 180,
    damping: 14,
    mass: 1,
    velocity: 0,
    restThreshold: 0.01,
  },

  // 부드러운 슬라이드: 강조 등장/퇴장
  slide: {
    stiffness: 200,
    damping: 26,
    mass: 1,
    velocity: 0,
    restThreshold: 0.01,
  },

  // 느린 안착: 결과 표시
  settle: {
    stiffness: 120,
    damping: 20,
    mass: 1,
    velocity: 0,
    restThreshold: 0.01,
  },

  // 빠른 스냅: 셀 고정
  snap: {
    stiffness: 400,
    damping: 30,
    mass: 1,
    velocity: 0,
    restThreshold: 0.01,
  },

  // 흔들림: shake 효과용 (낮은 댐핑)
  wobble: {
    stiffness: 180,
    damping: 10,
    mass: 1,
    velocity: 0,
    restThreshold: 0.01,
  },
} as const;

export type SpringPresetName = keyof typeof springPresets;

export function createSpring(
  configOrPreset?: Partial<SpringConfig> | SpringPresetName,
): EasingFn {
  if (typeof configOrPreset === "string") {
    const preset = springPresets[configOrPreset];
    return new SpringSolver(preset).solve();
  }
  return new SpringSolver(configOrPreset).solve();
}

export function springDuration(
  configOrPreset?: Partial<SpringConfig> | SpringPresetName,
): number {
  if (typeof configOrPreset === "string") {
    return new SpringSolver(springPresets[configOrPreset]).duration;
  }
  return new SpringSolver(configOrPreset).duration;
}
