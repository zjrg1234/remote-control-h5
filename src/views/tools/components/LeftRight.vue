<template>
  <div
    class="control-box"
    ref="boxRef"
    :style="{ transform: `translate3d(${boxX}px, ${boxY}px, 0)` }"
  >
    <!-- 左箭头 -->
    <div
      class="arrow left"
      :style="{ backgroundImage: `url(${leftImage})` }"
      :class="{ active: isLeftActive }"
    ></div>

    <!-- 中心圆点 -->
    <div
      class="dot"
      ref="dotRef"
      :class="{ ready: isReadyMode }"
      :style="{
        backgroundImage: `url(${dotImage})`,
        transform: `translateX(${dotOffsetX}px) scale(${isReadyMode ? 1.15 : 1})`,
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease, box-shadow 0.3s ease',
      }"
      @mousedown.prevent="handleStart"
      @touchstart.prevent="handleStart"
    ></div>

    <!-- 右箭头 -->
    <div
      class="arrow right"
      :style="{ backgroundImage: `url(${rightImage})` }"
      :class="{ active: isRightActive }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

// 【请替换为你实际的图片路径】
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

// --- 响应式状态 ---
const boxX = ref(0);
const boxY = ref(0);
const dotOffsetX = ref(0);       
const isDragging = ref(false);
const isReadyMode = ref(false);
const isLeftActive = ref(false);
const isRightActive = ref(false);

// --- 内部状态 (非响应式) ---
let idleTimer = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// 【修复核心】：记录按下瞬间，手指相对于【圆点当前实际位置】的偏移量
let dotStartOffset = 0; 

// --- 核心方法 ---
const updateBoxPosition = (x, y) => {
  boxX.value = x;
  boxY.value = y;
};

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

// --- 事件处理 ---
const handleStart = (e) => {
  console.log(123)
  isDragging.value = true;
  isReadyMode.value = false;
  clearTimeout(idleTimer);
  resetArrows();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  // 1. 计算并锁定容器拖动的偏移量
  dragOffsetX = clientX - boxX.value;
  dragOffsetY = clientY - boxY.value;

  // 【修复点 1】：计算并锁定圆点拖动的初始偏移量
  // 圆点在屏幕上的绝对中心位置 = 盒子左边距 + 盒子宽度的一半 + 当前的相对偏移量
  const dotScreenCenterX = boxX.value + BOX_WIDTH / 2 + dotOffsetX.value;
  // 手指按下位置 与 圆点实际中心位置 的差值
  dotStartOffset = clientX - dotScreenCenterX;

  // 立即应用一次容器位置，消除首帧延迟
  updateBoxPosition(clientX - dragOffsetX, clientY - dragOffsetY);
  resetIdleTimer();

  window.addEventListener("mousemove", handleMove);
  window.addEventListener("touchmove", handleMove, { passive: false });
  window.addEventListener("mouseup", handleEnd);
  window.addEventListener("touchend", handleEnd);
};

const handleMove = (e) => {
  if (!isDragging.value) return;
  if (e.cancelable) e.preventDefault();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  resetIdleTimer();

  if (!isReadyMode.value) {
    // 【模式 A：自由拖动容器】
    let newX = clientX - dragOffsetX;
    let newY = clientY - dragOffsetY;

    const minX = 0;
    const maxX = window.innerWidth - BOX_WIDTH;
    const minY = 0;
    const maxY = window.innerHeight - BOX_HEIGHT;

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));

    updateBoxPosition(newX, newY);
  } else {
    // 【模式 B：待命模式 - 圆点左右弹性滑动】
    // 【修复点 2】：直接用当前手指位置 减去 盒子中心 减去 按下时的相对偏移
    // 这个公式能保证圆点像被胶水粘在手指上一样，绝对不闪跳
    let deltaX = clientX - (boxX.value + BOX_WIDTH / 2) - dotStartOffset;

    const absDelta = Math.abs(deltaX);

    // 橡皮筋阻尼效果
    if (absDelta > MAX_DOT_DRAG) {
      const excess = absDelta - MAX_DOT_DRAG;
      const sign = deltaX > 0 ? 1 : -1;
      deltaX = sign * (MAX_DOT_DRAG + excess * 0.2);
    }

    dotOffsetX.value = deltaX;
    updateArrows(deltaX);
  }
};

const handleEnd = () => {
  if (!isDragging.value) return;

  isDragging.value = false;
  isReadyMode.value = false;
  clearTimeout(idleTimer);

  // 松手时平滑回弹到中心
  dotOffsetX.value = 0;
  dotStartOffset = 0; 
  resetArrows();

  window.removeEventListener("mousemove", handleMove);
  window.removeEventListener("touchmove", handleMove);
  window.removeEventListener("mouseup", handleEnd);
  window.removeEventListener("touchend", handleEnd);
};

// --- 生命周期 ---
onMounted(() => {
  boxX.value = window.innerWidth / 2 - BOX_WIDTH / 2;
  boxY.value = window.innerHeight / 2 - BOX_HEIGHT / 2;
});

onBeforeUnmount(() => {
  clearTimeout(idleTimer);
  window.removeEventListener("mousemove", handleMove);
  window.removeEventListener("touchmove", handleMove);
  window.removeEventListener("mouseup", handleEnd);
  window.removeEventListener("touchend", handleEnd);
});
</script>
<!-- 模板和样式保持你上一版的代码不变 -->

<style scoped>
.control-box {
  position: fixed;
  top: 0;
  left: 0;
  width: 90px;
  height: 50px;
  display: flex;
  flex-direction: row; /* 左右布局 */
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