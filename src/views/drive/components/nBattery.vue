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
    </div>

    <div class="battery-text">{{ modelValue }}</div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Number, default: 50 },
});

const emit = defineEmits(["update:modelValue", "change"]);

// 根据电量返回对应样式类
const statusClass = computed(() => {
  if (props.modelValue <= 20) return "low";
  if (props.modelValue <= 60) return "medium";
  return "";
});
</script>

<style lang="scss" scoped>
.cover-bat-cont {
  width: 30px;
  height: 30px;
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  touch-action: none;
  user-select: none;
  margin-left: 5px;
  
  
  .battery {
    width: 100%;
    position: relative;
  }

  .slider-track {
    position: relative;
    width: 30px;
    height: 30px;
    box-sizing: border-box;
    overflow: hidden;
    background-color: transparent;
    background: url("@/assets/images/icon_battery@2x.png") center / cover
      no-repeat;
  }


  .battery-fill {
    height: 14px;
    border-radius: 1px;
    background-color:   #98BEFF;
    transition: width 0.3s ease, background-color 0.3s ease;
    margin-top: 8px;
    margin-left: 2px;
  }

  .battery-fill.medium {
    background-color: #EEFEFE;
  }

  .battery-fill.low {
    background-color: #f44336;
  }

  .battery-text {
    position: absolute;
    width: 28px;
    font-family: PingFangSC, PingFang SC;
    font-weight: 500;
    font-size: 12px;
    color: #1A1A1A;
    text-align: center;

  }
}
</style>
