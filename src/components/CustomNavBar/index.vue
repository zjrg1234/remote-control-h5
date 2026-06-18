<template>
  <div class="custom-nav-bar" :style="{ height: safeHeight + 'px'}">
    <!-- 左侧区域：默认显示返回按钮 -->
    <div class="nav-left" @click="handleBack">
      <slot name="left">
        <van-icon name="arrow-left" size="20" color="#333" />
      </slot>
    </div>

    <!-- 中间区域：标题 -->
    <div class="nav-title">
      <slot name="title">{{ title }}</slot>
    </div>

    <!-- 右侧区域：预留插槽 -->
    <div class="nav-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Icon as VanIcon } from 'vant'; // 引入 Vant 图标
import 'vant/lib/icon/style';

// 定义 Props
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  // 是否自动处理返回逻辑
  backable: {
    type: Boolean,
    default: true
  },
  // 背景颜色
  bgColor: {
    type: String,
    default: '#fff'
  }
});

// 定义 Emits
const emit = defineEmits(['click-back']);

// 状态栏高度适配（模拟移动端沉浸式效果）
const statusBarHeight = ref(0);
const safeHeight = ref(45); // 导航栏内容标准高度

onMounted(() => {
  // 简单获取状态栏高度，实际项目中建议用专门的 hook 或 css env()
  // 这里为了演示，如果是 H5 环境通常不需要 paddingTop，小程序/App 需要
  // 假设是普通 Web 页面，设为 0；如果是 App/小程序，可能需要动态计算
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
     // 简单的估算，实际项目建议引入 vant 的 useRect 或 css var(--van-nav-bar-height)
     statusBarHeight.value = 20;
  }
});

// 点击返回
const handleBack = () => {
  if (props.backable) {
    // 优先触发父组件自定义事件
    emit('click-back');
    // 如果没有监听事件，且处于浏览器环境，执行默认后退
    if (!emit || window.history.length > 1) {
       window.history.back();
    }
  }
};
</script>

<style scoped>
.custom-nav-bar {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: v-bind(bgColor); /* 使用 CSS v-bind */
  box-sizing: border-box;
  z-index: 100;
}

.nav-left, .nav-right {
  width: 80px; /* 左右区域宽度一致，保证标题绝对居中 */
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 16px;
}

.nav-right {
  justify-content: flex-end;
  padding-right: 16px;
  padding-left: 0;
}

.nav-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: 60%;
  font-size: 17px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
</style>