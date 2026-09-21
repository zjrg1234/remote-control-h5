<template>
  <div
    class="control-wrapper"
    ref="wrapperRef"
    :style="wrapperStyle"
    @touchstart="handleStart"
    @touchmove="handleMove"
    @touchend="handleEnd"
    @touchcancel="handleEnd"
  >
    <div class="control-box">
      <div class="cont">
        <!-- 轨迹背景圈 -->
        <div class="track-bg"></div>

        <!-- 上箭头 -->
        <img
          class="arrow up"
          :class="{ active: isUpActive }"
          src="../static/arrow_up_big@2x.png"
          alt=""
        />
        <!-- 下箭头 -->
        <img
          class="arrow down"
          :class="{ active: isDownActive }"
          src="../static/arrow_down_big@2x.png"
          alt=""
        />

        <!-- 摇杆圆点 -->
        <div class="dot" :class="{ ready: isReadyMode }" :style="dotStyle">
          <img src="../static/dot@2x.png" alt="" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue'

const emit = defineEmits(['action', 'action2'])

const props = defineProps({
  mode: { type: Boolean, default: true },
  isLeft: { type: Boolean, default: true },
})

watch(
  () => props.isLeft,
  (val) => {
    if (val) backLeftInit()
    else backRightInit()
  },
  { deep: true }
)

// --- 配置参数 ---
const IDLE_DELAY = 200
const MAX_RADIUS = 65
const SWIPE_THRESHOLD = 15
const EMIT_INTERVAL = 50   // 🔑 关键修复：1000ms → 50ms，让手感丝滑

// --- 响应式状态 ---
const isDragging = ref(false)
const isReadyMode = ref(false)
const isUpActive = ref(false)
const isDownActive = ref(false)
const isLeftActive = ref(false)
const isRightActive = ref(false)

const currentDotX = ref(0)
const currentDotY = ref(0)
const wrapperRef = ref(null)

// --- 内部非响应式状态 ---
let idleTimer = null
let lastPointerX = 0
let lastPointerY = 0
let readyBaseX = 0
let readyBaseY = 0
let emitInterval = null

// --- 圆点样式 ---
const dotStyle = computed(() => ({
  transform: `translate(calc(-50% + ${currentDotX.value}px), calc(-50% + ${currentDotY.value}px))`,
  transition: isDragging.value
    ? 'none'
    : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
}))

// --- wrapper 定位 ---
const wrapperStyle = reactive({
  left: '90px',
  bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))',  // 🔑 安全区
})

const backLeftInit = () => {
  wrapperStyle.left = '90px'
  wrapperStyle.bottom = 'calc(50px + env(safe-area-inset-bottom, 0px))'
  delete wrapperStyle.right
}

const backRightInit = () => {
  wrapperStyle.right = '120px'
  wrapperStyle.bottom = 'calc(50px + env(safe-area-inset-bottom, 0px))'
  delete wrapperStyle.left
}

// --- 震动兼容 ---
const vibrate = (type = 'light') => {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  try {
    const map = { light: 10, medium: 20, heavy: 30 }
    navigator.vibrate(map[type] || 10)
  } catch (e) {}
}

// --- 核心方法 ---
const resetIdleTimer = () => {
  clearTimeout(idleTimer)
  if (!isReadyMode.value) {
    idleTimer = setTimeout(enterReadyMode, IDLE_DELAY)
  }
}

// 统一坐标获取：优先 touch，其次 mouse
const getClientPos = (e) => {
  if (e.touches && e.touches.length > 0) {
    return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
  }
  if (e.changedTouches && e.changedTouches.length > 0) {
    return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }
  }
  return { clientX: e.clientX, clientY: e.clientY }
}

const enterReadyMode = () => {
  isReadyMode.value = true
  vibrate('light')
}

const updateArrows = (dx, dy) => {
  const distance = Math.sqrt(dx * dx + dy * dy)
  const ratioValue = Math.min(distance / MAX_RADIUS, 1)

  isUpActive.value = dy < -SWIPE_THRESHOLD
  isDownActive.value = dy > SWIPE_THRESHOLD
  isLeftActive.value = dx < -SWIPE_THRESHOLD
  isRightActive.value = dx > SWIPE_THRESHOLD

  if (emitInterval) {
    clearInterval(emitInterval)
    emitInterval = null
  }

  const hasActive = isUpActive.value || isDownActive.value

  if (hasActive && isDragging.value) {
    const value = Math.round(dy * 100) / 100
    emit('action', { fb: dy < 0, value, ratioValue })

    emitInterval = setInterval(() => {
      if (!isDragging.value || !(isUpActive.value || isDownActive.value)) {
        clearInterval(emitInterval)
        emitInterval = null
        return
      }
      const dyNow = currentDotY.value
      const valueNow = Math.round(dyNow * 100) / 100
      emit('action', { fb: dyNow < 0, value: valueNow, ratioValue })
    }, EMIT_INTERVAL)
  } else {
    emit('action', { fb: false, value: 0 })
  }
}

