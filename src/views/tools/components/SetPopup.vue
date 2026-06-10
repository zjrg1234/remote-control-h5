<template>
  <van-popup v-model:show="visible" :close-on-click-overlay="false" position="right" teleport="body" round
    class="custom-popup-right" :style="{ width: '60%', height: '100%' }">

    <div class="cont">
      <div class="left">
        <div class="group" v-if="selectedIndex == 0">

          <div class="group-item">
            <p class="tit">视频清晰度</p>
            <div class="flex">
              <span v-for="(item, index) in qualityList" :key="index" class="btn-quality"
                :class="{ active: currentQuality === item.value }" @click="handleSelect(item.value)">
                {{ item.label }}
              </span>
            </div>
          </div>

          <div class="group-item">
            <p class="tit">操作设置</p>
            <div class="flex">
              <div v-for="(mode, index) in steeringModes" :key="index" class="option-card"
                :class="{ 'is-active': selectedMode === mode.id }" @click="handleSetSelect(mode.id)">
                <!-- 右上角的黄色对勾 (仅当选中时显示) -->
                <div v-if="selectedMode === mode.id" class="check-mark">
                  <svg viewBox="0 0 1024 1024" width="16" height="16">
                    <path
                      d="M406.666667 805.333333l-256-256 60.330666-60.330666L406.666667 684.373333l406.997333-406.997333 60.330667 60.330667z"
                      fill="#f5c542"></path>
                  </svg>
                </div>

                <!-- 布局区域：根据配置交换左右顺序 -->
                <div class="content-layout" :class="{ 'reverse-layout': mode.isReverse }">
                  <!-- 左侧/第一组图标 -->
                  <div class="icon-group">
                    <div class="icon-row vertical">
                      <IconArrowUp />
                      <IconArrowDown />
                    </div>
                    <span class="label">前进/后退</span>
                  </div>

                  <!-- 右侧/第二组图标 -->
                  <div class="icon-group">
                    <div class="icon-row horizontal">
                      <IconArrowLeft />
                      <IconArrowRight />
                    </div>
                    <span class="label">左转/右转</span>
                  </div>
                </div>
              </div>
            </div>

          </div>



        </div>


      </div>
      <div class="right">

        <div class="settings-bar">
          <div class="text-area">设置</div>
          <div class="close-btn" @click="close">
            <img src="@/assets/images/icon_close@2x.webp" alt="">
          </div>
        </div>
        <div class="setting-group" v-for="(item, index) in setGroup" :key="index">
          <div class="setting-item" :class="{ active: selectedIndex == item.key }" @click="handleItem(index)">
            {{ item.name }}
          </div>
          <div class="gradient-line" v-if="selectedIndex == item.key"></div>
        </div>
      </div>
    </div>

  </van-popup>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  arrowUp,
  arrowDown,
  arrowLeft,
  arrowRight
} from "../img.js"
const props = defineProps({
  show: { type: Boolean, default: false },

})

const setGroup = ref([
  { name: '通用设置', key: 0 },
  { name: '车辆微调', key: 1 },
  { name: '遥控模式', key: 2 }
]);
const selectedIndex = ref(0)

const emit = defineEmits(['update:show', 'action'])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const close = () => {
  visible.value = false
}
const handleItem = (index) => {
  selectedIndex.value = index;
};


const qualityList = [
  { label: '超清', value: '1' }, // 默认选中项
  { label: '高清', value: '2' },
  { label: '标清', value: '3' }
];

const currentQuality = ref('1');

// 3. 处理点击事件
const handleSelect = (value) => {
  currentQuality.value = value;
};

const selectedMode = ref('mode1');

// 定义两种模式的配置数据
const steeringModes = [
  { id: 'mode1', isReverse: false }, // 正常布局
  { id: 'mode2', isReverse: true },  // 反转布局
];

// 点击切换逻辑
const handleSetSelect = (id) => {
  selectedMode.value = id;
};


const iconConfig = {
  width: '12px',
  height: '12px',
  style: 'object-fit: contain;'
};
const IconArrowUp = () => h('img', { src: arrowUp, ...iconConfig });
const IconArrowDown = () => h('img', { src: arrowDown, ...iconConfig });
const IconArrowLeft = () => h('img', { src: arrowLeft, ...iconConfig });
const IconArrowRight = () => h('img', { src: arrowRight, ...iconConfig });

