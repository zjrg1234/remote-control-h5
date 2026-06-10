<template>
  <div class="container">
    <div
      ref="rippleWrap"
      class="ripple-btn"
      @mousedown="handleMouseDown"
      @mouseup="stopRipple"
      @mouseleave="stopRipple"
      @touchstart="handleTouchStart"
      @touchend="stopRipple"
      @touchcancel="stopRipple"
    >
      <img src="@/assets/images/icon_microphone_open@2x.png" alt="麦克风" />
      <!-- @/assets/images/icon_microphone_open@2x.png -->
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const rippleWrap = ref(null) // 绑定外层容器DOM
const INTERVAL = 1000
const ALPHA = 0.4
const rippleBg = `rgba(255, 200, 56, ${ALPHA})`

let timer = null

// 创建水波纹（固定使用外层容器，不受图片点击影响）
const createRipple = (clientX, clientY) => {
  const btnDom = rippleWrap.value
  if (!btnDom) return

  const ripple = document.createElement('span')
  ripple.className = 'ripple'
  ripple.style.background = rippleBg

  const rect = btnDom.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = clientX - rect.left - size / 2
  const y = clientY - rect.top - size / 2

  Object.assign(ripple.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}px`,
    top: `${y}px`
  })

  btnDom.appendChild(ripple)
  setTimeout(() => ripple.remove(), 1200)
}

// 停止波纹
const stopRipple = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 鼠标按下
const handleMouseDown = (e) => {
  e.preventDefault()
  createRipple(e.clientX, e.clientY)


  timer = setInterval(() => {
    createRipple(e.clientX, e.clientY)
  }, INTERVAL)
}

// 触摸按下
const handleTouchStart = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  createRipple(touch.clientX, touch.clientY)
  timer = setInterval(() => {
    createRipple(touch.clientX, touch.clientY)
  }, INTERVAL)
}

onUnmounted(() => stopRipple())
</script>

<style scoped>
.container {
  display: inline-block;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  /* 图片居中 */
  display: flex;
  justify-content: center;
  align-items: center;
}

img {
  width: 11px;
  height: 11px;
  /* 禁止图片拖拽、点击穿透 */
  pointer-events: none;
  user-select: none;
}
</style>

<style>
.ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 1.2s ease-out;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>