<template>
  <div class="joystick-wrapper">
    <!-- 盒子底座 -->
    <div 
      class="control-box" 
      :class="{ dragging: isDragging }" 
      :style="boxStyle"
    >
      <!-- 向上箭头 -->
      <div 
        class="arrow up" 
        :class="{ active: activeDirection === 'up' }"
      />
      
      <!-- 中心圆点 (摇杆头) -->
      <div 
        class="dot" 
        :class="{ ready: isReadyMode }" 
        :style="dotStyle"
        @mousedown.prevent="handleStart"
        @touchstart.prevent="handleStart"
      />
      
      <!-- 向下箭头 -->
      <div 
        class="arrow down" 
        :class="{ active: activeDirection === 'down' }"
      />
    </div>

    <!-- 提示文字 -->
    <div class="hint">
      按住自由拖动位置<br />静止2秒后，上下拉动圆点触发指令
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';

// --- 配置参数 ---
const IDLE_DELAY = 2000;       // 静止 2s 进入待命
const SWIPE_THRESHOLD = 20;    // 触发箭头高亮的阈值 (px)
const MAX_DOT_DRAG = 40;       // 待命模式下，圆点最大可拉动距离 (px)

// --- 响应式状态 ---
const isDragging = ref(false);
const isReadyMode = ref(false);
const activeDirection = ref(null); // 'up' | 'down' | null

// 盒子绝对位置
const boxX = ref(0);
const boxY = ref(0);

// 按下时的初始状态
const startPointer = ref({ x: 0, y: 0 });
const startBox = ref({ x: 0, y: 0 });

// 待命模式滑动基准点
const lastPointerY = ref(0);
const readyStartPointerY = ref(0);

// 待命模式下圆点的实时偏移量
const currentDotDeltaY = ref(0);

let idleTimer = null;

// --- 计算属性：动态绑定样式 ---
const boxStyle = computed(() => ({
  transform: `translate(calc(-50% + ${boxX.value}px), calc(-50% + ${boxY.value}px))`
}));

const dotStyle = computed(() => {
  if (!isReadyMode.value) return {};
  const scale = 'scale(1.15)';
  return {
    transform: `translateY(${currentDotDeltaY.value}px) ${scale}`
  };
});

// --- 核心逻辑 ---
const handleStart = (e) => {
  isDragging.value = true;
  isReadyMode.value = false;
  activeDirection.value = null;
  currentDotDeltaY.value = 0;
  clearTimeout(idleTimer);

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  startPointer.value = { x: clientX, y: clientY };
  startBox.value = { x: boxX.value, y: boxY.value };
  lastPointerY.value = clientY;

  resetIdleTimer();
};

const handleMove = (e) => {
  if (!isDragging.value) return;
  e.preventDefault();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  lastPointerY.value = clientY;
  resetIdleTimer();

  if (!isReadyMode.value) {
    // 【模式 A：自由拖动】
    let newX = startBox.value.x + (clientX - startPointer.value.x);
    let newY = startBox.value.y + (clientY - startPointer.value.y);

    // 边界限制
    const maxX = window.innerWidth / 2 - 50;
    const maxY = window.innerHeight / 2 - 120;
    newX = Math.max(-maxX, Math.min(maxX, newX));
    newY = Math.max(-maxY, Math.min(maxY, newY));

    boxX.value = newX;
    boxY.value = newY;
  } else {
    // 【模式 B：待命模式 - 圆点弹性滑动】
    let deltaY = clientY - readyStartPointerY.value;

    // 橡皮筋阻尼效果
    const absDelta = Math.abs(deltaY);
    if (absDelta > MAX_DOT_DRAG) {
      const excess = absDelta - MAX_DOT_DRAG;
      const sign = deltaY > 0 ? 1 : -1;
      deltaY = sign * (MAX_DOT_DRAG + excess * 0.2);
    }

    currentDotDeltaY.value = deltaY;
    updateArrows(deltaY);
  }
};

const handleEnd = () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  isReadyMode.value = false;
  activeDirection.value = null;
  currentDotDeltaY.value = 0;
  clearTimeout(idleTimer);

  // 盒子回弹到屏幕正中心
  boxX.value = 0;
  boxY.value = 0;
};

// --- 辅助函数 ---
const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  if (!isReadyMode.value) {
    idleTimer = setTimeout(enterReadyMode, IDLE_DELAY);
  }
};

const enterReadyMode = () => {
  isReadyMode.value = true;
  readyStartPointerY.value = lastPointerY.value;
  if (navigator.vibrate) navigator.vibrate(50);
};

const updateArrows = (deltaY) => {
  if (deltaY < -SWIPE_THRESHOLD) activeDirection.value = 'up';
  else if (deltaY > SWIPE_THRESHOLD) activeDirection.value = 'down';
  else activeDirection.value = null;
};

// 全局事件监听 (需要在组件挂载时绑定，卸载时解绑)
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('touchend', handleEnd);
}

onBeforeUnmount(() => {
  clearTimeout(idleTimer);
  window.removeEventListener('mousemove', handleMove);
  window.removeEventListener('touchmove', handleMove);
  window.removeEventListener('mouseup', handleEnd);
  window.removeEventListener('touchend', handleEnd);
});
</script>

<style scoped>
.joystick-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* 让底座不阻挡页面其他区域的点击 */
}

.control-box {
  position: fixed; 
  top: 50%; 
  left: 50%;
  width: 100px; 
  height: 240px;
  display: flex; 
  flex-direction: column;
  align-items: center; 
  justify-content: space-between;
  padding: 20px 0; 
  box-sizing: border-box; 
  z-index: 100;
  pointer-events: auto; /* 只有摇杆本身可以接收事件 */
  /* 盒子回弹过渡动画 */
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.control-box.dragging { 
  transition: none; 
}

.arrow {
  width: 0; 
  height: 0;
  border-left: 25px solid transparent; 
  border-right: 25px solid transparent;
  opacity: 0.4; 
  transition: all 0.2s ease; 
  z-index: 1;
}
.arrow.up { 
  border-bottom: 35px solid #ffb74d; 
}
.arrow.down { 
  border-top: 35px solid #ffb74d; 
}
.arrow.active {
  opacity: 1;
  filter: drop-shadow(0 0 8px rgba(255, 167, 38, 0.8));
  transform: scale(1.15);
}

.dot {
  width: 50px; 
  height: 50px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0);
  border-radius: 50%; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  cursor: grab; 
  position: relative; 
  z-index: 2;
  /* 仅保留过渡属性，不设置默认 transform */
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              background 0.3s ease, 
              box-shadow 0.3s ease;
}
.dot:active { 
  cursor: grabbing; 
}

.dot.ready {
  background: radial-gradient(circle at 30% 30%, #fff, #ffcc80);
  box-shadow: 0 0 15px rgba(255, 167, 38, 0.6);
}

.hint {
  position: absolute; 
  bottom: 20px; 
  width: 100%;
  text-align: center; 
  color: #999; 
  font-size: 12px;
  pointer-events: none;
}
</style>