import { h } from 'vue';

</script>

<style lang="scss" scoped>
.cont {
  display: flex;
  display: flex;
  width: 100%;
}

.left {
  width: 80%;
  /* 可以添加背景色或内边距方便查看效果 */
  background-color: #f0f0f0;

  box-sizing: border-box;

  border-right: 1px solid #fff;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0rpx 0rpx 0rpx 0rpx rgba(255, 255, 255, 0.3);
}

.right {
  width: 20%;
  height: 100vh;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.8);

  .settings-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #ffffff;
    padding: 4px;
    width: 100%;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(255, 255, 255, 0.4);

    .text-area {
      flex: 1;
      text-align: center;
      font-family: PingFangSC, PingFang SC;
      font-weight: 500;
      font-size: 7px;
      letter-spacing: 2;
      color: #FFFFFF;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
    }


    .close-btn img {
      display: block;
      width: 12px;
      height: 12px;
    }
  }


  .setting-group {
    border-bottom: 1px solid #87878766;
    padding-bottom: 2px;

    .setting-item {
      font-family: PingFangSC, PingFang SC;
      font-weight: 500;
      font-size: 7px;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1;
      text-align: center;
      font-style: normal;
      padding: 5px 0;
    }

    .active {
      color: #FFC838;
    }

    .gradient-line {
      height: 1px;
      /* 线条的高度/粗细 */
      width: 100%;
      /* 线条长度 */

      /* 关键代码：创建线性渐变 */
      background: linear-gradient(to right,
          /* 方向：从左到右 */
          transparent,
          /* 起点：完全透明 */
          rgba(245, 197, 66, 0.8) 20%,
          /* 20%处开始显色 */
          #f5c542 50%,
          /* 中间：颜色最深 (#f5c542 是取样的金黄色) */
          rgba(245, 197, 66, 0.8) 80%,
          /* 80%处开始变淡 */
          transparent
          /* 终点：完全透明 */
        );

      margin: 0 auto;
      /* 居中显示 */
    }
  }
}

.left {
  padding: 5px;

  .group-item {
    margin-bottom: 8px;

    .tit {
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 7px;
      color: #FFFFFF;
    }
  }

  .flex {
    display: flex;
    gap: 12px;
    padding-top: 5px;
  }

  .btn-quality {
    background: transparent;
    border: 1px solid #f5c542;
    color: #f5c542;
    padding: 1px 5px;
    border-radius: 2px;
    font-size: 7px;
    cursor: pointer;
    transition: all 0.3s ease;
    outline: none;
  }

  .btn-quality.active {
    background-color: #f5c542;
    color: #000000;
    font-weight: bold;
    border-color: #f5c542;
  }

  .option-card {
    position: relative;
    width: 65px;
    height: 35px;
    border: 0.25px solid rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    background-color: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .option-card:hover {
    border-color: rgba(255, 255, 255, 0.6);
  }

  .option-card.is-active {
    border: 0.5px solid #f5c542;
    background-color: rgba(245, 197, 66, 0.05);
  }

  .check-mark {
    position: absolute;
    top: -0.25px;
    right: -0.25px;
    width: 0;
    height: 0;
    border: none;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 7.5px 7.5px 0;
    border-color: transparent #f5c542 transparent transparent;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    overflow: hidden;
  }

  .check-mark svg {
    position: absolute;
    top: 0.5px;
    right: 0.5px;
    transform: rotate(0deg);
  }

  .content-layout {
    display: flex;
    width: 100%;
    height: 100%;
    padding: 2.5px;
    box-sizing: border-box;
  }

  .reverse-layout {
    flex-direction: row-reverse;
  }

  .icon-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .icon-row {
    display: flex;
    gap: 2px;
    margin-bottom: 1px;
  }

  .icon-row.vertical {
    flex-direction: column;
  }

  .icon-row.horizontal {
    flex-direction: row;
  }

  .label {
    font-size: 3px;
    color: #ccc;
    margin-top: 1px;
  }

  .is-active .label {
    color: #fff;
  }
}
</style>

<style>
.custom-popup-right {
  border-radius: 0px !important;
}
</style>