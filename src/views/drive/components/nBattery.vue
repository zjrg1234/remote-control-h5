<template>
  <div class="cover-bat-cont">
    <div class="battery">
      <div class="slider-track">
        <!-- 👇 新增内部区域容器 -->
        <div class="battery-inner">
          <div
            class="battery-fill"
            :class="statusClass"
            :style="{ width: modelValue + '%' }"
          ></div>
        </div>
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

  /* 电池外壳 */
  .slider-track {
    position: relative;
    width: 30px;
    height: 30px;
    box-sizing: border-box;
    background: url('@/assets/images/icon_battery@2x.png') center / cover no-repeat;
    /* 注意：这里不要 overflow: hidden，否则会裁掉外层图标 */
  }

  /* 👇 电池内部"电池格"区域（关键） */
  .battery-inner {
    position: absolute;
    /* 调整这四个值，让内部区域刚好落在电池图标的空槽里 */
    left: 3px;
    top: 8px;
    right: 5px;      /* 右侧留出电池"正极"凸起的位置 */
    height: 14px;

    overflow: hidden;         /* 关键：内部裁剪，防止填充溢出 */
    border-radius: 1px;
    box-sizing: border-box;
  }

  /* 电量填充条 */
  .battery-fill {
    height: 100%;
    width: 0;
    background-color: #98beff;
    border-radius: 1px;
    transition: width 0.3s ease, background-color 0.3s ease;
    /* 确保填充不会因任何原因超出 */
    max-width: 100%;
    box-sizing: border-box;

    &.medium {
      background-color: #eefefe;
    }

    &.low {
      background-color: #f44336;
    }
  }

  /* 文字 */
  .battery-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 28px;
    font-family: PingFangSC, PingFang SC;
    font-weight: 500;
    font-size: 12px;
    color: #1a1a1a;

    pointer-events: none;
    padding-left: 1px;
  }
}
</style>