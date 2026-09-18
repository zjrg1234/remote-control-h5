<template>
  <div
    class="control-wrapper"
    ref="wrapperRef"
    :style="wrapperStyle"
    @touchstart.prevent="handleStart"
    @touchmove.prevent="handleMove"
    @touchend.prevent="handleEnd"
    @touchcancel.prevent="handleEnd"
    @mousedown.prevent="handleStart"
    @mousemove.prevent="handleMove"
    @mouseup.prevent="handleEnd"
    @mouseleave.prevent="handleEnd"
  >
    <div class="control-box">
      <div class="cont">
      
        <!-- 轨迹背景圈 -->
        <div class="track-bg"></div>

        <!-- 左箭头 -->
        <img
          class="arrow left"
          :class="{ active: isLeftActive }"
          src="@/assets/images/d‌_left@2x.png"
          alt=""
        />
        <!-- 右箭头 -->
        <img
          class="arrow right"
          :class="{ active: isRightActive }"
          src="@/assets/images/d_right@2x.png"
          alt=""
        />

        <!-- 摇杆圆点 -->
        <div class="dot" :class="{ ready: isReadyMode }" :style="dotStyle">
        
          <img src="@/assets/images/d_dot‌@2x.png" alt="" />
        </div>
            {{ props.isLeft }}
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
  onBeforeUnmount,
} from 'vue'

const emit = defineEmits(['action', 'action2'])

const props = defineProps({
  mode: { type: Boolean, default: true },
  isLeft: { type: Boolean, default: false },
})



// --- 配置参数 ---
const IDLE_DELAY = 100 // 进入待命模式的延迟时间(ms)
const MAX_RADIUS = 65 // 圆点滑动的最大半径(px)
const SWIPE_THRESHOLD = 15 // 触发箭头的阈值

// --- 响应式状态 ---
const isDragging = ref(false)
const isReadyMode = ref(false)
const isUpActive = ref(false)
const isDownActive = ref(false)
const isLeftActive = ref(false)
const isRightActive = ref(false)

// 仅保留圆点位置状态
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
  right: '120px',
  bottom: '50px',
})

const backLeftInit = () => {
 
  wrapperStyle.left = '90px'
  wrapperStyle.bottom = '50px'
  delete wrapperStyle.right
}

const backRightInit = () => {

  wrapperStyle.right = '120px'
  wrapperStyle.bottom = '50px'
  delete wrapperStyle.left
}

watch(
  () => props.isLeft,
  (val) => {
    if (val) backLeftInit()
    else backRightInit()
  },
  { deep: true, immediate: true }
)

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

// 统一获取触摸/鼠标坐标
const getClientPos = (e) => {
  if (e.touches && e.touches.length > 0) {
    return {
      clientX: e.touches[0].pageX || e.touches[0].clientX,
      clientY: e.touches[0].pageY || e.touches[0].clientY,
    }
  }
  if (e.changedTouches && e.changedTouches.length > 0) {
    return {
      clientX: e.changedTouches[0].pageX || e.changedTouches[0].clientX,
      clientY: e.changedTouches[0].pageY || e.changedTouches[0].clientY,
    }
  }
  return {
    clientX: e.pageX || e.clientX,
    clientY: e.pageY || e.clientY,
  }
}

const enterReadyMode = () => {
  isReadyMode.value = true
  vibrate('light')
}

const updateArrows = (dx, dy) => {
  const distance = Math.sqrt(dx * dx + dy * dy)
  const ratioValue = Math.min(distance / MAX_RADIUS, 1)

  isLeftActive.value = dx < -SWIPE_THRESHOLD
  isRightActive.value = dx > SWIPE_THRESHOLD

  if (emitInterval) {
    clearInterval(emitInterval)
    emitInterval = null
  }

  const hasActive = isLeftActive.value || isRightActive.value

  if (hasActive && isDragging.value) {
    // 立即发送一次
    emit('action', { lr: dx < 0, value: dx, ratioValue })

    // 持续发送
    emitInterval = setInterval(() => {
      if (!isDragging.value || !(isLeftActive.value || isRightActive.value)) {
        clearInterval(emitInterval)
        emitInterval = null
        return
      }
      emit('action', {
        lr: currentDotX.value < 0,
        value: Math.round(currentDotX.value * 100) / 100,
        ratioValue,
      })
    }, 1000)
  } else {
    emit('action', { lr: false, value: 0 })
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
  emit('action', { lr: false, value: 0 })
}

// --- 事件处理 ---
const handleStart = (e) => {
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

const handleCancel = () => {
  console.log('handleCancel')
}

const handleClick = (val) => {
  emit('action2', { type: val })
}

// --- 清理 ---
onBeforeUnmount(() => {
  clearTimeout(idleTimer)
  if (emitInterval) {
    clearInterval(emitInterval)
    emitInterval = null
  }
})
</script>

<style lang="scss" scoped>
.control-wrapper {
  position: fixed;
  right: 120px;
  bottom: 40px;
  width: 215px;
  height: 175px;
  z-index: 9999;
  /* 移动端阻止默认滚动手势干扰摇杆 */
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.control-box {
  position: absolute;
  right: 0;
  width: 100%;
  height: 175px;
  user-select: none;
  touch-action: none;
}

.cont {
  position: relative;
  width: 235px;
  height: 176px;

  /* 轨迹背景圈 */
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

  /* 箭头通用 */
  .arrow {
    width: 50px;
    height: 50px;

    transition: all 0.2s ease;
    z-index: 1;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

    &.active {
      filter: drop-shadow(0 0 4px rgba(255, 167, 38, 0.8));
      transform: scale(1.2);
    }
  }

  /* 箭头位置 */
  .arrow.left {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 25px;

    &.active {
      transform: translateY(-50%) scale(1.2);
    }
  }

  .arrow.right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 25px;

    &.active {
      transform: translateY(-50%) scale(1.2);
    }
  }

  /* 摇杆圆点 — 居中 */
  .dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    overflow: hidden; 
    img {
      width: 100%;
      height: 100%;
      display: block;
      pointer-events: none;
      transform: scale(1.06);
    }

    &.ready {
      box-shadow: 0 0 12px rgba(255, 167, 38, 0.8);
    }
  }
}

/* 已被注释掉的箭头位置保留备用
.arrow.up { position: absolute; left: 75px; top: 25px; }
.arrow.down { position: absolute; left: 75px; bottom: 25px; }
*/

.flex {
  display: flex;
  justify-content: space-between;
}
</style>