<template>
  <!-- 触发按钮（实际项目中替换为业务入口） -->
  <van-button type="primary" @click="openSettings">打开设置</van-button>

  <!-- 半屏设置面板 -->
  <van-popup
    v-model:show="showSettings"
    position="bottom"
    :style="{ height: '50vh' }"
    round
  >
    <div class="settings-container">
      <!-- 标题栏 -->
      <div class="header">
        <span class="title">APP遥控设置</span>
        <van-icon name="cross" size="20" @click="closeSettings" />
      </div>

      <!-- 表单项列表 -->
      <div class="form-list">
        <!-- 方向中位微调 -->
        <div class="form-item">
          <span class="label">方向中位微调</span>
          <div class="slider-group">
            <van-button icon="minus" plain size="mini" @click="adjust('mid', -50)" />
            <van-slider
              v-model="midValue"
              :min="500"
              :max="1500"
              active-color="#FFC107"
              inactive-color="#E0E0E0"
            />
            <van-button icon="plus" plain size="mini" @click="adjust('mid', 50)" />
          </div>
          <van-button type="warning" size="small" @click="save('mid')">保存</van-button>
        </div>

        <!-- 方向力度微调 -->
        <div class="form-item">
          <span class="label">方向力度微调</span>
          <div class="slider-group">
            <van-button icon="minus" plain size="mini" @click="adjust('force', -5)" />
            <van-slider
              v-model="forceValue"
              :min="0"
              :max="75"
              active-color="#FFC107"
              inactive-color="#E0E0E0"
            />
            <van-button icon="plus" plain size="mini" @click="adjust('force', 5)" />
          </div>
          <van-button type="warning" size="small" @click="save('force')">保存</van-button>
        </div>

        <!-- 油门力度微调 -->
        <div class="form-item">
          <span class="label">油门力度微调</span>
          <div class="slider-group">
            <van-button icon="minus" plain size="mini" @click="adjust('throttle', -2)" />
            <van-slider
              v-model="throttleValue"
              :min="0"
              :max="40"
              active-color="#FFC107"
              inactive-color="#E0E0E0"
            />
            <van-button icon="plus" plain size="mini" @click="adjust('throttle', 2)" />
          </div>
          <van-button type="warning" size="small" @click="save('throttle')">保存</van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { showToast } from 'vant'; // Vant4 按需引入提示组件

// 控制弹窗显示
const showSettings = ref(false);

// 滑块初始值（对应原图：1000、60、40）
const midValue = ref(1000);
const forceValue = ref(60);
const throttleValue = ref(40);

// 打开/关闭设置面板
const openSettings = () => (showSettings.value = true);
const closeSettings = () => (showSettings.value = false);

/**
 * 滑块微调逻辑（点击 ± 按钮时调用）
 * @param type 滑块类型（mid/force/throttle）
 * @param step 调整步长（负数左调，正数右调）
 */
const adjust = (type: string, step: number) => {
  const valueMap = { mid: midValue, force: forceValue, throttle: throttleValue };
  const target = valueMap[type];
  if (target) {
    target.value += step;
    // 限制在 min-max 范围内（Vant Slider 会自动处理，但手动兜底更稳）
    const minMax = {
      mid: [500, 1500],
      force: [0, 75],
      throttle: [0, 40]
    }[type]!;
    target.value = Math.max(minMax[0], Math.min(minMax[1], target.value));
  }
};

/**
 * 保存逻辑（模拟接口请求）
 * @param type 要保存的滑块类型
 */
const save = async (type: string) => {
  try {
    // 模拟 API 请求（实际项目替换为真实接口）
    await new Promise(resolve => setTimeout(resolve, 500));
    showToast(`${type} 保存成功`);
  } catch (error) {
    showToast('保存失败');
  }
};
</script>
<style scoped>
/* 设置面板容器 */
.settings-container {
  padding: 16px;
  background: #fff;
  height: 100%; /* 继承 van-popup 的 50vh 高度 */
  box-sizing: border-box;
}

/* 标题栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;
}

/* 表单项列表 */
.form-list {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 表单项间距 */
}

/* 单个表单项 */
.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: #333;
}

/* 滑块+按钮组 */
.slider-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 覆盖 Vant Slider 默认样式（可选，增强视觉一致性） */
.van-slider {
  flex: 1; /* 让滑块占满剩余空间 */
}
</style>