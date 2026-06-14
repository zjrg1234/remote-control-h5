<template>
  <div class="landscape-page">
    <div class="page-content">
      <div class="bg">
        <video src=""></video>
      </div>
      <div class="logout" @click="logout">
        <img src="@/assets/images/icon_exit@2x.png" alt="" />
      </div>
      <div class="status-bar-capsule">
        <div class="flex">
          <!-- 左侧：信号强度图标 -->
          <div class="fl">
            <span class="dot"></span>
            <div class="car">
              <img src="@/assets/images/icon_car@2x.png" alt="" />
              <span class="mini-forbidden"></span>
            </div>
          </div>
          <div>
            <img src="@/assets/images/icon_battery@2x.png" alt="" />
            <span class="battery-text">{{ batteryPercentage }}%</span>
          </div>
          <div>
            <span class="time-text">|</span>
          </div>
          <div>
            <span class="time-text">{{ currentTime }}</span>
          </div>
        </div>
      </div>
      <div class="right-cont" @click="set">
        <img src="@/assets/images/icon_set@2x.png" alt="" />
      </div>

      <div class="side-menu-icon">

        <Ripple />

        <img src="@/assets/images/icon_sound_close@2x.png" v-if="!showSound" @click="showSound = true" alt="" />
        <img src="@/assets/images/icon_sound_open@2x.png" v-if="showSound" @click="showSound = false" alt="" />

      </div>
      <div class="side-menu">
        <!-- 菜单项列表 -->
        <div class="menu-item" v-for="(item, index) in menuList" :key="index" @click="handleIcon(item)">
          <img class="img" mode="scaleToFill" :src="activeKey.includes(item.key) ? item.iconSelect : item.icon" />
          <span class="label">{{ item.name }}</span>
        </div>
      </div>
      <div class="slider" v-show="showSpeed">
        <div class="slider-left">
          <van-slider v-model="value" active-color="#FFC838">
            <template #button>
              <div class="custom-button-slider">{{ value }} km/h</div>
            </template>
          </van-slider>
        </div>
      </div>

      <div class="time">
        <img src="@/assets/images/icon_time@2x.webp" alt="">
        <TimeClock></TimeClock>
      </div>

      <ALLPopup v-model:show="tipVisible" type="tip" :count="count" @action="handlePopupAction" />
      <ALLPopup v-model:show="logoutVisible" type="logout" @action="handlePopupAction" />
      <ALLPopup v-model:show="repairVisible" type="repair" :isShow="showRepairReason" @action="handlePopupAction" />
      <SetPopup v-model:show="setVisible" :type="carType" @action="handlePopupAction" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import ALLPopup from "./components/ALLPopup.vue";
import SetPopup from "./components/SetPopup.vue";
import Ripple from "./components/Ripple.vue";
import TimeClock from './components/TimeClock.vue';
import { formatTime } from "@/utils/utils";
import {
  ch1, speeds, cSpeeds, repairs, ch_selected,
  speeds_selected, cSpeeds_selected, after_diff,
  after_diff_selected,
  before_diff,
  before_diff_selected,
  light,
  light_selected
} from "./img.js";


const isLandscape = ref(true);
const tipVisible = ref(false);
const logoutVisible = ref(false);
const repairVisible = ref(false);
const batteryPercentage = ref(23);
const currentTime = ref();
const showSpeed = ref(false);
const showRepairReason = ref(false);
const count = ref(15);
const value = ref(5);
const setVisible = ref(false);
const showSound = ref(false);

const carType = ref('2')
const currentDate = ref()
// 检测屏幕方向
const checkOrientation = () => {
  isLandscape.value = window.innerWidth > window.innerHeight;
};



const menuList = ref([
  { name: "报修", icon: repairs, key: "repairs", iconSelect: repairs,  type: 1 },
  { name: "前差", icon: before_diff, key: "chBefore", iconSelect: before_diff_selected, type: 1 },
  { name: "后差", icon: after_diff, key: "chAfter", iconSelect: after_diff_selected, type: 1 },
  { name: "CH4", icon: ch1, key: "ch", iconSelect: ch_selected, type: 1 },
  { name: "高低速", icon: speeds, key: "highLowSpeed", iconSelect: speeds_selected, type: 1 },
  { name: "定速", icon: cSpeeds, key: "speed", iconSelect: cSpeeds_selected, type: 1 },
  { name: "", icon: light, key: "light", iconSelect: light_selected, type: 2 },
]);

onMounted(() => {
  checkOrientation();
  window.addEventListener("resize", checkOrientation);
  window.addEventListener("orientationchange", checkOrientation);

  // 2. 修复 const 不能重新赋值的 bug
  let timer = setInterval(() => {
    count.value -= 1;
    if (count.value <= 0) {
      count.value = 0;
      clearInterval(timer);
      timer = null;
    }
  }, 1000);

  let num = 1;
  let timer1 = setInterval(() => {
    currentTime.value = formatTime(++num);
  }, 1000);
});

const activeKey = ref([]);

