# step-on

Animated step-by-step column arithmetic for education. Generates [Lottie](https://airbnb.io/lottie/) animations with **step navigation** and **TTS** for addition, subtraction, multiplication, and division — entirely in the browser.

[Demo](https://step-on.vercel.app) · [한국어](#한국어)

## Features

- **Four operations**: Addition (carry), Subtraction (borrow), Multiplication (partial products), Division (long division)
- **Step-by-step playback**: Each step has TTS narration, navigation controls, and Lottie markers
- **Educational animations**: Carry chips fly to the next column, borrow chains cascade, digits split and merge
- **Pre-compiled Lottie**: Single JSON + StepMeta[] — no runtime computation during playback
- **Framework-agnostic**: Use `step-on/core` standalone or `step-on` with Vue 3 `<StepPlayer>`
- **Zero server**: All computation runs client-side
- **Tiny**: Core library ~25KB, generation < 5ms

## Install

```bash
npm install step-on lottie-web
```

## Quick Start

### Core (framework-agnostic)

```ts
import { generate } from "step-on/core";
import lottie from "lottie-web";

const { animation, steps } = generate({ a: 27, b: 35, op: "+" });

lottie.loadAnimation({
  container: document.getElementById("player")!,
  renderer: "svg",
  animationData: animation,
});

// steps[i].ttsText → "일의 자리: 7 + 5 = 12"
// steps[i].startFrame / endFrame → segment boundaries
```

### Vue 3

```vue
<script setup>
import { ref } from "vue";
import { StepPlayer, generate } from "step-on";

const result = ref(generate({ a: 27, b: 35, op: "+" }));
</script>

<template>
  <StepPlayer
    :animation="result.animation"
    :steps="result.steps"
    tts
    @step-change="(step, i) => console.log(step.ttsText)"
  />
</template>
```

## API

### `generate(problem, config?)`

```ts
generate({ a: 27, b: 35, op: "+" }); // addition with carry
generate({ a: 100, b: 37, op: "-" }); // subtraction with borrow
generate({ a: 12, b: 34, op: "×" }); // multiplication (partial products)
generate({ a: 144, b: 12, op: "÷" }); // long division
```

Returns `GenerateResult`:

```ts
interface GenerateResult {
  animation: LottieAnimation; // Lottie JSON (pass to lottie-web)
  steps: StepMeta[]; // Step boundaries for navigation/TTS
}

interface StepMeta {
  id: string; // "setup", "col-0", "confirm", etc.
  ttsText: string; // Korean narration text
  startFrame: number;
  endFrame: number;
  markerName: string; // matches animation.markers
}
```

### `<StepPlayer>` (Vue 3)

| Prop        | Type              | Default | Description                     |
| ----------- | ----------------- | ------- | ------------------------------- |
| `animation` | `LottieAnimation` | —       | Lottie JSON from `generate()`   |
| `steps`     | `StepMeta[]`      | `[]`    | Step metadata from `generate()` |
| `tts`       | `boolean`         | `true`  | Enable TTS narration            |
| `ttsLang`   | `string`          | `ko-KR` | Speech synthesis language       |
| `loop`      | `boolean`         | `false` | Loop animation                  |
| `autoplay`  | `boolean`         | `false` | Auto-play on mount              |

**Events**: `step-change(step: StepMeta, index: number)`

**Exposed methods**: `goToStep(i)`, `next()`, `prev()`, `playStep(i)`, `playAll()`

### Config

All frame/size values are customizable via the second argument to `generate()`:

```ts
generate(
  { a: 27, b: 35, op: "+" },
  {
    cellW: 48, // cell width in px
    rowH: 64, // row height in px
    padding: 32, // canvas padding
    fps: 30, // frame rate
    fontSize: 36, // digit font size
    placeFrames: 20, // digit appearance duration
    highlightFrames: 30, // column highlight duration
    resultFrames: 24, // result reveal duration
    carryFrames: 36, // carry/borrow animation duration
  },
);
```

## Architecture

```
Problem { a, b, op }
    ↓
Compiler (per operation)  →  Step[] (DSL: educational sequence)
    ↓
Renderer                  →  { animation, steps }
    ↓
Player (lottie-web)       →  step navigation + TTS
```

The compiler emits an intermediate DSL of atomic actions (highlight, cloneDigit, splitBase10, moveChip, etc.), which the renderer converts to Lottie keyframes. This separation makes it easy to add new operations or modify animation behavior.

## Demo

Visit the live demo: [step-on.vercel.app](https://step-on.vercel.app)

## Development

```bash
npm install
npm run dev        # dev server with demo
npm test           # 74 tests (vitest)
npm run build      # build demo app
npm run build:lib  # build npm library
```

## License

[Apache-2.0](LICENSE)

---

## 한국어

초등 수학 세로셈(필산) 애니메이션을 Lottie로 생성하는 라이브러리입니다. 단계별 재생, TTS 음성 안내, 올림/빌림/장제법 애니메이션을 지원합니다.

### 주요 기능

- **사칙연산**: 덧셈(올림), 뺄셈(빌림), 곱셈(부분곱), 나눗셈(장제법)
- **단계별 재생**: 각 단계마다 TTS 음성 안내 + 네비게이션 컨트롤
- **교육적 애니메이션**: 올림 칩 이동, 빌림 체인, 숫자 분리/결합 모션
- **사전 컴파일**: 생성 시 단일 Lottie JSON + StepMeta[] 출력 — 재생 중 연산 없음
- **프레임워크 무관**: `step-on/core` 단독 또는 Vue 3 `<StepPlayer>` 컴포넌트 사용 가능
- **100% 클라이언트**: 서버 전송 없음, 브라우저에서 모든 계산 수행

### 사용법

```ts
import { generate } from "step-on/core";

const { animation, steps } = generate({ a: 27, b: 35, op: "+" });
// animation → lottie-web에 전달
// steps[0].ttsText → "27 + 35를 계산합니다"
// steps[1].ttsText → "일의 자리: 7 + 5 = 12"
```
