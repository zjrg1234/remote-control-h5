<template>
  <van-popup v-model:show="visible" :close-on-click-overlay="false" position="right" teleport="body" round
    class="custom-popup-right" :style="{ width: '60%', height: '100%' }">

    <div class="cont">
      <div class="left"></div>
      <div class="right">

        <div class="popup-header">
          <h2>设置</h2>
        </div>
        <div class="setting-group">
          <div class="setting-item" onclick="handleItem(1)">
            <span class="setting-label">通用设置</span>
            <span class="setting-value"></span>
          </div>
        </div>

        <!-- 车辆微调 -->
        <div class="setting-group">
          <div class="setting-item" onclick="handleItem(2)">
            <span class="setting-label">车辆微调</span>
            <span class="setting-value"></span>
          </div>
        </div>

        <!-- 遥控模式 -->
        <div class="setting-group">
          <div class="setting-item" onclick="handleItem(3)">
            <span class="setting-label">遥控模式</span>
            <span class="setting-value"></span>
          </div>
        </div>


      </div>
    </div>

  </van-popup>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },

})



const emit = defineEmits(['update:show', 'action'])

// 实现 v-model:show 双向绑定
const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const openSettings = () => {
  showSettings.value = true;
};
const closeSettings = () => {
  showSettings.value = false;
};

// 3. 各设置项的点击处理逻辑（根据业务需求扩展）
const handleGeneralSettings = () => {
  console.log('进入【通用设置】页面');
  // 示例：路由跳转（需配合 vue-router）
  // router.push('/general-settings');
};

const handleVehicleTuning = () => {
  console.log('进入【车辆微调】页面');
  // router.push('/vehicle-tuning');
};

const handleItem = () => {
  console.log('进入【遥控模式】页面');
  // router.push('/remote-mode');
};

</script>

<style lang="scss" scoped>
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.popup-header h2 {
  margin: 0;
  font-size: 18px;
}
</style>

<style>
.custom-popup-right {
  border-radius: 0px !important;
}
</style>