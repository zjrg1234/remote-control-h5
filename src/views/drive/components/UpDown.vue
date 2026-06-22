<template>
  <div
    class="control-box"
    ref="boxRef"
    :style="{ transform: `translate3d(${boxX}px, ${boxY}px, 0)` }"
  >
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
        transform: `translateY(${dotOffsetY}px) scale(${isReadyMode ? 1 : 1})`,
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
import { ref, onMounted, onBeforeUnmount, defineEmits } from "vue";
import upImg from "@/assets/images/arrow_up_big@2x.png";
import downImg from "@/assets/images/arrow_down_big@2x.png";
import dotImg from "@/assets/images/dot@2x.webp";
const upImage = ref(upImg);
const downImage = ref(downImg);
const dotImage = ref(dotImg);

// --- 配置参数 ---
const IDLE_DELAY = 500; // 静止 2s 进入待命
const SWIPE_THRESHOLD = 20; // 触发箭头高亮的阈值 (px)
const MAX_DOT_DRAG = 40; // 待命模式下，圆点最大可拉动距离 (px)

// --- DOM 引用 ---
const boxRef = ref(null);
const dotRef = ref(null);

const emit = defineEmits(["action"]);

// --- 响应式状态 ---
const boxX = ref(0);
const boxY = ref(0);
const dotOffsetY = ref(0);
const isDragging = ref(true);
const isReadyMode = ref(false);
const isUpActive = ref(false);
const isDownActive = ref(false);

// --- 内部状态 (无需响应式，提升性能) ---
let idleTimer = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastPointerY = 0;
let readyStartPointerY = 0;

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
};

// --- 事件处理 ---
const handleStart = (e) => {
  isDragging.value = true;
  isReadyMode.value = false;
  clearTimeout(idleTimer);

  dotOffsetY.value = 0;
  resetArrows();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  // 计算并锁定偏移量
  dragOffsetX = clientX - boxX.value;
  dragOffsetY = clientY - boxY.value;

  // 立即应用一次位置，消除渲染延迟
  updateBoxPosition(clientX - dragOffsetX, clientY - dragOffsetY);

  lastPointerY = clientY;
  resetIdleTimer();

  // 绑定移动和结束事件到 window
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

  lastPointerY = clientY;
  resetIdleTimer();

  if (!isReadyMode.value) {
    // 模式 A：自由拖动
    let newX = clientX - dragOffsetX;
    let newY = clientY - dragOffsetY;

    // 边界限制
    const boxWidth = 50;
    const boxHeight = 90;

    // X轴边界：0 到 (屏幕宽度 - 组件宽度)
    const maxX = window.innerWidth - boxWidth;
    // Y轴边界：0 到 (屏幕高度 - 组件高度)
    const maxY = window.innerHeight - boxHeight;

    // 限制在安全范围内
    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(-80, Math.min(maxY, newY));
    if (newY > 30) {
      newY = 30;
    }
    if (newX > 200) {
      newX = 200;
    }

    updateBoxPosition(newX, newY);
  } else {
    // 模式 B：待命模式 - 圆点弹性滑动
    let deltaY = clientY - readyStartPointerY;
    const absDelta = Math.abs(deltaY);

    // 橡皮筋阻尼效果
    if (absDelta > MAX_DOT_DRAG) {
      const excess = absDelta - MAX_DOT_DRAG;
      const sign = deltaY > 0 ? 1 : -1;
      deltaY = sign * (MAX_DOT_DRAG + excess * 0.2);
    }

    dotOffsetY.value = deltaY;
    console.log(deltaY);

    // if(deltaY < 0 ) {
    //   console.log("向上滑动", deltaY)
    // }
    if (deltaY < -65) {
      deltaY = -65;
    }

    if (deltaY > 65) {
      deltaY = 65;
    }

    // if(deltaY > 0 ) {
    //   console.log("向下滑动", deltaY)
    // }
    // deltaY  正向下  负数 向上
    updateArrows(deltaY);
  }
};

const handleEnd = () => {
  if (!isDragging.value) return;

  isDragging.value = false;
  isReadyMode.value = false;
  clearTimeout(idleTimer);

  dotOffsetY.value = 0;
  resetArrows();

  // 移除全局事件
  window.removeEventListener("mousemove", handleMove);
  window.removeEventListener("touchmove", handleMove);
  window.removeEventListener("mouseup", handleEnd);
  window.removeEventListener("touchend", handleEnd);
};

// --- 生命周期 ---
onMounted(() => {
  // 初始化居中
  //   boxX.value = window.innerWidth / 2 - 50;
  //   boxY.value = window.innerHeight / 2 - 120;
});

onBeforeUnmount(() => {
  // 组件销毁时清理定时器和事件
  clearTimeout(idleTimer);
  window.removeEventListener("mousemove", handleMove);
  window.removeEventListener("touchmove", handleMove);
  window.removeEventListener("mouseup", handleEnd);
  window.removeEventListener("touchend", handleEnd);
});
</script>

<style scoped>
.control-box {
  position: fixed;

  left: 20px;
  bottom: 20px;
  width: 50px;
  height: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;

  box-sizing: border-box;
  z-index: 100;
  will-change: transform;
  /* 防止在移动端拖动时选中文字或触发浏览器默认行为 */
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
