<template>
  <div class="cover-bat-cont">
    <div class="battery">
      <div class="slider-track">
        <div
          class="battery-fill"
          :class="statusClass"
          :style="{ width: modelValue + '%' }"
        ></div>
      </div>
      <div class="battery-tip"></div>
    </div>

    <div class="battery-text">{{ modelValue }}%</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Number, default: 0 },
});

const emit = defineEmits(['update:modelValue', 'change']);

// 根据电量返回对应样式类
const statusClass = computed(() => {
  if (props.modelValue <= 20) return 'low';
  if (props.modelValue <= 60) return 'medium';
  return '';
});
</script>

<style lang="scss" scoped>
.cover-bat-cont {
  width: 60px;
  height: 12px;
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  touch-action: none;
  user-select: none;

  .battery {
    width: 25px;
    position: relative;
  }

  .slider-track {
    position: relative;
    width: 23px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid #fff;
    box-sizing: border-box;
    overflow: hidden;
    background-color: transparent;
  }

  .battery-tip {
    position: absolute;
    right: 0;
    top: 3px;
    width: 2px;
    height: 6px;
    background-color: #ffffff;
    border-radius: 0 2px 2px 0;
  }

  .battery-fill {
    height: 100%;
    border-radius: 1px;
    background-color: #4caf50;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  .battery-fill.medium {
    background-color: #ff9800;
  }

  .battery-fill.low {
    background-color: #f44336;
  }

  .battery-text {
    position: absolute;
    right: 0;
    font-size: 10px;
    min-width: 25px;
    color: #ffffff;
    padding-left: 3px;
  }
}
</style>