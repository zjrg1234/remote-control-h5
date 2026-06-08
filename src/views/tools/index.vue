<template>
  <div class="landscape-page">
    <div class="page-content">

      <ALLPopup v-model:show="tipVisible" type="tip" :count="count" @action="handlePopupAction" />
      <ALLPopup v-model:show="logoutVisible" type="logout" :count="count" @action="handlePopupAction" />
      <ALLPopup v-model:show="repairVisible" type="repair" :count="count" @action="handlePopupAction" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ALLPopup from './components/ALLPopup.vue'
const isLandscape = ref(true)
const tipVisible = ref(false)
const logoutVisible = ref(false)
const repairVisible = ref(true)

const count = ref(15)

// 检测屏幕方向
const checkOrientation = () => {
  isLandscape.value = window.innerWidth > window.innerHeight
}

onMounted(() => {
  checkOrientation()
  window.addEventListener('resize', checkOrientation)
  window.addEventListener('orientationchange', checkOrientation)

  // 2. 修复 const 不能重新赋值的 bug
  let timer = setInterval(() => {
    count.value -= 1
    if (count.value <= 0) {
      count.value = 0
      clearInterval(timer)
      timer = null
    }
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkOrientation)
  window.removeEventListener('orientationchange', checkOrientation)
})

const handlePopupAction = () => {
  
}

</script>

<style lang="scss" scoped>
/* 页面最外层容器 */
.landscape-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #fff;
}

/* 竖屏时：旋转页面 */
@media screen and (orientation: portrait) and (max-device-width: 800px) {
  .landscape-page {
    position: absolute;
    width: 100vh;
    height: 100vw;
    top: 0;
    left: 100vw;
    transform: rotate(90deg);
    transform-origin: 0% 0%;
  }
}

/* 横屏时：正常显示 */
@media screen and (orientation: landscape) {
  .landscape-page {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }
}

/* 页面内容区域 */
.page-content {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 5px;
}


:deep(.custom-popup) {
  border-radius: 8px !important;
}





</style>
