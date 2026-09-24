<template>
  <!-- 注意：这里不再绑定 Vue 的响应式 style，而是直接操作 DOM -->
  <div class="control-box" ref="boxRef">
    <!-- 上箭头 -->
    <div
      class="arrow up"
      :style="{ backgroundImage: `url(${upImage})` }"
      :class="{ active: isUpActive }"
    ></div>

    <!-- 可拖动的圆点 -->
    <div
      class="dot"
      ref="dotRef"
      :class="{ ready: isReadyMode }"
      :style="{
        backgroundImage: `url(${dotImage})`,
      }"
      @mousedown.prevent="handleStart"
      @touchstart.prevent="handleStart"
    ></div>

    <!-- 下箭头 -->
    <div
      class="arrow down"
      :style="{ backgroundImage: `url(${downImage})` }"
      :class="{ active: isDownActive }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import upImg from "@/assets/images/s_up@2x.png";
import downImg from "@/assets/images/s_down@2x.png";
import dotImg from "@/assets/images/s_dot@2x.png";

const upImage = ref(upImg);
const downImage = ref(downImg);
const dotImage = ref(dotImg);

// ==================== Props ====================
const props = defineProps({
  // 圆点最大上下移动距离（px）
  maxOffset: { type: Number, default: 60 },
  // 死区阈值（px），小于此距离不触发方向
  deadZone: { type: Number, default: 8 },
  // 持续发送频率（ms）
  emitInterval: { type: Number, default: 40 },
  // 待命模式触发延迟（ms）
  idleDelay: { type: Number, default: 200 }
})

// ==================== Emits ====================
const emit = defineEmits(['change', 'start', 'end'])

// ==================== Refs ====================
const boxRef = ref(null)
const dotRef = ref(null)

// ==================== 响应式状态（仅用于 UI 类名切换） ====================
const isDragging = ref(false)
const isReadyMode = ref(false)
const isUpActive = ref(false)
const isDownActive = ref(false)

// ==================== 非响应式变量 ====================
let currentY = 0            // 当前圆点 Y 偏移（px，负=上，正=下）
let startTouchY = 0         // ⭐ 手指按下的初始 Y 坐标
let startDotY = 0           // ⭐ 按下时圆点的位置（通常是 0）
let baseCenterY = 0         // 底盘中心 Y 坐标（保留兼容）
let idleTimer = null        // 待命模式定时器
let emitTimer = null        // 持续发送定时器

// ==================== 工具函数 ====================
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

// ==================== 直接操作 DOM 更新圆点位置 ====================
const updateDotTransform = (y) => {
  if (!dotRef.value) return
  // 用 translate3d 触发 GPU 加速
  dotRef.value.style.transform = `translate3d(-50%, calc(-50% + ${y}px), 0)`
}

// ==================== 待命模式 ====================
const enterReadyMode = () => {
  isReadyMode.value = true
  if (navigator.vibrate) navigator.vibrate(10)
}

const resetIdleTimer = () => {
  clearTimeout(idleTimer)
  if (!isReadyMode.value) {
    idleTimer = setTimeout(enterReadyMode, props.idleDelay)
  }
}

// ==================== 核心：计算并发送状态 ====================
const emitCurrentState = () => {
  const dy = currentY
  const distance = Math.abs(dy)
  const speed = Math.min(distance / props.maxOffset, 1)

  let up = false
  let down = false

  if (distance >= props.deadZone) {
    if (dy < 0) {
      up = true   // 屏幕上方：dy 为负
    } else {
      down = true // 屏幕下方：dy 为正
    }
  }

  // 只在状态变化时更新响应式（减少 Vue 重渲染）
  if (isUpActive.value !== up) isUpActive.value = up
  if (isDownActive.value !== down) isDownActive.value = down

  // 有符号值：-1（最上）~ 0（中）~ 1（最下）
  const value = dy / props.maxOffset

  emit('change', {
    up,
    down,
    speed,
    distance,
    value
  })
}

const resetDirection = () => {
  isUpActive.value = false
  isDownActive.value = false
  if (emitTimer) {
    clearInterval(emitTimer)
    emitTimer = null
  }
  emit('change', {
    up: false,
    down: false,
    speed: 0,
    distance: 0,
    value: 0
  })
}