const handleIcon = (item) => {
  console.log(item.key, activeKey.value)

  if (activeKey.value.includes(item.key)) {
    const index = activeKey.value.indexOf(item.key);

    // 如果定速 消失
    if (activeKey.value.includes('speed')) {
      showSpeed.value = false;
    }

    if (index > -1) {
      activeKey.value.splice(index, 1);
    }

  } else {
    activeKey.value.push(item.key);

    // 如果点击定速
    if (item.key == "speed") {
      showSpeed.value = true;
    }

  }


  if (item.key == "repairs") {
    showRepairReason.value = true;
    repairVisible.value = true;
    return;
  }


};

onUnmounted(() => {
  window.removeEventListener("resize", checkOrientation);
  window.removeEventListener("orientationchange", checkOrientation);
});

const handlePopupAction = (type) => {
  console.log(type);
  // 退出上报故障
  if (type == "report") {
    logoutVisible.value = false
    repairVisible.value = true;
    showRepairReason.value = false
  }
};



const isRippleActive = ref(false);

const triggerRipple = () => {
  // 1. 先移除 active 状态
  isRippleActive.value = false;

  // 2. 等待 DOM 更新后，再重新添加 active 状态，从而触发 CSS 动画
  nextTick(() => {
    isRippleActive.value = true;
  });
};

const set = () => {
  setVisible.value = true
}

const logout = () => {
  logoutVisible.value = true
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
  position: relative;
}

:deep(.custom-popup) {
  border-radius: 8px !important;
}

.bg {
  background: rgba(0, 0, 0, 0.3);
  height: 100%;
  position: relative;
}

.logout {
  width: 10px;
  height: 10px;
  position: absolute;
  z-index: 1;
  top: 5px;
  left: 10px;

  img {
    display: block;
  }
}

.right-cont {
  width: 10px;
  height: 10px;
  position: absolute;
  z-index: 1;
  top: 5px;
  right: 10px;

  img {
    display: block;
  }
}

/* 外层胶囊容器 */
.status-bar-capsule {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  /* 优化：使用 transform 替代负 margin，居中更精准 */
  padding: 0 5px;
  /* 优化：提供合适的上下和左右内边距 */
  box-sizing: border-box;
  white-space: nowrap;

  /* 内部内容区域：使用 flex 和 gap 实现等间距 */
  .flex {
    display: flex;
    align-items: center;
    gap: 5px;
    /* 核心：统一控制内部所有子元素的等间距 */
  }

  /* 左侧内容区域 */
  .fl {
    display: flex;
    align-items: center;
    gap: 2px;
    /* 信号点和车标之间的微小间距 */
  }

  .car {
    position: relative;

    .mini-forbidden {
      position: absolute;
      bottom: 1px;
      right: -1px;
    }
  }

  .dot {
    display: block;
    width: 2px;
    /* 优化：稍微调大一点，2px 在屏幕上可能看不清 */
    height: 2px;
    border-radius: 50%;
    background: #09ff77;
  }

  /* 电池及电量文字组合 */
  .flex>div:nth-child(2) {
    display: flex;
    align-items: center;
    gap: 2px;
    /* 电池图标与百分比文字之间的微小间距 */
  }

  /* 图片基础样式优化 */
  .flex img {
    display: block;
    width: 8px;
    /* 优化：6px 偏小，建议 8px 或 10px */
    height: 8px;
  }

  /* 文字样式统一 */
  .battery-text,
  .time-text {
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    color: #ffffff;
    font-size: 6px;
    line-height: 1;
  }
}


// 在 style 中定义
.mini-forbidden {
  display: inline-block;
  width: 4px;
  height: 4px;
  border: 1px solid #ff4d4f; // 红色边框
  border-radius: 50%; // 圆形
  position: relative;

  // 中间的斜杠
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 3px; // 稍微长一点，穿透边框
    height: 1px;
    background: #ff4d4f;
    transform: translate(-50%, -50%) rotate(45deg);
  }
}

.side-menu-icon {
  position: fixed;
  top: 20px;
  right: 30px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;

  img {
    display: block;
    width: 10px;
    height: 10px;
  }

}

.side-menu {
  // 1. 整体容器样式
  position: fixed;
  top: 18px;
  right: 7px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: rgba(20, 20, 20, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 5px 1px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.menu-item {
  // 2. 单个菜单项布局
  display: flex;
  flex-direction: column; // 图标在上，文字在下
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 1;

  .img {
    display: block;
    width: 6px;
    height: 6px;
  }

  .label {
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 5px;
    color: #ffffff;
    white-space: nowrap; // 防止文字换行
    text-align: center;
  }
}

.slider {
  position: absolute;
  z-index: 1;
  top: 105px;
  right: 24px;
  width: 50px;
}

.custom-button-slider {
  width: 1px;
  color: #fff;
  font-size: 5px;
  line-height: 6px;
  text-align: center;
  background-color: #ffc838;
  border-radius: 1px;
}

.time {
  position: absolute;
  font-size: 6px;
  bottom: 5px;
  left: 10px;
  display: flex;
  align-items: center;
  img {
    display: block;
    width: 5px;
    height: 5px;
    margin-right: 2px;
  }
}
</style>
