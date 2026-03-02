# step-on v2: 전면 리라이트

## Context

현재 아키텍처(`Math → Lottie layers 직접 생성`)는 세밀한 교육적 서브스텝(올림/빌림 이동, 가로식 계산 시각화 등)을 구현하기 어려움. **DSL 중간 표현(IR)을 도입**하여 `Math → Step/SubStep DSL → Renderer → Lottie` 3단계 파이프라인으로 전면 재설계.

**핵심 원칙**: Step(TTS 1문장) 안에 SubStep(원자 동작 여러 개). 플레이어는 Step[]을 돌리고, 각 Step 내부에서 SubStep[]을 순차 실행.

**결정사항**:

- 출력: Pre-compiled Lottie (단일 LottieAnimation JSON + StepMeta[])
- 범위: 4칙연산 전부
- Mini-box: 세로식 우측 배치
- 캔버스: 크기 제약 없음

---

## Architecture Overview

```
Problem {a, b, op}
    ↓
Compiler (연산별)  →  Step[]  (DSL: 교육적 시퀀스)
    ↓
Renderer           →  { animation: LottieAnimation, steps: StepMeta[] }
    ↓
Player             →  lottie-web 재생 + step navigation + TTS 매핑
```

## Canvas Layout

```
┌─────── Worksheet ──────────┬── gap ──┬──── MiniBox ────┐
│                             │         │                  │
│ Carry:  [  ] [C1] [  ]    │         │ ┌──────────────┐ │
│                             │         │ │ 7 + 8        │ │
│ A:      [ 0] [ 4] [ 7]    │         │ │   = 15       │ │
│ B:    + [ 0] [ 5] [ 8]    │         │ │ [10]   [5]   │ │
│ ────────────────────────   │         │ └──────────────┘ │
│ R:      [  ] [  ] [  ]    │         │                  │
│                             │         │                  │
└─────────────────────────────┴─────────┴──────────────────┘
```

---

## File Structure

```
src/core/
  # KEEP AS-IS
  types.ts              # Lottie JSON 타입 + Config (annotationFrames 이미 추가됨)
  keyframes.ts          # staticVal, fadeIn, fadeOut, fadeInAt, positionAnimated

  # DELETE (compiler/renderer로 대체)
  addition.ts, subtraction.ts, multiplication.ts, division.ts
  layers.ts, coord.ts, assets.ts

  # NEW: DSL 타입
  dsl/
    refs.ts             # CellRef, TokenId, PositionTarget
    actions.ts          # Action union type (28+ action types)
    step.ts             # Step, SubStep, StepMeta, GenerateResult

  # NEW: Layout Engine
  layout/
    index.ts            # createLayout() factory
    grid.ts             # WorksheetGrid (셀 좌표 계산)
    minibox.ts          # MiniBoxLayout (우측 미니박스)
    coord.ts            # canvasSize, toDigits 등 유틸

  # NEW: Compilers
  compiler/
    index.ts            # compileSteps(problem) dispatcher
    addition.ts         # 덧셈 → Step[] (carry chain)
    subtraction.ts      # 뺄셈 → Step[] (borrow chain)
    multiplication.ts   # 곱셈 → Step[] (partial products)
    division.ts         # 나눗셈 → Step[] (long division)
    helpers.ts          # toDigits, digitAt 등 공통

  # NEW: Renderer
  renderer/
    index.ts            # renderSteps() → GenerateResult
    state.ts            # RenderState (frame counter, token registry)
    action-handlers.ts  # Action type → Lottie layer 변환 맵
    lottie-builders.ts  # createTextLayer, createRectLayer, createLineLayer
    effects.ts          # scalePop, scalePulse, shakeX, arcPosition, bounceSnap

  # NEW: Public API
  generate.ts           # generate(problem, config?) → GenerateResult
  index.ts              # 재작성

  __tests__/            # 전면 재작성
```

---

## Key Type Definitions

### CellRef & TokenId (`dsl/refs.ts`)

