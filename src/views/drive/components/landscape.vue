<template>
  <div class="landscape-wrapper">
    <slot></slot>
  </div>
</template>

<script setup>
// 纯 CSS 方案，无需额外 JS 逻辑
</script>

<style scoped>
.landscape-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 核心：当设备处于竖屏时触发 */
@media screen and (orientation: portrait) {
  .landscape-wrapper {
    /* 1. 宽高互换，适配横屏尺寸 */
    width: 100vh;
    height: 100vw;
    
    /* 2. 使用 fixed 脱离文档流，无视父级元素的 overflow 限制 */
    position: fixed;
    top: 0;
    left: 0;
    
    /* 3. 绕左上角旋转 90 度 */
    transform-origin: top left;
    transform: rotate(90deg);
    
    /* 4. 关键修正：将旋转后的容器完美居中到可视区域，彻底解决内容消失问题 */
    margin-left: 100vh;
    margin-top: calc((100vw - 100vh) / 2);
  }
}
</style>