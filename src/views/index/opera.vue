<template>
  <div class="joystick-wrapper" ref="wrapperRef">
    <!-- 底盘 -->
    <div 
      class="joystick-base" 
      :style="baseStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
      @contextmenu.prevent
    >
      <!-- 方向刻度 -->
      <div class="direction-hint">
        <span class="dir dir-up" :class="{ active: isUpActive }">▲</span>
        <span class="dir dir-down" :class="{ active: isDownActive }">▼</span>
        <span class="dir dir-left" :class="{ active: isLeftActive }">◀</span>
        <span class="dir dir-right" :class="{ active: isRightActive }">▶</span>
      </div>

      <!-- 中心圆点（摇杆头） -->
      <div 
        class="joystick-dot" 
        :class="{ ready: isReadyMode }"
        :style="dotStyle"
      >
        <div v-if="rippleActive" class="ripple"></div>
      </div>
    </div>

    <!-- 调试信息（可选） -->
    <div v-if="showDebug" class="debug-info">
      <p>角度：{{ debugInfo.angle.toFixed(1) }}°</p>
      <p>距离：{{ debugInfo.distance.toFixed(1) }}px</p>
      <p>力度：{{ (debugInfo.speed * 100).toFixed(0) }}%</p>
      <p>方向：{{ debugInfo.directionText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

// ============ Props ============
const props = defineProps({
  // 底盘尺寸（px）
  baseSize: { type: Number, default: 180 },
  // 摇杆头尺寸（px）
  dotSize: { type: Number, default: 50 },
  // 最大移动半径（px），默认底盘半径 - 摇杆头半径
  maxRadius: { type: Number, default: null },
  // 死区阈值（px），小于此距离不触发方向
  deadZone: { type: Number, default: 12 },
  // 待命模式触发延迟（ms）
  idleDelay: { type: Number, default: 200 },
  // 持续发送频率（ms）
  emitInterval: { type: Number, default: 40 },
  // 是否显示调试信息
  showDebug: { type: Boolean, default: false },
  // 底盘主色
  primaryColor: { type: String, default: '#5bd3a8' }
})

// ============ Emits ============
const emit = defineEmits(['change', 'start', 'end'])

// ============ Refs ============
const wrapperRef = ref(null)

// ============ 状态 ============
const isDragging = ref(false)
const isReadyMode = ref(false)
const isUpActive = ref(false)
const isDownActive = ref(false)
const isLeftActive = ref(false)
const isRightActive = ref(false)
const rippleActive = ref(false)

// 圆点偏移量（相对圆心）
const dotX = ref(0)
const dotY = ref(0)

// 调试信息
const debugInfo = ref({
  angle: 0,
  distance: 0,
  speed: 0,
  directionText: '无'
})

// ============ 非响应式变量 ============
let idleTimer = null
let emitTimer = null
let startPointerX = 0
let startPointerY = 0
let baseCenterX = 0
let baseCenterY = 0

// ============ 计算属性 ============
const actualMaxRadius = computed(() => {
  if (props.maxRadius !== null) return props.maxRadius
  return (props.baseSize - props.dotSize) / 2
})

const baseStyle = computed(() => ({
  width: `${props.baseSize}px`,
  height: `${props.baseSize}px`,
  '--primary-color': props.primaryColor
}))

const dotStyle = computed(() => ({
  width: `${props.dotSize}px`,
  height: `${props.dotSize}px`,
  transform: `translate(calc(-50% + ${dotX.value}px), calc(-50% + ${dotY.value}px))`,
  transition: isDragging.value
    ? 'none'
    : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease'
}))

// ============ 工具函数 ============

// 进入待命模式
const enterReadyMode = () => {
  isReadyMode.value = true
  // 触感反馈（如果设备支持）
  if (navigator.vibrate) navigator.vibrate(10)
}

// 重置待命计时器
const resetIdleTimer = () => {
  clearTimeout(idleTimer)
  if (!isReadyMode.value) {
    idleTimer = setTimeout(enterReadyMode, props.idleDelay)
  }
}

// 计算当前方向并发送
const emitCurrentState = () => {
  const dx = dotX.value
  const dy = dotY.value
  const distance = Math.sqrt(dx * dx + dy * dy)
  const speed = Math.min(distance / actualMaxRadius.value, 1)

  let up = false, down = false, left = false, right = false

  if (distance >= props.deadZone) {
    // 角度计算，以"左"为 0°，顺时针增加
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    angle = (angle + 180 + 360) % 360

    // 8 方向判定
    if (angle >= 330 || angle < 30) {
      left = true
    } else if (angle >= 30 && angle < 60) {
      left = true; up = true
    } else if (angle >= 60 && angle < 120) {
      up = true
    } else if (angle >= 120 && angle < 150) {
      up = true; right = true
    } else if (angle >= 150 && angle < 210) {
      right = true
    } else if (angle >= 210 && angle < 240) {
      right = true; down = true
    } else if (angle >= 240 && angle < 300) {
      down = true
    } else if (angle >= 300 && angle < 330) {
      down = true; left = true
    }

    // 调试信息
    debugInfo.value = {
      angle,
      distance,
      speed,
      directionText: [up && '上', down && '下', left && '左', right && '右']
        .filter(Boolean).join('') || '无'
    }
  } else {
    debugInfo.value = { angle: 0, distance, speed: 0, directionText: '无' }
  }

  isUpActive.value = up
  isDownActive.value = down
  isLeftActive.value = left
  isRightActive.value = right

  emit('change', { up, down, left, right, speed, distance })
}

// 更新方向并管理定时器
const updateJoystick = (dx, dy) => {
  // 限制最大半径
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance > actualMaxRadius.value) {
    const angle = Math.atan2(dy, dx)
    dx = Math.cos(angle) * actualMaxRadius.value
    dy = Math.sin(angle) * actualMaxRadius.value
  }

  dotX.value = dx
  dotY.value = dy

  const hasActive = Math.abs(dx) > props.deadZone || Math.abs(dy) > props.deadZone

  if (hasActive && isDragging.value) {
    // 立即发送一次
    emitCurrentState()
    // 启动持续发送
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

// 重置方向
const resetDirection = () => {
  isUpActive.value = false
  isDownActive.value = false
  isLeftActive.value = false
  isRightActive.value = false
  if (emitTimer) {
    clearInterval(emitTimer)
    emitTimer = null
  }
  emit('change', { up: false, down: false, left: false, right: false, speed: 0, distance: 0 })
}

// ============ 事件处理 ============

const onPointerDown = (e) => {
  // 只响应主指针（鼠标左键 / 单指）
  if (e.button !== undefined && e.button !== 0) return
  e.preventDefault()

  isDragging.value = true
  isReadyMode.value = false
  clearTimeout(idleTimer)
  resetDirection()

  // 记录起始点（用户按下时的坐标）
  startPointerX = e.clientX
  startPointerY = e.clientY

  // 获取底盘中心
  const rect = wrapperRef.value.getBoundingClientRect()
  const baseRect = wrapperRef.value.querySelector('.joystick-base').getBoundingClientRect()
  baseCenterX = baseRect.left + baseRect.width / 2
  baseCenterY = baseRect.top + baseRect.height / 2

  // 设置指针捕获，确保手指移出元素后仍能收到事件
  e.target.setPointerCapture?.(e.pointerId)

  resetIdleTimer()
  emit('start', { x: e.clientX, y: e.clientY })
}

const onPointerMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()

  // 基于底盘中心计算偏移
  const dx = e.clientX - baseCenterX
  const dy = e.clientY - baseCenterY

  resetIdleTimer()
  updateJoystick(dx, dy)
}

const onPointerUp = (e) => {
  if (!isDragging.value) return

  isDragging.value = false
  isReadyMode.value = false
  clearTimeout(idleTimer)

  // 松手回中
  dotX.value = 0
  dotY.value = 0
  resetDirection()

  emit('end', { x: e.clientX, y: e.clientY })
}

// 清理
onUnmounted(() => {
  clearTimeout(idleTimer)
  clearInterval(emitTimer)
})
</script>

<style lang="scss" scoped>
.joystick-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.joystick-base {
  position: relative;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.25) 0%,
    rgba(0, 0, 0, 0.4) 70%,
    rgba(0, 0, 0, 0.55) 100%
  );
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 4px 12px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(0, 0, 0, 0.2);
  touch-action: none;
  cursor: pointer;
  backdrop-filter: blur(6px);
}