// ==================== 拖动核心逻辑 ====================
const updateJoystick = (dy) => {
  // 限制最大范围
  dy = clamp(dy, -props.maxOffset, props.maxOffset)

  currentY = dy
  // ⚠️ 直接操作 DOM，绕过 Vue 响应式
  updateDotTransform(dy)

  const hasActive = Math.abs(dy) > props.deadZone

  if (hasActive && isDragging.value) {
    emitCurrentState()
    if (!emitTimer) {
      emitTimer = setInterval(() => {
        if (!isDragging.value) {
          clearInterval(emitTimer)
          emitTimer = null
          return
        }
        emitCurrentState()
      }, props.emitInterval)
    }
  } else {
    resetDirection()
  }
}

// ==================== 事件处理 ====================
const handleStart = (e) => {
  e.preventDefault?.()

  // ⭐ 立即移除 transition，不依赖 Vue 异步更新，避免首帧"飘动"
  if (dotRef.value) {
    dotRef.value.style.transition = 'none'
  }

  const clientY = e.touches ? e.touches[0].clientY : e.clientY

  isDragging.value = true
  isReadyMode.value = false
  clearTimeout(idleTimer)
  resetDirection()

  // ⭐ 记录手指起点 + 圆点起点（相对移动的关键）
  startTouchY = clientY
  startDotY = currentY

  // 保留底盘中心计算（后续扩展用）
  const boxRect = boxRef.value.getBoundingClientRect()
  baseCenterY = boxRect.top + boxRect.height / 2

  // 全局绑定，确保手指移出元素后依然生效
  document.addEventListener('mousemove', handleMove, { passive: false })
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('touchend', handleEnd)
  document.addEventListener('touchcancel', handleEnd)

  resetIdleTimer()
  emit('start', { y: clientY })
}

const handleMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault?.()

  const clientY = e.touches ? e.touches[0].clientY : e.clientY

  // ⭐ 相对位移：手指移动了多少，圆点就走多少
  const deltaY = clientY - startTouchY
  const newY = clamp(startDotY + deltaY, -props.maxOffset, props.maxOffset)

  resetIdleTimer()
  updateJoystick(newY)
}

const handleEnd = (e) => {
  if (!isDragging.value) return

  isDragging.value = false
  isReadyMode.value = false
  clearTimeout(idleTimer)

  // 松手回中
  currentY = 0
  updateDotTransform(0)
  resetDirection()

  // ⭐ 用 rAF 恢复 transition（先让位置生效，再加过渡）
  requestAnimationFrame(() => {
    if (dotRef.value) {
      dotRef.value.style.transition =
        'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  })

  // 解绑全局事件
  document.removeEventListener('mousemove', handleMove)
  document.removeEventListener('mouseup', handleEnd)
  document.removeEventListener('touchmove', handleMove)
  document.removeEventListener('touchend', handleEnd)
  document.removeEventListener('touchcancel', handleEnd)

  const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
  emit('end', { y: clientY })
}

// ==================== 生命周期 ====================
onMounted(() => {
  // 初始化圆点位置
  updateDotTransform(0)
})

onUnmounted(() => {
  clearTimeout(idleTimer)
  clearInterval(emitTimer)
  // 防止组件卸载后事件残留
  document.removeEventListener('mousemove', handleMove)
  document.removeEventListener('mouseup', handleEnd)
  document.removeEventListener('touchmove', handleMove)
  document.removeEventListener('touchend', handleEnd)
  document.removeEventListener('touchcancel', handleEnd)
})
</script>

<style lang="scss" scoped>
.control-box {
  position: fixed;
  bottom: 50%;
  width: 55px;
  height: 200px;
  padding: 12.5px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: url("@/assets/images/s_bg@2x.png") center / cover no-repeat;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

/* 箭头 */
.arrow {
  width: 40px;
  height: 40px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.4;
  transition: opacity 0.15s ease, transform 0.15s ease;
  pointer-events: none;

  &.active {
    opacity: 1;
    transform: scale(1.15);
  }

  &.up.active {
    filter: drop-shadow(0 0 8px #5bd3a8);
  }

  &.down.active {
    filter: drop-shadow(0 0 8px #ffc838);
  }
}

/* 圆点 */
.dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: rgba(91, 211, 168, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 -2px 6px rgba(0, 0, 0, 0.15);
  cursor: grab;
  z-index: 10;
  will-change: transform;
  transform: translate3d(-50%, -50%, 0);
  /* transform 由 JS 直接控制，transition 由 JS 动态设置 */

  &:active {
    cursor: grabbing;
  }

  &.ready {
    box-shadow:
      0 0 20px rgba(91, 211, 168, 0.9),
      0 0 40px rgba(91, 211, 168, 0.5),
      inset 0 -2px 6px rgba(0, 0, 0, 0.15);
  }
}
</style>