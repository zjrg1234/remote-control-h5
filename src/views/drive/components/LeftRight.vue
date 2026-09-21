<template>
  <div
    ref="wrapperRef"
    class="control-wrapper"
    :class="{ 'is-left': isLeft }"
    @pointerdown="handleStart"
    @pointermove="handleMove"
    @pointerup="handleEnd"
    @pointercancel="handleEnd"
  >
    <div class="control-box">
      <div class="cont">
        <div class="track-bg" />

        <img
          class="arrow left"
          src="@/assets/images/d_left@2x.png"
          :class="{ active: isLeftActive }"
        />
        <img
          class="arrow right"
          src="@/assets/images/d_right@2x.png"
          :class="{ active: isRightActive }"
        />

        <div class="dot" :class="{ ready: isReadyMode }" :style="dotStyle">
          <img src="@/assets/images/d_dot@2x.png" alt="" draggable="false" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';

const emit = defineEmits(['action', 'action2']);

const props = defineProps({
  mode: { type: Boolean, default: true },
  isLeft: { type: Boolean, default: false },
});

// --- 配置 ---
const IDLE_DELAY = 100;
const MAX_RADIUS = 65;
const SWIPE_THRESHOLD = 10;
const EMIT_INTERVAL = 100;

// --- 状态 ---
const isDragging = ref(false);
const isReadyMode = ref(false);
const isLeftActive = ref(false);
const isRightActive = ref(false);
const currentDotX = ref(0);
const currentDotY = ref(0);
const wrapperRef = ref(null);

let idleTimer = null;
let emitInterval = null;
let readyBaseX = 0;
let readyBaseY = 0;

// ✅ 修复1: 用 computed 替代 reactive + delete，避免响应性丢失
const wrapperStyle = computed(() =>
  props.isLeft
    ? { left: '90px', bottom: '50px' }
    : { right: '120px', bottom: '50px' }
);

// ✅ 修复2: 两段 translate 分离，确保居中与偏移互不干扰
const dotStyle = computed(() => ({
  transform: `translate(-50%, -50%) translate(${currentDotX.value}px, ${currentDotY.value}px)`,
  transition: isDragging.value
    ? 'none'
    : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
}));

// --- 工具方法 ---
const clearTimers = () => {
  clearTimeout(idleTimer);
  clearInterval(emitInterval);
  idleTimer = null;
  emitInterval = null;
};

const enterReadyMode = () => {
  isReadyMode.value = true;
  try { navigator.vibrate?.(10); } catch {}
};

const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  if (!isReadyMode.value) {
    idleTimer = setTimeout(enterReadyMode, IDLE_DELAY);
  }
};

const updateArrows = (dx, dy) => {
  const distance = Math.sqrt(dx * dx + dy * dy);
  const ratioValue = Math.min(distance / MAX_RADIUS, 1);

  isLeftActive.value = dx < -SWIPE_THRESHOLD;
  isRightActive.value = dx > SWIPE_THRESHOLD;

  clearInterval(emitInterval);
  emitInterval = null;

  const hasActive = isLeftActive.value || isRightActive.value;

  if (hasActive && isDragging.value) {
    emit('action', { lr: dx < 0, value: dx, ratioValue });
    emitInterval = setInterval(() => {
      if (!isDragging.value || !hasActive) {
        clearInterval(emitInterval);
        emitInterval = null;
        return;
      }
      emit('action', {
        lr: currentDotX.value < 0,
        value: Math.round(currentDotX.value * 100) / 100,
        ratioValue,
      });
    }, EMIT_INTERVAL);
  } else {
    emit('action', { lr: false, value: 0, ratioValue: 0 });
  }
};

const resetArrows = () => {
  isLeftActive.value = false;
  isRightActive.value = false;
  clearTimers();
  emit('action', { lr: false, value: 0, ratioValue: 0 });
};

// ✅ 修复3: 核心修复 —— 使用 setPointerCapture 锁定指针
const handleStart = (e) => {
  // 锁定当前指针到本元素，即使滑出边界也能持续接收事件
  wrapperRef.value?.setPointerCapture(e.pointerId);

  isDragging.value = true;
  isReadyMode.value = false;
  clearTimers();
  resetArrows();

  readyBaseX = e.clientX;
  readyBaseY = e.clientY;
  resetIdleTimer();
};

const handleMove = (e) => {
  if (!isDragging.value) return;

  // PointerEvent 自带 clientX/Y，无需兼容 touches
  const dx = e.clientX - readyBaseX;
  const dy = e.clientY - readyBaseY;

  resetIdleTimer();

  let clampedDx = dx;
  let clampedDy = dy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > MAX_RADIUS) {
    const angle = Math.atan2(dy, dx);
    clampedDx = Math.cos(angle) * MAX_RADIUS;
    clampedDy = Math.sin(angle) * MAX_RADIUS;
  }

  currentDotX.value = clampedDx;
  currentDotY.value = clampedDy;
  updateArrows(clampedDx, clampedDy);
};

const handleEnd = (e) => {
  if (!isDragging.value) return;

  // 释放指针捕获
  try { wrapperRef.value?.releasePointerCapture(e.pointerId); } catch {}

  currentDotX.value = 0;
  currentDotY.value = 0;
  isDragging.value = false;
  isReadyMode.value = false;
  clearTimers();
  resetArrows();
};

onBeforeUnmount(clearTimers);
</script>

<style lang="scss" scoped>
.control-wrapper {
  position: fixed;
  /* ✅ 修复4: 位置由 class 控制，不再依赖 inline style 的 right/left */
  right: 120px;
  bottom: 50px;
  width: 215px;
  height: 175px;
  z-index: 99;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;

  &.is-left {
    right: auto;
    left: 90px;
  }
}

.control-box {
  position: absolute;
  inset: 0;
  touch-action: none;
  user-select: none;
}

.cont {
  position: relative;
  width: 235px;
  height: 176px;

  .track-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 128px;
    height: 128px;
    border-radius: 50%;
    pointer-events: none;
  }

  .arrow {
    position: absolute;
    width: 50px;
    height: 50px;
    opacity: 0.7;
    transition: opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease;
    z-index: 1;
    pointer-events: none;
    user-select: none;

    &.active {
      opacity: 1;
      filter: drop-shadow(0 0 4px rgba(255, 167, 38, 0.8));
    }
  }

  .arrow.left {
    top: 50%;
    left: 25px;
    transform: translateY(-50%);
    &.active { transform: translateY(-50%) scale(1.15); }
  }

  .arrow.right {
    top: 50%;
    right: 25px;
    transform: translateY(-50%);
    &.active { transform: translateY(-50%) scale(1.15); }
  }

  .dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    z-index: 2;
    border: 2px solid rgba(255, 255, 255, 0.3);
    pointer-events: none; /* ✅ 修复5: 防止圆点自身拦截事件 */

    &.ready {
      box-shadow: 0 0 12px rgba(255, 167, 38, 0.8);
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
      user-drag: none;
      -webkit-user-drag: none;
      user-select: none;
    }
  }
}
</style>