const resetArrows = () => {
  isUpActive.value = false
  isDownActive.value = false
  isLeftActive.value = false
  isRightActive.value = false
  if (emitInterval) {
    clearInterval(emitInterval)
    emitInterval = null
  }
  emit('action', { fb: false, value: 0 })
}

// --- 事件处理 ---
const handleStart = (e) => {
  // 🔑 移动端阻止长按选中/系统菜单
  if (e.cancelable) e.preventDefault()

  isDragging.value = true
  isReadyMode.value = false
  clearTimeout(idleTimer)
  resetArrows()

  const { clientX, clientY } = getClientPos(e)
  lastPointerX = clientX
  lastPointerY = clientY

  readyBaseX = lastPointerX
  readyBaseY = lastPointerY

  resetIdleTimer()
}

const handleMove = (e) => {
  if (!isDragging.value) return
  // 🔑 拖动时阻止滚动（touch-action: none 已处理，这里再加一重保险）
  if (e.cancelable) e.preventDefault()

  const { clientX, clientY } = getClientPos(e)

  lastPointerX = clientX
  lastPointerY = clientY
  resetIdleTimer()

  let dx = clientX - readyBaseX
  let dy = clientY - readyBaseY

  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance > MAX_RADIUS) {
    const angle = Math.atan2(dy, dx)
    dx = Math.cos(angle) * MAX_RADIUS
    dy = Math.sin(angle) * MAX_RADIUS
  }

  currentDotX.value = dx
  currentDotY.value = dy
  updateArrows(dx, dy)
}

const handleEnd = () => {
  if (!isDragging.value) return
  currentDotX.value = 0
  currentDotY.value = 0
  isDragging.value = false
  isReadyMode.value = false
  clearTimeout(idleTimer)
  if (emitInterval) {
    clearInterval(emitInterval)
    emitInterval = null
  }
  resetArrows()
}

// --- 生命周期 ---
onMounted(() => {
  // iOS 老版本可能不支持 touch-action，用 JS 兜底阻止页面滚动
  const el = wrapperRef.value
  if (!el) return

  const blockScroll = (e) => {
    if (e.cancelable) e.preventDefault()
  }

  // 🔑 显式声明 passive: false，消除 Chrome 警告
  el.addEventListener('touchmove', blockScroll, { passive: false })
  el._blockScroll = blockScroll
})

onBeforeUnmount(() => {
  clearTimeout(idleTimer)
  if (emitInterval) {
    clearInterval(emitInterval)
    emitInterval = null
  }
  // 清理手动绑定的监听器
  const el = wrapperRef.value
  if (el && el._blockScroll) {
    el.removeEventListener('touchmove', el._blockScroll)
    delete el._blockScroll
  }
})
</script>

<style lang="scss" scoped>
.control-wrapper {
  position: fixed;
  width: 140px;
  height: 180px;
  z-index: 9999;

  /* 🔑 移动端三大件 */
  touch-action: none;              /* 禁止浏览器接管手势 */
  user-select: none;               /* 禁止选中文字 */
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;  /* 去掉 iOS 点击灰色高亮 */
  -webkit-touch-callout: none;     /* 禁止长按弹出菜单 */
}

.control-box {
  position: absolute;
  left: 0;
  width: 100%;
  height: 180px;
  touch-action: none;
}

.cont {
  position: relative;
  width: 140px;
  height: 190px;

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
    width: 50px;
    height: 50px;
    opacity: 0.7;
    transition: all 0.2s ease;
    z-index: 1;
    pointer-events: none;

    &.active {
      opacity: 1;
      filter: drop-shadow(0 0 4px rgba(255, 167, 38, 0.8));
      transform: scale(1.2);
    }
  }

  .arrow.up {
    position: absolute;
    left: 45px;
    top: 0;
  }

  .arrow.down {
    position: absolute;
    left: 45px;
    bottom: 0;
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
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    img {
      width: 100%;
      height: 100%;
      display: block;
      pointer-events: none;
    }

    &.ready {
      box-shadow: 0 0 12px rgba(255, 167, 38, 0.8);
    }
  }
}
</style>