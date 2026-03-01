# step-on

Animated step-by-step column arithmetic for education. Generates [Lottie](https://airbnb.io/lottie/) animations for addition, subtraction, multiplication, and division — entirely in the browser.

[한국어](#한국어)

## Features

- **Four operations**: Addition (carry), Subtraction (borrow), Multiplication (partial products), Division (long division)
- **Pure Lottie output**: Shape-based digit glyphs — no font dependency, cross-platform consistent
- **Dynamic layout**: Formula-based coordinate calculation works for any digit count (1–3+)
- **Tiny & fast**: Core library ~22KB, generation < 1ms
- **Framework-agnostic**: Use `step-on/core` standalone or `step-on` with Vue 3 component
- **Zero server**: All computation runs client-side

## Install

```bash
npm install step-on lottie-web
```

## Quick Start

### Core (framework-agnostic)

```ts
import { generateAddition } from "step-on/core";
import lottie from "lottie-web";

const animation = generateAddition(27, 35);

lottie.loadAnimation({
  container: document.getElementById("player")!,
  renderer: "svg",
  animationData: animation,
});
```

### Vue 3

```vue
<script setup>
import { ref } from "vue";
import { StepPlayer, generateAddition } from "step-on";

const anim = ref(generateAddition(27, 35));
</script>

<template>
  <StepPlayer :animation="anim" />
</template>
```

## API

### Generators

| Function                                | Description                                 |
| --------------------------------------- | ------------------------------------------- |
| `generateAddition(a, b, config?)`       | Column addition with carry animation        |
| `generateSubtraction(a, b, config?)`    | Column subtraction with borrow animation    |
| `generateMultiplication(a, b, config?)` | Column multiplication with partial products |
| `generateDivision(a, b, config?)`       | Long division with step-by-step descent     |

All generators return a `LottieAnimation` object that can be passed directly to `lottie-web`.

### Config

```ts
interface Config {
  cellW: number; // cell width (default: 48)
  rowH: number; // row height (default: 64)
  padding: number; // canvas padding (default: 32)
  fps: number; // frame rate (default: 30)
  placeFrames: number; // frames for placing digits (default: 4)
  highlightFrames: number; // highlight duration (default: 8)
  resultFrames: number; // result digit appearance (default: 6)
  carryFrames: number; // carry/borrow animation (default: 10)
  lineFrames: number; // separator line (default: 4)
}
```

## Demo

Visit the live demo: [step-on.vercel.app](https://step-on.vercel.app)

## Development

```bash
npm install
npm run dev      # dev server
npm test         # run tests (43 tests)
npm run build    # build demo
npm run build:lib # build library
```

## License

[Apache-2.0](LICENSE)

---

## 한국어

초등 수학 세로셈 애니메이션을 Lottie로 생성하는 라이브러리입니다.

### 주요 기능

- **사칙연산**: 덧셈(올림), 뺄셈(내림), 곱셈(부분곱), 나눗셈(긴 나눗셈)
- **순수 Lottie 출력**: 스트로크 기반 숫자 — 폰트 의존성 없음
- **동적 레이아웃**: 수식 기반 좌표 계산으로 모든 자릿수 지원
- **경량 & 빠름**: 코어 ~22KB, 생성 < 1ms
- **프레임워크 무관**: `step-on/core` 단독 또는 Vue 3 컴포넌트 사용 가능
- **100% 클라이언트**: 서버 전송 없음, 브라우저에서 모든 계산 수행
