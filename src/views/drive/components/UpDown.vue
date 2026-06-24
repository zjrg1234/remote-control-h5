<template>
  <!-- 注意：这里不再绑定 Vue 的响应式 style，而是直接操作 DOM -->
  <div class="control-box" ref="boxRef">
    <div
      class="arrow up"
      :style="{ backgroundImage: `url(${upImage})` }"
      :class="{ active: isUpActive }"
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
      class="arrow down"
      :style="{ backgroundImage: `url(${downImage})` }"
      :class="{ active: isDownActive }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

import upImg from "@/assets/images/arrow_up_big@2x.png";
import downImg from "@/assets/images/arrow_down_big@2x.png";
import dotImg from "@/assets/images/dot@2x.webp";

const upImage = ref(upImg);
const downImage = ref(downImg);
const dotImage = ref(dotImg);

const emit = defineEmits(["action"]);
const props = defineProps({
  isLeft: { type: Boolean, default: true },
});
// --- 配置参数 ---
const IDLE_DELAY = 500;
const SWIPE_THRESHOLD = 20;
const MAX_DOT_DRAG = 40;

// --- DOM 引用 ---
const boxRef = ref(null);
const dotRef = ref(null);

// --- 响应式状态 (仅用于触发 CSS 类名等低频 UI 变化) ---
const isDragging = ref(false);
const isReadyMode = ref(false);
const isUpActive = ref(false);
const isDownActive = ref(false);

// --- 内部非响应式状态 (彻底避免 Vue 响应式开销) ---
let idleTimer = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastPointerY = 0;
let readyStartPointerY = 0;

// 纯物理状态 (非响应式)
let currentBoxX = 0;
let currentBoxY = 0;
let currentDotY = 0;

// 👇 新增：记录拖拽开始时的初始绝对坐标（作为移动锚点）
let dragBaseX = 0;
let dragBaseY = 0;

// RAF 调度控制
let animationFrameId = null;
let pendingMoveEvent = null; // 缓存最新的移动事件

const backRightInit = () => {
  currentBoxX = window.innerWidth - 260;
  currentBoxY =  window.innerHeight / 4 - 150;
  if (boxRef.value) {
    boxRef.value.style.transform = `translate3d(${currentBoxX}px, ${currentBoxY}px, 0)`;
  }
};

const backLeftInit = () => {
  currentBoxX = 50;
  currentBoxY = -50;
  if (boxRef.value) {
    boxRef.value.style.transform = `translate3d(${currentBoxX}px, ${currentBoxY}px, 0)`;
  }
  // 初始化 DOM 位置
};
watch(
  () => props.isLeft,
  (val) => {
    if (val) {
      console.log("left")
      backLeftInit();
    } else {
      backRightInit();
      console.log("right")
    }
  },
  { immediate: true, deep: true },
);

// --- 核心方法 ---
const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  if (!isReadyMode.value) {
    idleTimer = setTimeout(enterReadyMode, IDLE_DELAY);
  }
};

const enterReadyMode = () => {
  isReadyMode.value = true;
  readyStartPointerY = lastPointerY;
  if (navigator.vibrate) navigator.vibrate(50);
};

const updateArrows = (deltaY) => {
  isUpActive.value = deltaY < -SWIPE_THRESHOLD;
  isDownActive.value = deltaY > SWIPE_THRESHOLD;

  emit("action", {
    fb: deltaY < 0 ? true : false,
    value: deltaY,
  });
};

const resetArrows = () => {
  isUpActive.value = false;
  isDownActive.value = false;
  emit("action", {
    fb: false,
    value: 0,
  });
 if (props.isLeft) {
    backLeftInit();
  } else {
    backRightInit();
  }

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

  lastPointerY = clientY;
  resetIdleTimer();

  if (!isReadyMode.value) {
    // 【模式 A：自由拖动容器】
    
    // 1. 计算当前鼠标相对于【拖拽起始锚点】的偏移量
    let deltaX = clientX - dragOffsetX - dragBaseX;
    let deltaY = clientY - dragOffsetY - dragBaseY;

    // 2. 【核心限制逻辑】
    // X轴：允许向右移动 100px（最大 100），不允许向左移动（最小为 0）
    // deltaX = Math.max(0, Math.min(100, deltaX));
    
    // Y轴：允许向上移动 100px（最小 -100），向下移动 50px（最大 50）
    // deltaY = Math.max(-100, Math.min(50, deltaY));
    // const LIMIT = 80;
  

    // deltaX = Math.max(-LIMIT, Math.min(LIMIT, deltaX));
    // deltaY = Math.max(-LIMIT, Math.min(LIMIT, deltaY));

    deltaX = Math.max(-50, Math.min(100, deltaX));
    
    // Y轴：向上最多 100px，向下最多 50px
    deltaY = Math.max(-100, Math.min(50, deltaY));

    // 3. 最终绝对坐标 = 拖拽起始锚点 + 限制后的偏移量
    currentBoxX = dragBaseX + deltaX;
    currentBoxY = dragBaseY + deltaY;

    // 直接操作 DOM，绕过 Vue 的 Virtual DOM 和响应式系统
    boxRef.value.style.transform = `translate3d(${currentBoxX}px, ${currentBoxY}px, 0)`;
    
  } else {
    // 【模式 B：待命模式 - 圆点上下弹性滑动】
    let deltaY = clientY - readyStartPointerY;
    const absDelta = Math.abs(deltaY);

    // 橡皮筋阻尼效果
    if (absDelta > MAX_DOT_DRAG) {
      const excess = absDelta - MAX_DOT_DRAG;
      const sign = deltaY > 0 ? 1 : -1;
      deltaY = sign * (MAX_DOT_DRAG + excess * 0.2);
    }

    currentDotY = deltaY;

    // 硬限制圆点的最大滑动距离
    if (deltaY < -65) deltaY = -65;
    if (deltaY > 65) deltaY = 65;

    // 直接操作 DOM
    dotRef.value.style.transform = `translateY(${currentDotY}px) scale(1)`;
    updateArrows(deltaY);
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

  // 👇 记录按下时的绝对位置作为本次拖拽的基准点
  dragBaseX = currentBoxX;
  dragBaseY = currentBoxY;

  // 锁定鼠标相对于盒子的偏移量
  dragOffsetX = clientX - currentBoxX;
  dragOffsetY = clientY - currentBoxY;

  lastPointerY = clientY;
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
  dotRef.value.style.transform = `translateY(0px) scale(1)`;
  currentDotY = 0;
  readyStartPointerY = 0;
  resetArrows();

  window.removeEventListener("mousemove", handleMove);
  window.removeEventListener("touchmove", handleMove);
  window.removeEventListener("mouseup", handleEnd);
  window.removeEventListener("touchend", handleEnd);
};

// --- 生命周期 ---
onMounted(() => {
  backLeftInit();
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
  left: 0;
  bottom: 0;
  width: 25px;
  height: 90px;
  display: flex;
  flex-direction: column;
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