/* 方向刻度 */
.direction-hint {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .dir {
    position: absolute;
    color: rgba(255, 255, 255, 0.35);
    font-size: 14px;
    transition: color 0.15s, text-shadow 0.15s;

    &.active {
      color: var(--primary-color, #5bd3a8);
      text-shadow: 0 0 8px var(--primary-color, #5bd3a8);
    }
  }

  .dir-up    { top: 10px; left: 50%; transform: translateX(-50%); }
  .dir-down  { bottom: 10px; left: 50%; transform: translateX(-50%); }
  .dir-left  { left: 10px; top: 50%; transform: translateY(-50%); }
  .dir-right { right: 10px; top: 50%; transform: translateY(-50%); }
}

/* 摇杆头 */
.joystick-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--primary-color, #5bd3a8) 50%,
    rgba(60, 160, 130, 1) 100%
  );
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 -2px 6px rgba(0, 0, 0, 0.15);
  z-index: 2;
  will-change: transform;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 待命模式发光 */
  &.ready {
    box-shadow:
      0 0 20px rgba(91, 211, 168, 0.9),
      0 0 40px rgba(91, 211, 168, 0.5),
      inset 0 -2px 6px rgba(0, 0, 0, 0.15);
  }

  /* 波纹 */
  .ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200%;
    height: 200%;
    border-radius: 50%;
    background: rgba(91, 211, 168, 0.6);
    transform: translate(-50%, -50%) scale(0.5);
    pointer-events: none;
    animation: ripplePulse 1.2s ease-in-out infinite;
  }
}

@keyframes ripplePulse {
  0% {
    transform: translate(-50%, -50%) scale(0.6);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0.1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.6);
    opacity: 0.5;
  }
}

/* 调试信息 */
.debug-info {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  line-height: 1.6;

  p {
    margin: 0;
  }
}
</style>