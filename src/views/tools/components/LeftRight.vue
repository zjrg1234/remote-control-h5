<template>
  <!-- 注意：这里不再绑定 Vue 的响应式 style，而是直接操作 DOM -->
  <div
    class="control-box"
    ref="boxRef"
  >
    <div
      class="arrow left"
      :style="{ backgroundImage: `url(${leftImage})` }"
      :class="{ active: isLeftActive }"
    ></div>

    <div
      class="dot"
      ref="dotRef"
      :class="{ ready: isReadyMode }"
      :style="{
        backgroundImage: `url(${dotImage})`,
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease, box-shadow 0.3s ease',
      }"
      @mousedown.prevent="handleStart"
      @touchstart.prevent="handleStart"
    ></div>

    <div
      class="arrow right"
      :style="{ backgroundImage: `url(${rightImage})` }"
      :class="{ active: isRightActive }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

import leftImg from "@/assets/images/arrow_left_big@2x.png";
import rightImg from "@/assets/images/arrow_right_big@2x.png";
import dotImg from "@/assets/images/dot@2x.webp";

const leftImage = ref(leftImg);
const rightImage = ref(rightImg);
const dotImage = ref(dotImg);

// --- 配置参数 ---
const IDLE_DELAY = 500;       
const SWIPE_THRESHOLD = 20;   
const MAX_DOT_DRAG = 40;      
const BOX_WIDTH = 90;         
const BOX_HEIGHT = 50;        

// --- DOM 引用 ---
const boxRef = ref(null);
const dotRef = ref(null);

// --- 响应式状态 (仅用于触发 CSS 类名等低频 UI 变化) ---
const isDragging = ref(false);
const isReadyMode = ref(false);
const isLeftActive = ref(false);
const isRightActive = ref(false);

// --- 内部非响应式状态 (彻底避免 Vue 响应式开销) ---
let idleTimer = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dotStartOffset = 0; 

// 纯物理状态 (非响应式)
let currentBoxX = 0;
let currentBoxY = 0;
let currentDotX = 0;

// RAF 调度控制
let animationFrameId = null;
let pendingMoveEvent = null; // 缓存最新的移动事件

// --- 核心方法 ---
const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  if (!isReadyMode.value) {
    idleTimer = setTimeout(enterReadyMode, IDLE_DELAY);
  }
};

const enterReadyMode = () => {
  isReadyMode.value = true;
  if (navigator.vibrate) navigator.vibrate(50);
};

const updateArrows = (deltaX) => {
  isLeftActive.value = deltaX < -SWIPE_THRESHOLD;
  isRightActive.value = deltaX > SWIPE_THRESHOLD;
};

const resetArrows = () => {
  isLeftActive.value = false;
  isRightActive.value = false;
};

// 【性能核心】：在 RAF 中统一处理 DOM 更新
const processMove = () => {
  if (!pendingMoveEvent || !isDragging.value) {
    // 如果没有待处理的事件，继续等待下一帧
    animationFrameId = requestAnimationFrame(processMove);
    return;
  }

  const e = pendingMoveEvent;
  pendingMoveEvent = null; // 消费掉事件

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  resetIdleTimer();

  if (!isReadyMode.value) {
    // 【模式 A：自由拖动容器】
    let newX = clientX - dragOffsetX;
    let newY = clientY - dragOffsetY;

    // 边界限制
    const maxX = window.innerWidth - BOX_WIDTH;
    const maxY = window.innerHeight - BOX_HEIGHT;

    currentBoxX = Math.max(0, Math.min(maxX, newX));
    currentBoxY = Math.max(0, Math.min(maxY, newY));
    
    // 直接操作 DOM，绕过 Vue 的 Virtual DOM 和响应式系统
    boxRef.value.style.transform = `translate3d(${currentBoxX}px, ${currentBoxY}px, 0)`;
  } else {
    // 【模式 B：待命模式 - 圆点左右弹性滑动】
    let deltaX = clientX - (currentBoxX + BOX_WIDTH / 2) - dotStartOffset;
    const absDelta = Math.abs(deltaX);

    if (absDelta > MAX_DOT_DRAG) {
      const excess = absDelta - MAX_DOT_DRAG;
      const sign = deltaX > 0 ? 1 : -1;
      deltaX = sign * (MAX_DOT_DRAG + excess * 0.2);
    }

    currentDotX = deltaX;
    // 直接操作 DOM
    dotRef.value.style.transform = `translateX(${currentDotX}px) scale(1)`;
    updateArrows(deltaX);
  }

  // 循环调度下一帧
  animationFrameId = requestAnimationFrame(processMove);
};

// --- 事件处理 ---
const handleStart = (e) => {
  isDragging.value = true;
  isReadyMode.value = false;
  clearTimeout(idleTimer);
  resetArrows();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  // 锁定偏移量
  dragOffsetX = clientX - currentBoxX;
  dragOffsetY = clientY - currentBoxY;

  const dotScreenCenterX = currentBoxX + BOX_WIDTH / 2 + currentDotX;
  dotStartOffset = clientX - dotScreenCenterX;

  resetIdleTimer();

  // 绑定全局事件
  window.addEventListener("mousemove", handleMove);
  window.addEventListener("touchmove", handleMove, { passive: false });
  window.addEventListener("mouseup", handleEnd);
  window.addEventListener("touchend", handleEnd);
  
  // 启动 RAF 渲染循环
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(processMove);
  }
};

const handleMove = (e) => {
  if (!isDragging.value) return;
  if (e.cancelable) e.preventDefault();

  // 【节流核心】：只缓存最新的事件，不执行任何逻辑
  pendingMoveEvent = e;
};

const handleEnd = () => {
  if (!isDragging.value) return;

  isDragging.value = false;
  isReadyMode.value = false;
  clearTimeout(idleTimer);

  // 停止 RAF 循环
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  pendingMoveEvent = null;

  // 触发 CSS 过渡回弹
  dotRef.value.style.transform = `translateX(0px) scale(1)`;
  currentDotX = 0;
  dotStartOffset = 0; 
  resetArrows();

  window.removeEventListener("mousemove", handleMove);
  window.removeEventListener("touchmove", handleMove);
  window.removeEventListener("mouseup", handleEnd);
  window.removeEventListener("touchend", handleEnd);
};

// --- 生命周期 ---
onMounted(() => {
  currentBoxX = window.innerWidth / 2 - BOX_WIDTH / 2;
  currentBoxY = window.innerHeight / 2 - BOX_HEIGHT / 2;
  
  // 初始化 DOM 位置
  boxRef.value.style.transform = `translate3d(${currentBoxX}px, ${currentBoxY}px, 0)`;
});

onBeforeUnmount(() => {
  clearTimeout(idleTimer);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener("mousemove", handleMove);
  window.removeEventListener("touchmove", handleMove);
  window.removeEventListener("mouseup", handleEnd);
  window.removeEventListener("touchend", handleEnd);
});
</script>

<style scoped>
.control-box {
  position: fixed;
  top: 0;
  left: 0;
  width: 90px;
  height: 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  z-index: 100;
  will-change: transform;
  user-select: none;
  touch-action: none;
}

.arrow {
  width: 28px;
  height: 28px;
  opacity: 0.8;
  transition: all 0.2s ease;
  z-index: 1;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
}

.arrow.active {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 167, 38, 0.8));
  transform: scale(1.15);
}

.dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
  cursor: grab;
  position: relative;
  z-index: 2;
  will-change: transform;
}

.dot:active {
  cursor: grabbing;
}

.dot.ready {
  box-shadow: 0 0 7.5px rgba(255, 167, 38, 0.6);
}
</style>