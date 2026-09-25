<template>
  <!-- 注意：这里不再绑定 Vue 的响应式 style，而是直接操作 DOM -->
  <div class="control-box" ref="boxRef">
    <div class="cont">
      <div class="track-bg" />


      <div class="arrow left" :style="{ backgroundImage: `url(${leftImage})` }" :class="{ active: isLeftActive }"></div>

      <div class="dot" ref="dotRef" :class="{ ready: isReadyMode }" :style="{
        backgroundImage: `url(${dotImage})`,
      }" @mousedown.prevent="handleStart" @touchstart.prevent="handleStart"></div>

      <div class="arrow right" :style="{ backgroundImage: `url(${rightImage})` }" :class="{ active: isRightActive }">
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import leftImg from "@/assets/images/d‌_left@2x.png";
import rightImg from "@/assets/images/d_right@2x.png";
import dotImg from "@/assets/images/d_dot‌@2x.png";

const leftImage = ref(leftImg);
const rightImage = ref(rightImg);
const dotImage = ref(dotImg);

// ==================== Props ====================
const props = defineProps({
  // 圆点最大左右移动距离（px）
  maxOffset: { type: Number, default: 80 },
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
const isLeftActive = ref(false)
const isRightActive = ref(false)

// ==================== 非响应式变量 ====================
let currentX = 0            // 当前圆点 X 偏移（px，负=左，正=右）
let startTouchX = 0         // ⭐ 手指按下的初始 X 坐标
let startDotX = 0           // ⭐ 按下时圆点的位置（通常是 0）
let baseCenterX = 0         // 底盘中心 X 坐标（保留兼容）
let idleTimer = null        // 待命模式定时器
let emitTimer = null        // 持续发送定时器

// ==================== 工具函数 ====================
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

// ==================== 直接操作 DOM 更新圆点位置 ====================
const updateDotTransform = (x) => {
  if (!dotRef.value) return
  // 用 translate3d 触发 GPU 加速
  dotRef.value.style.transform = `translate3d(calc(-50% + ${x}px), -50%, 0)`
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
  const dx = currentX
  const distance = Math.abs(dx)
  const speed = Math.min(distance / props.maxOffset, 1)

  let left = false
  let right = false

  if (distance >= props.deadZone) {
    if (dx < 0) {
      left = true    // 屏幕左侧：dx 为负
    } else {
      right = true   // 屏幕右侧：dx 为正
    }
  }

  // 只在状态变化时更新响应式（减少 Vue 重渲染）
  if (isLeftActive.value !== left) isLeftActive.value = left
  if (isRightActive.value !== right) isRightActive.value = right

  // 有符号值：-1（最左）~ 0（中）~ 1（最右）
  const value = dx / props.maxOffset

  // emit('change', {
  //   left,
  //   right,
  //   speed,
  //   distance,
  //   value
  // })
}

const resetDirection = () => {
  isLeftActive.value = false
  isRightActive.value = false
  if (emitTimer) {
    clearInterval(emitTimer)
    emitTimer = null
  }
  // emit('change', {
  //   left: false,
  //   right: false,
  //   speed: 0,
  //   distance: 0,
  //   value: 0
  // })
}

// ==================== 拖动核心逻辑 ====================
const updateJoystick = (dx) => {
  // 限制最大范围
  dx = clamp(dx, -props.maxOffset, props.maxOffset)

  currentX = dx
  // ⚠️ 直接操作 DOM，绕过 Vue 响应式
  updateDotTransform(dx)

  const hasActive = Math.abs(dx) > props.deadZone

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

  const clientX = e.touches ? e.touches[0].clientX : e.clientX

  isDragging.value = true
  isReadyMode.value = false
  clearTimeout(idleTimer)
  resetDirection()

  // ⭐ 记录手指起点 + 圆点起点（相对移动的关键）
  startTouchX = clientX
  startDotX = currentX

  // 保留底盘中心计算（后续扩展用）
  const boxRect = boxRef.value.getBoundingClientRect()
  baseCenterX = boxRect.left + boxRect.width / 2

  // 全局绑定，确保手指移出元素后依然生效
  document.addEventListener('mousemove', handleMove, { passive: false })
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('touchend', handleEnd)
  document.addEventListener('touchcancel', handleEnd)

  resetIdleTimer()
  emit('start', { x: clientX })
}

const handleMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault?.()

  const clientX = e.touches ? e.touches[0].clientX : e.clientX

  // ⭐ 相对位移：手指移动了多少，圆点就走多少
  const deltaX = clientX - startTouchX
  const newX = clamp(startDotX + deltaX, -props.maxOffset, props.maxOffset)

  resetIdleTimer()
  updateJoystick(newX)
}

const handleEnd = (e) => {
  if (!isDragging.value) return

  isDragging.value = false
  isReadyMode.value = false
  clearTimeout(idleTimer)

  // 松手回中
  currentX = 0
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

  const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
  // emit('end', { x: clientX })
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
  right: 120px;
  bottom: 50px;
  width: 215px;
  height: 175px;
  z-index: 99;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;

}

.cont {
  position: relative;
  width: 235px;
  height: 176px;
}

.track-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 231.5px;
  height: 100px;
  pointer-events: none;
  background: url('@/assets/images/d_bg@2x.png') center / cover no-repeat;
  border-radius: 65px;
  overflow: hidden;
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
  flex-shrink: 0;

  &.active {
    opacity: 1;
    transform: scale(1.15);
  }

  &.left.active {
    filter: drop-shadow(0 0 8px #5bd3a8);
  }

  &.right.active {
    filter: drop-shadow(0 0 8px #ffc838);
  }
}

/* 圆点 */
.dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 45px;
  height: 45px;
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