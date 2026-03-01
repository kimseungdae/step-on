<template>
  <div class="demo">
    <div class="controls">
      <div class="input-group">
        <label>A</label>
        <input v-model.number="a" type="number" min="1" max="999" />
      </div>
      <div class="input-group">
        <label>Operator</label>
        <select v-model="op">
          <option value="+">+</option>
          <option value="-">−</option>
          <option value="×">×</option>
          <option value="÷">÷</option>
        </select>
      </div>
      <div class="input-group">
        <label>B</label>
        <input v-model.number="b" type="number" min="1" max="999" />
      </div>
      <button @click="generate">Generate</button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="animation" class="player-wrapper">
      <StepPlayer :animation="animation" :key="animKey" />
      <div class="info">
        <span>{{ a }} {{ op }} {{ b }} = {{ result }}</span>
        <span class="meta">{{ animation.layers.length }} layers · {{ animation.op }} frames</span>
      </div>
    </div>

    <div class="presets">
      <h3>Presets</h3>
      <div class="preset-grid">
        <button v-for="p in presets" :key="p.label" @click="applyPreset(p)">
          {{ p.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StepPlayer from '../vue/StepPlayer.vue';
import { generateAddition } from '../core/addition';
import { generateSubtraction } from '../core/subtraction';
import { generateMultiplication } from '../core/multiplication';
import { generateDivision } from '../core/division';
import type { LottieAnimation } from '../core/types';

const a = ref(27);
const b = ref(35);
const op = ref('+');
const animation = ref<LottieAnimation | null>(null);
const result = ref<number | string>('');
const error = ref('');
const animKey = ref(0);

const presets = [
  { label: '27 + 35', a: 27, b: 35, op: '+' },
  { label: '999 + 1', a: 999, b: 1, op: '+' },
  { label: '100 − 1', a: 100, b: 1, op: '-' },
  { label: '500 − 123', a: 500, b: 123, op: '-' },
  { label: '12 × 34', a: 12, b: 34, op: '×' },
  { label: '99 × 9', a: 99, b: 9, op: '×' },
  { label: '84 ÷ 4', a: 84, b: 4, op: '÷' },
  { label: '144 ÷ 12', a: 144, b: 12, op: '÷' },
];

function generate() {
  error.value = '';
  try {
    switch (op.value) {
      case '+':
        animation.value = generateAddition(a.value, b.value);
        result.value = a.value + b.value;
        break;
      case '-':
        if (a.value < b.value) { error.value = 'A must be >= B for subtraction'; return; }
        animation.value = generateSubtraction(a.value, b.value);
        result.value = a.value - b.value;
        break;
      case '×':
        animation.value = generateMultiplication(a.value, b.value);
        result.value = a.value * b.value;
        break;
      case '÷':
        if (b.value === 0) { error.value = 'Cannot divide by zero'; return; }
        animation.value = generateDivision(a.value, b.value);
        result.value = a.value % b.value === 0
          ? a.value / b.value
          : `${Math.floor(a.value / b.value)} r${a.value % b.value}`;
        break;
    }
    animKey.value++;
  } catch (e) {
    error.value = String(e);
  }
}

function applyPreset(p: { a: number; b: number; op: string }) {
  a.value = p.a;
  b.value = p.b;
  op.value = p.op;
  generate();
}

generate();
</script>

<style scoped>
.demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 0.85rem;
  color: #6e6e73;
}

.input-group input,
.input-group select {
  padding: 8px 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  font-size: 1rem;
  width: 100px;
}

.input-group select {
  width: 80px;
}

button {
  padding: 8px 20px;
  background: #0071e3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #0077ed;
}

.error {
  color: #ff3b30;
  font-size: 0.9rem;
}

.player-wrapper {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 1.1rem;
  font-weight: 600;
}

.info .meta {
  font-weight: 400;
  font-size: 0.85rem;
  color: #6e6e73;
}

.presets h3 {
  font-size: 1rem;
  margin-bottom: 8px;
}

.preset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-grid button {
  background: #e8e8ed;
  color: #1d1d1f;
  font-size: 0.85rem;
  padding: 6px 14px;
}

.preset-grid button:hover {
  background: #d2d2d7;
}
</style>