```typescript
export interface CellAddress {
  row: number;
  col: number;
} // col 0=ones
export type Region = "worksheet" | "minibox";
export interface CellRef {
  region: "worksheet";
  address: CellAddress;
}
export type TokenId = string; // "digit-a-col2", "carry-chip-1"
export type PositionTarget =
  | { type: "cell"; ref: CellRef }
  | { type: "minibox-slot"; slot: MiniboxSlot }
  | { type: "absolute"; x: number; y: number };
export type MiniboxSlot =
  | "left"
  | "op"
  | "right"
  | "carry-prefix"
  | "eq"
  | "result"
  | "tens"
  | "ones";
```

### Action Types (`dsl/actions.ts`) — 28 types

**A. Highlight/Guide**: `highlight`, `unhighlight`, `pulse`, `shake`, `confirmPulse`, `showAlignGuide`, `hideAlignGuide`

**B. Clone/Move**: `cloneDigit`, `moveToken`, `snapToCell`

**C. Calculation**: `composeExpression`, `revealResult`, `splitBase10`, `label`, `writeCell`

**D. Carry**: `convertToCarryChip`, `moveChip`, `applyCarry`

**E. Borrow**: `decrementDigit`, `spawnTenBlock`, `mergeTenWithOnes`, `borrowFromNextCol`

**F. Layout**: `drawLine`, `showOperator`, `showMinibox`, `hideMinibox`, `clearMinibox`

### Step/SubStep (`dsl/step.ts`)

```typescript
export interface SubStep {
  action: Action;
  durationFrames?: number; // override default
  delayAfter?: number; // pause after
}
export interface Step {
  id: string; // "col-0-highlight"
  ttsText: string; // TTS 문장
  subSteps: SubStep[];
}
export interface StepMeta {
  id: string;
  ttsText: string;
  startFrame: number;
  endFrame: number;
  markerName: string;
}
export interface GenerateResult {
  animation: LottieAnimation;
  steps: StepMeta[];
}
```

---

## Compiler Logic (연산별)

### 덧셈 (`compiler/addition.ts`)

1. Setup: writeCell(A), writeCell(B), showOperator(+), drawLine
2. 오른쪽→왼쪽 컬럼 순회:
   - **highlight** column
   - **cloneDigit** → minibox, **composeExpression** (carry 포함)
   - **revealResult**(sum)
   - sum < 10: moveToken→resultCell, writeCell
   - sum ≥ 10: **splitBase10**, ones→resultCell, tens→**convertToCarryChip**→**moveChip**
   - clearMinibox, unhighlight
3. Final carry → writeCell
4. confirmPulse 완료

### 뺄셈 (`compiler/subtraction.ts`)

1. Setup 동일
2. 컬럼 순회:
   - da ≥ db: 단순 뺄셈
   - da < db: **shake**(부족), **borrow chain** (decrementDigit → spawnTenBlock → mergeTenWithOnes), 그 후 계산

### 곱셈 (`compiler/multiplication.ts`)

- 1자리 B: 덧셈과 유사한 컬럼 처리
- 다자리 B: partial product rows → 합산

### 나눗셈 (`compiler/division.ts`)

- Setup: divisor, bracket, dividend, vinculum
- 각 digit: bring-down → estimate → quotient → multiply → subtract → remainder

---

## Renderer Architecture

### RenderState (`renderer/state.ts`)

```typescript
interface RenderState {
  frame: number;
  layers: LottieLayer[];
  markers: LottieMarker[];
  tokens: Map<string, TokenState>; // id → {pos, value, visible, layerIndex}
  layerCounter: number;
  config: Config;
  layout: Layout;
}
```

### 렌더링 흐름 (`renderer/index.ts`)

```
1. RenderState 초기화 (frame=0)
2. for each Step:
     stepStartFrame = state.frame
     for each SubStep:
       handler = actionHandlers[action.type]
       handler(action, state)  // layers 추가 + state 변경
       state.advance(duration + delayAfter)
     StepMeta 기록 + LottieMarker 추가
3. fixTotalFrames(): 모든 layer.op = state.frame
4. return { animation, steps }
```

### Action → Lottie 매핑 (주요)

