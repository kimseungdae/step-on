<template>
  <div ref="container" :style="{ width: width + 'px', height: height + 'px' }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import lottie from 'lottie-web';
import type { AnimationItem } from 'lottie-web';
import type { LottieAnimation } from '../core/types';

const props = withDefaults(defineProps<{
  animation: LottieAnimation;
  loop?: boolean;
  autoplay?: boolean;
}>(), {
  loop: true,
  autoplay: true,
});

const container = ref<HTMLDivElement>();
const width = ref(props.animation.w);
const height = ref(props.animation.h);
let anim: AnimationItem | null = null;

function load() {
  if (!container.value) return;
  destroy();
  width.value = props.animation.w;
  height.value = props.animation.h;
  anim = lottie.loadAnimation({
    container: container.value,
    renderer: 'svg',
    loop: props.loop,
    autoplay: props.autoplay,
    animationData: props.animation,
  });
}

function destroy() {
  if (anim) {
    anim.destroy();
    anim = null;
  }
}

onMounted(load);
onUnmounted(destroy);
watch(() => props.animation, load);
</script>
