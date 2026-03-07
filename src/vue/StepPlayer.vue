<template>
  <div class="step-player">
    <canvas ref="canvasRef" />
    <div class="controls">
      <div class="playback">
        <button class="btn" @click="togglePlay">
          {{ playing ? '⏸' : '▶' }}
        </button>
        <button class="btn" :disabled="stepIndex <= 0" @click="prevStep">←</button>
        <span class="step-label">{{ stepLabel }}</span>
        <button class="btn" :disabled="stepIndex >= stepCount - 1" @click="nextStep">→</button>
      </div>
      <input
        type="range"
        class="progress"
        min="0"
        max="1000"
        :value="progressValue"
        @input="onSeek"
      />
      <div class="speed-row">
        <button
          v-for="s in speeds"
          :key="s"
          class="btn btn-sm"
          :class="{ active: currentSpeed === s }"
          @click="setSpeed(s)"
        >
          {{ s }}x
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { Step } from '../core/dsl/step';
import type { Config } from '../core/types';
import { DEFAULT_CONFIG } from '../core/types';
import type { Layout } from '../core/layout/index';
import { Stage } from '../stage/Stage';
import { buildTimeline } from '../bridge/StepBuilder';
import { PlayerEngine } from '../player/PlayerEngine';

const props = withDefaults(defineProps<{
  steps: Step[];
  layout: Layout;
  config?: Config;
  autoplay?: boolean;
  tts?: boolean;
  ttsLang?: string;
}>(), {
  config: () => DEFAULT_CONFIG,
  autoplay: false,
  tts: true,
  ttsLang: 'ko-KR',
});

const emit = defineEmits<{
  (e: 'step-change', id: string, index: number): void;
  (e: 'complete'): void;
}>();

const canvasRef = ref<HTMLCanvasElement>();
const playing = ref(false);
const stepIndex = ref(-1);
const progressValue = ref(0);
const currentSpeed = ref(1);
const speeds = [0.5, 1, 1.5, 2];

let engine: PlayerEngine | null = null;
let lastStepIndex = -1;

const stepCount = computed(() => props.steps.length);
const stepLabel = computed(() => {
  if (stepCount.value === 0) return '';
  const idx = stepIndex.value >= 0 ? stepIndex.value + 1 : 0;
  return `${idx} / ${stepCount.value}`;
});

function init() {
  destroy();
  if (!canvasRef.value) return;

  const stage = new Stage({
    canvas: canvasRef.value,
    width: props.layout.canvasWidth,
    height: props.layout.canvasHeight,
  });

  const { timeline } = buildTimeline(
    props.steps,
    stage,
    props.layout,
    props.config,
  );

  engine = new PlayerEngine({ timeline, stage });

  engine.on('update', () => {
    progressValue.value = Math.round(engine!.progress * 1000);

    const idx = engine!.currentStepIndex;
    if (idx !== lastStepIndex && idx >= 0) {
      lastStepIndex = idx;
      stepIndex.value = idx;
      const marker = engine!.currentStep;
      if (marker?.meta) {
        emit('step-change', marker.meta.id, idx);
        if (props.tts) speak(marker.meta.ttsText);
      }
    }
  });

  engine.on('complete', () => {
    playing.value = false;
    emit('complete');
  });

  // Initial render
  stage.render();

  if (props.autoplay) {
    togglePlay();
  }
}

function destroy() {
  speechSynthesis.cancel();
  if (engine) {
    engine.destroy();
    engine = null;
  }
  lastStepIndex = -1;
  stepIndex.value = -1;
  progressValue.value = 0;
}

function togglePlay() {
  if (!engine) return;
  if (playing.value) {
    engine.pause();
    playing.value = false;
  } else {
    engine.play();
    playing.value = true;
  }
}

function nextStep() {
  engine?.nextStep();
}

function prevStep() {
  engine?.prevStep();
}

function onSeek(e: Event) {
  if (!engine) return;
  const val = Number((e.target as HTMLInputElement).value);
  engine.seekProgress(val / 1000);
}

function setSpeed(s: number) {
  if (!engine) return;
  currentSpeed.value = s;
  engine.speed = s;
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
  if (!engine) return;
  const marker = engine.stepNav.getByIndex(index);
  if (marker) {
    engine.seek(marker.time);
    stepIndex.value = index;
  }
}

function playAll() {
  if (!engine) return;
  engine.seek(0);
  engine.play();
  playing.value = true;
}

defineExpose({ goToStep, nextStep, prevStep, playAll, togglePlay });

onMounted(init);
onUnmounted(destroy);
watch(() => props.steps, init);
</script>

<style scoped>
.step-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

canvas {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 400px;
}

.playback {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn {
  padding: 6px 14px;
  background: #e8e8ed;
  color: #1d1d1f;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover:not(:disabled) {
  background: #d2d2d7;
}

.btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.btn-sm {
  padding: 3px 8px;
  font-size: 0.8rem;
}

.btn-sm.active {
  background: #4285f4;
  color: #fff;
}

.step-label {
  font-size: 0.9rem;
  color: #6e6e73;
  min-width: 60px;
  text-align: center;
}

.progress {
  width: 100%;
  cursor: pointer;
}

.speed-row {
  display: flex;
  gap: 6px;
}
</style>
