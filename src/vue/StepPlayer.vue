<template>
  <div class="step-player">
    <div ref="container" :style="{ width: width + 'px', height: height + 'px' }" />
    <div v-if="steps.length > 0" class="step-nav">
      <button :disabled="currentStep <= 0" @click="prev">&larr;</button>
      <span class="step-label">{{ currentStep + 1 }} / {{ steps.length }}</span>
      <button :disabled="currentStep >= steps.length - 1" @click="next">&rarr;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import lottie from 'lottie-web';
import type { AnimationItem } from 'lottie-web';
import type { LottieAnimation } from '../core/types';
import type { StepMeta } from '../core/dsl/step';

const props = withDefaults(defineProps<{
  animation: LottieAnimation;
  steps?: StepMeta[];
  loop?: boolean;
  autoplay?: boolean;
  tts?: boolean;
  ttsLang?: string;
}>(), {
  steps: () => [],
  loop: false,
  autoplay: false,
  tts: true,
  ttsLang: 'ko-KR',
});

const emit = defineEmits<{
  (e: 'step-change', step: StepMeta, index: number): void;
}>();

const container = ref<HTMLDivElement>();
const width = ref(props.animation.w);
const height = ref(props.animation.h);
const currentStep = ref(0);
let anim: AnimationItem | null = null;

function load() {
  if (!container.value) return;
  destroy();
  width.value = props.animation.w;
  height.value = props.animation.h;
  currentStep.value = 0;
  anim = lottie.loadAnimation({
    container: container.value,
    renderer: 'svg',
    loop: props.loop,
    autoplay: props.autoplay,
    animationData: JSON.parse(JSON.stringify(props.animation)),
  });

  if (props.steps.length > 0) {
    goToStep(0);
  }
}

function destroy() {
  speechSynthesis.cancel();
  if (anim) {
    anim.destroy();
    anim = null;
  }
}

function speak(text: string) {
  if (!props.tts || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = props.ttsLang;
  utter.rate = 0.9;
  speechSynthesis.speak(utter);
}

function goToStep(index: number) {
  if (!anim || index < 0 || index >= props.steps.length) return;
  const step = props.steps[index]!;
  currentStep.value = index;
  anim.goToAndStop(step.endFrame - 1, true);
  speak(step.ttsText);
  emit('step-change', step, index);
}

function next() {
  playStep(currentStep.value + 1);
}

function prev() {
  goToStep(currentStep.value - 1);
}

function playAll() {
  if (!anim || props.steps.length === 0) return;
  currentStep.value = 0;
  anim.goToAndPlay(0, true);
  const step = props.steps[0]!;
  speak(step.ttsText);
  emit('step-change', step, 0);
}

function playStep(index: number) {
  if (!anim || index < 0 || index >= props.steps.length) return;
  const step = props.steps[index]!;
  currentStep.value = index;
  anim.goToAndStop(step.startFrame, true);
  anim.playSegments([step.startFrame, step.endFrame], true);
  speak(step.ttsText);
  emit('step-change', step, index);
}

defineExpose({ goToStep, next, prev, playStep, playAll });

onMounted(load);
onUnmounted(destroy);
watch(() => props.animation, load);
</script>

<style scoped>
.step-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.step-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-nav button {
  padding: 6px 14px;
  background: #e8e8ed;
  color: #1d1d1f;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.step-nav button:hover:not(:disabled) {
  background: #d2d2d7;
}

.step-nav button:disabled {
  opacity: 0.3;
  cursor: default;
}

.step-label {
  font-size: 0.9rem;
  color: #6e6e73;
  min-width: 60px;
  text-align: center;
}
</style>