| Action             | Lottie Output                  | 기본 Frames      |
| ------------------ | ------------------------------ | ---------------- |
| highlight          | rectShape fadeIn/fadeOut       | highlightFrames  |
| writeCell          | textLayer fadeInAt             | placeFrames      |
| moveToken          | position keyframes (bezier)    | carryFrames      |
| revealResult       | textLayer + scalePop effect    | resultFrames     |
| splitBase10        | source fadeOut + 2 new fadeIn  | 12               |
| pulse              | scale 100→120→100              | 12               |
| shake              | x oscillation                  | 10               |
| convertToCarryChip | shrink + label change          | 8                |
| moveChip           | arc bezier position            | carryFrames      |
| decrementDigit     | crossfade (old→new)            | placeFrames      |
| drawLine           | line shape fadeInAt            | lineFrames       |
| label              | small text fadeIn/hold/fadeOut | annotationFrames |

### Effects (`renderer/effects.ts`)

기존 keyframes.ts 확장: `scalePop`, `scalePulse`, `shakeX`, `arcPosition`, `bounceSnap`

### Lottie Builders (`renderer/lottie-builders.ts`)

기존 layers.ts 리팩터링: `createTextLayer(opts)`, `createRectLayer(opts)`, `createLineLayer(opts)` — PixelPos 직접 수신

---

## Implementation Phases

### Phase 1: Foundation (타입 + 레이아웃 + 빌더)

- `dsl/refs.ts`, `dsl/actions.ts`, `dsl/step.ts`
- `layout/grid.ts`, `layout/minibox.ts`, `layout/coord.ts`, `layout/index.ts`
- `renderer/lottie-builders.ts`, `renderer/effects.ts`, `renderer/state.ts`
- **테스트**: layout 좌표 검증, builder 구조 검증, effects keyframe 검증

### Phase 2: Renderer Core

- `renderer/action-handlers.ts`, `renderer/index.ts`
- 수동 Step[] → Lottie 변환 테스트
- **테스트**: 각 action handler unit test, renderSteps integration test

### Phase 3: Addition Compiler

- `compiler/helpers.ts`, `compiler/addition.ts`, `generate.ts`
- **첫 번째 end-to-end 파이프라인 완성**
- **테스트**: 12+34, 27+35(carry), 999+1(cascade), 5+123(다른 자릿수)
- StepMeta 검증, Lottie marker 검증

### Phase 4: Subtraction Compiler

- `compiler/subtraction.ts`
- **테스트**: 56-23, 42-17(borrow), 100-1(cascade), 1000-1

### Phase 5: Multiplication Compiler

- `compiler/multiplication.ts`
- **테스트**: 3×4, 23×4, 12×34(partial), 99×9

### Phase 6: Division Compiler

- `compiler/division.ts`
- **테스트**: 84÷4, 100÷5, 10÷3(r1), 144÷12

### Phase 7: Public API + Vue + Demo

- `index.ts`, `lib.ts`, `generate.ts`
- StepPlayer.vue step navigation 추가
- DemoView.vue StepMeta 표시

### Phase 8: Polish + Build

- npm test 전체 통과, build:lib 확인
- README 업데이트, version 0.2.0

---

## Reusable from Current Code

| 파일             | 상태            | 이유                                                                 |
| ---------------- | --------------- | -------------------------------------------------------------------- |
| `keyframes.ts`   | **그대로 유지** | staticVal, fadeIn, fadeOut, fadeInAt, positionAnimated — 모두 재사용 |
| `types.ts`       | **유지 + 확장** | Lottie JSON 타입 유지, Config에 이미 annotationFrames 추가됨         |
| `package.json`   | **유지**        | version bump만                                                       |
| `vite.config.*`  | **유지**        |                                                                      |
| `tsconfig.*`     | **유지**        |                                                                      |
| `StepPlayer.vue` | **유지 + 확장** | step navigation 기능 추가                                            |

## Verification

각 Phase 완료 시:

1. `npm test` 통과
2. `npx vue-tsc --noEmit` 타입 체크
3. Phase 3 이후: `npm run dev` → 브라우저에서 애니메이션 확인
4. 최종: 47+58, 52-38, 12×34, 84÷4 모두 정상 확인
