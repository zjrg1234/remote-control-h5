<template>
  <div class="mini-battery-wrapper">
    <div class="battery-body">
      <div class="battery-fill" :class="statusClass" :style="{ width: safePercent + '%' }"></div>
    </div>
    <span class="battery-text">{{ safePercent }}%</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  percent: {
    type: Number,
    default: null 
  }
});

const realBatteryLevel = ref(80); 
let batteryInstance = null; 

const safePercent = computed(() => {
  const level = props.percent !== null ? props.percent : realBatteryLevel.value;
  return Math.max(0, Math.min(100, Math.round(level)));
});

const statusClass = computed(() => {
  if (safePercent.value <= 20) return 'low';
  if (safePercent.value <= 40) return 'medium';
  return ''; 
});

onMounted(() => {
  if (props.percent !== null) return; 
  if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
      batteryInstance = battery;
      realBatteryLevel.value = battery.level * 100;
      battery.addEventListener('levelchange', handleLevelChange);
    }).catch(() => {});
  }
});

onUnmounted(() => {
  if (batteryInstance) {
    batteryInstance.removeEventListener('levelchange', handleLevelChange);
  }
});

const handleLevelChange = () => {
  if (batteryInstance) {
    realBatteryLevel.value = batteryInstance.level * 100;
  }
};
</script>

<style scoped>
.mini-battery-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 2px; /* 缩小间距 */
}

.battery-body {
  position: relative;
  /* 【修复核心】：将尺寸调整为浏览器能正常渲染的最小极限 12x6 */
  width: 6px;
  height: 3px;
  border: 1px solid #fff; 
  border-radius: 1px; /* 圆角同步缩小 */
  padding: 1px; /* 内边距缩小为 1px */
  box-sizing: content-box;
}

.battery-body::after {
  content: '';
  position: absolute;
  right: -1.5px; /* 正极位置微调 */
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 1.5px;
  background-color: #fff;
  border-radius: 0 1px 1px 0;
}

.battery-fill {
  height: 100%;
  /* 【修复核心】：圆角必须小于内部高度的一半，否则在低电量时显示异常 */
  border-radius: 0.5px; 
  background-color: #4caf50;
  transition: width 0.5s ease, background-color 0.5s ease;
}

.battery-fill.medium { background-color: #ff9800; }
.battery-fill.low { 
  background-color: #f44336;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.battery-text {
  font-size: 6px; /* 稍微调大一点字体，保证手机端可读性 */
  min-width: 10px;
  color: #fff;
}
</style>