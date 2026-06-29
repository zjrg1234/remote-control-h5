<template>
  <div class="landscape-page">
    <div class="page-content">
      <div class="bg">
        <iframe src=""></iframe>
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
            <battery :percent="40"></battery>
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
          <!-- <van-slider v-model="constSpeed" active-color="#FFC838">
            <template #button>
              <div class="custom-button-slider">{{ constSpeed }} km/h</div>
            </template>
</van-slider> -->
          <div class="slider-wrapper">
            <div class="slider-label">
              <div class="num" :style="{ left: constSpeed + '%' }">
                {{ constSpeed }} km/h
              </div>
            </div>
            <van-slider v-model="constSpeed" :min="1" :max="100" @change="changeConstSpeed" active-color="#f5c542">
              <template #button>
                <div class="custom-sider-img">
                  <img src="@/assets/images/icon_sider@2x.webp" alt="" />
                </div>
              </template>
            </van-slider>
            <div class="slider-label-bottom">
              <div class="num-text num-left">
                0
              </div>
              <div class="num-text num-right">
                100
              </div>
            </div>
          </div>
        </div>
      </div>

      <LeftRight @action="handleLRDrive" :isLeft="operMode"></LeftRight>

      <UpDown @action="handleFBDrive" :isLeft="!operMode"></UpDown>

      <div class="time">
        <img src="@/assets/images/icon_time@2x.webp" alt="" />
        <TimeClock></TimeClock>
      </div>

      <ALLPopup ref="allPopup" v-model:show="allPopupVisible" type="tip" :orderNo="orderNo"
        :vehicleId="vehicleId" :isShow="showRepairReason" @action="handlePopupAction" />
      <!-- <ALLPopup
        v-model:show="allPopupVisible"
        type="logout"
        :orderNo="orderNo"
        :vehicleId="vehicleId"
        :isShow="showRepairReason"
        @action="handlePopupAction"
      />
      <ALLPopup
        v-model:show="allPopupVisible"
        type="repair"
        :orderNo="orderNo"
        :vehicleId="vehicleId"
        :isShow="showRepairReason"
        @action="handlePopupAction"
      /> -->
      <SetPopup v-model:show="setVisible" :videoDefinition="videoDefinition" :operFB="operFB"
        :directionCenter="directionCenter" :acceleratorDynamics="acceleratorDynamics"
        :directionDynamics="directionDynamics" :operDir="operDir" :type="carType" @action="handleOper"
        @operAction="handleFBDir" @changeValue="changeVal" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { showToast } from "vant";
import { StartDrive } from "@/api/index";
import { LoginTop } from "@/api/video";

import ALLPopup from "./components/ALLPopup.vue";
import SetPopup from "./components/SetPopup.vue";
import Ripple from "./components/Ripple.vue";
import TimeClock from "./components/TimeClock.vue";
import battery from "./components/battery.vue";
import UpDown from "./components/UpDown.vue";
import LeftRight from "./components/LeftRight.vue";
import { formatTime, mapToPer } from "@/utils/utils";
import { getWebSocket } from "@/utils/socket";
import { handleDriverSocketData } from "@/utils/socketHelper";
import { encryptAES } from "@/utils/crypto";

import { CarControlHandler } from "./control/siqu.js";


import {
  ch1,
  speeds,
  cSpeeds,
  repairs,
  ch_selected,
  speeds_selected,
  cSpeeds_selected,
  after_diff,
  after_diff_selected,
  before_diff,
  before_diff_selected,
  light,
  light_selected,
} from "./img.js";

// 点击设置， 选中前差等全部重置最初状态
// 设置里的数据都是车辆详情carDetails接口拿本地
// 退出延迟2s中 发送中位值
// 方向设置 要发送ws信息s
const route = useRoute();
const isLandscape = ref(true);
const allPopupVisible = ref(true);

const currentTime = ref();
const showSpeed = ref(false);
const showRepairReason = ref(false);
const constSpeed = ref(1);
const setVisible = ref(false);
const showSound = ref(false);

// 车辆类型 是四驱车还是挖机 车辆类型 vehicle_type 10-19四驱车、20-29挖机、30-39推土机
const carType = ref("1");
const timerNum = ref();
const ws = ref();
const orderNo = ref();
const vehicleId = ref();
const operMode = ref(false); // 操作模式
const operFB = ref(0); // 操作前后 正常0 反向1
const operDir = ref(0); // 操作方向 正常0 反向1
const directionCenter = ref();
const directionDynamics = ref();
const acceleratorCenter = ref();
const acceleratorDynamics = ref();
const allPopup = ref()


// 进入页面3s 定时器，拿中位值发不停发 0.04
// 调三方接口，显示video
// 摄像头 前置后置 要判断一下
// 按次计费 30s 发一次 继续驾驶请求。剩余20s有若提示。剩余5s 弹窗提示结束。同时发送中位值。（停车）
// 退出，再发送2s 中位值。
// 按时间计费，eg：1分2电池，有11个电池。只能玩5分钟 3。0s 发一次 继续驾驶请求。剩余20s有若提示。剩余5s 弹窗提示结束。同时发送中位值。（停车）
// 显示弹窗，发送中位值。
// 180s 未操作 弹窗 

const chValue = ref({
  ch1: "",
  ch2: "",
  ch3: "",
  ch4: "",
  ch5: "",
  ch6: "",
  ch7: "",
  ch8: "",
});

// 检测屏幕方向
const checkOrientation = () => {
  isLandscape.value = window.innerWidth > window.innerHeight;
};

const menuList = ref([
  { name: "报修", icon: repairs, key: "repairs", iconSelect: repairs, type: 1 },
  {
    name: "前差",
    icon: before_diff,
    key: "chBefore",
    iconSelect: before_diff_selected,
    type: 1,
  },
  {
    name: "后差",
    icon: after_diff,
    key: "chAfter",
    iconSelect: after_diff_selected,
    type: 1,
  },
  { name: "CH4", icon: ch1, key: "ch4", iconSelect: ch_selected, type: 1 },
  {
    name: "高低",
    icon: speeds,
    key: "highLowSpeed",
    iconSelect: speeds_selected,
    type: 1,
  },
  {
    name: "定速",
    icon: cSpeeds,
    key: "speed",
    iconSelect: cSpeeds_selected,
    type: 1,
  },
  { name: "", icon: light, key: "light", iconSelect: light_selected, type: 2 },
]);
const carDetails = ref();
const videoDefinition = ref("1");
const carHandler = ref();

onUnmounted(() => {
  window.removeEventListener("resize", checkOrientation);
  window.removeEventListener("orientationchange", checkOrientation);
  clearInterval(timerNum.value);
  clearInterval(timerSendMsg.value)
});

const timerSendMsg = ref();

onMounted(() => {
  checkOrientation();
  window.addEventListener("resize", checkOrientation);
  window.addEventListener("orientationchange", checkOrientation);



  let num = 1;
  timerNum.value = setInterval(() => {
    currentTime.value = formatTime(++num);
  }, 1000);

  orderNo.value = route.query.order_no || "";
  vehicleId.value = route.query.vehicle_id || "";
  carDetails.value = JSON.parse(localStorage.carDetails);
  videoDefinition.value = carDetails.value.video_definition;
  // 四驱车
  if (
    carDetails.value.vehicle_type >= 10 &&
    carDetails.value.vehicle_type <= 19
  ) {
    carType.value = "1";
  }
  // 挖机
  if (
    carDetails.value.vehicle_type >= 20 &&
    carDetails.value.vehicle_type <= 29
  ) {
    carType.value = "2";
  }
  operFB.value = carDetails.value.reverse_left_right;
  operDir.value = carDetails.value.reverse_up_down;
  directionCenter.value = carDetails.value.direction_center; // 方向中位
  directionDynamics.value = carDetails.value.direction_dynamics; // 方向力度
  acceleratorCenter.value = carDetails.value.accelerator_center; // 油门中位
  acceleratorDynamics.value = carDetails.value.accelerator_dynamics; // 油门

  // 除了ch3～ch8 拿开关值
  chValue.value.ch3 =
    carDetails.value.vehicle_config_detail.ch3.close_value.current_value;
  chValue.value.ch4 =
    carDetails.value.vehicle_config_detail.ch4.close_value.current_value;
  chValue.value.ch5 =
    carDetails.value.vehicle_config_detail.ch5.close_value.current_value;
  chValue.value.ch6 =
    carDetails.value.vehicle_config_detail.ch6.close_value.current_value;
  chValue.value.ch7 =
    carDetails.value.vehicle_config_detail.ch7.close_value.current_value;
  chValue.value.ch8 =
    carDetails.value.vehicle_config_detail.ch8.close_value.current_value;

  chValue.value.ch1 = directionCenter.value.current_value;
  chValue.value.ch2 = acceleratorCenter.value.current_value;
  console.log(chValue.value);

  carHandler.value = new CarControlHandler({
    reverseUpDownState: operFB.value == 0 ? false : true,
    reverseLeftRightState: operDir.value == 0 ? false : true,
    ch1: directionCenter.value.current_value, // 方向
    ch2: acceleratorDynamics.value.current_value, // 进退 油门// 1,3 进退油门
    0: { ...directionCenter.value },
    1: { ...carDetails.value.accelerator_center },
    2: { ...directionDynamics.value },
    3: { ...acceleratorDynamics.value },
  });

  const url = localStorage.wssUrl;
  const port = localStorage.wssPort;
  const wsUrl = "ws://" + url + ":" + port;
  ws.value = getWebSocket("ws://zksjtest.zksjyk.cn/ws", {
    maxReconnectCount: 5, // 最大重连次数
    reconnectInterval: 3000, // 基础重连间隔（实际会乘以重连次数）
    heartBeatInterval: 30000, // 心跳间隔（毫秒）
  });
  ws.value.connect();

  // ws.value.onOpen((event) => {
  //   console.log("连接成功，可以开始发送消息了！");
  //   // ws.value.send();
  // });

});

watch(() => chValue.value, (val) => {
  // 0.04 发一次数据
  timerSendMsg.value = setInterval(() => {
    const val = handleDriverSocketData(carDetails.value.app_transmitter_id, chValue.value.ch1,
      chValue.value.ch2, chValue.value.ch3, chValue.value.ch4, chValue.value.ch5, chValue.value.ch6, chValue.value.ch7, chValue.value.ch8)
    ws.value.send(val);
  }, 3000);
}, { immediate: true, deep: true });

const activeKey = ref([]);

const handleIcon = (item) => {

  // 点击维修，显示上报原因，把原因显示出来
  if (item.key === "repairs") {
    allPopupVisible.value = true;
    allPopup.value.setType('repair', true)
    return;
  }

  // 2. 提取通道控制逻辑，避免重复代码
  const updateChannel = (key, chKey) => {
    if (item.key === key) {
      const config = carDetails.value.vehicle_config_detail[chKey];
      // 根据当前状态决定读取 open_value 还是 close_value
      const valueObj = activeKey.value.includes(item.key)
        ? config.close_value
        : config.open_value;

      chValue.value[chKey] = valueObj.current_value;
      console.log(`发送 ${key} 消息:`, valueObj.current_value);
    }
  };

  // 统一调用通道更新
  updateChannel("chBefore", "ch5");
  updateChannel("chAfter", "ch6");
  updateChannel("ch4", "ch4");
  updateChannel("highLowSpeed", "ch3");

  // 3. 处理菜单激活/取消激活状态
  const index = activeKey.value.indexOf(item.key);

  if (index > -1) {
    // 当前已激活 -> 取消激活
    activeKey.value.splice(index, 1);

    // 修复Bug：只有当点击的是 speed 时，才隐藏定速UI
    if (item.key === "speed") {
      showSpeed.value = false;
    }
  } else {
    // 当前未激活 -> 激活
    activeKey.value.push(item.key);

    if (item.key === "speed") {
      showSpeed.value = true;
    }
  }

  console.log(chValue.value);
};

const handlePopupAction = (type) => {
  console.log(type);
  // 退出上报故障
  if (type == "report") {
    allPopupVisible.value = false;
    showRepairReason.value = false;
    return;
  }

  // 有维修原因的
  if (type == "repair") {

    allPopupVisible.value = true;
    showRepairReason.value = true;
    return;
  }

  if (type == "driving") {
    StartDrive({
      order_no: orderNo.value,
      type: 1,
      vehicle_id: vehicleId.value,
    })
      .then((res) => {
        if (res.code != 200) {
          allPopupVisible.value = false;

          showToast(res.msg);
        } else {
          allPopupVisible.value = false;
        }
      })
      .catch();
  }
};

const handleOper = (type) => {
  console.log(type);
  operMode.value = type == 'mode2' ? true : false; // 操作模式 箭头上下 在左

  if (carType.value == 1) {


  } else {
  }
};

// 前后 左右是否反向 正常0 反向 1
const handleFBDir = (val) => {
  const arr = val.split("_");
  if (arr[0] == 1) {
    operFB.value = arr[1] === "true" ? 1 : 0;
    return;
  }

  if (arr[0] == 2) {
    operDir.value = arr[1] === "true" ? 1 : 0;
    return;
  }
};

// 加减传值以及关闭
const changeVal = (value) => {
  console.log(value);
  // 1是方向中位值 2是方向力度  3是油门
  directionCenter.value.current_value = value[1];
  directionDynamics.value.current_value = value[2];
  acceleratorDynamics.value.current_value = value[3];
  carHandler.value.setConfigValue({
    0: { ...directionCenter.value },
    2: { ...directionDynamics.value },
    3: { ...acceleratorDynamics.value },
  });
};

const set = () => {
  setVisible.value = true;
  // 点击退出，定速消失 重置车辆
  showSpeed.value = false
  handleFBDrive({ fb: false, value: 0 })
  handleIcon("speed")
};

const logout = () => {
  allPopup.value.setType('logout')

  allPopupVisible.value = true;
  // 点击退出，定速消失 重置车辆
  showSpeed.value = false
  handleFBDrive({ fb: false, value: 0 })
  handleIcon("speed")
};

// 前进后退
const handleFBDrive = (item) => {
  showSpeed.value = false
  let type = "";
  let ratioValue = 0;
  if (item.fb == true) {
    type = "upType";
    ratioValue = mapToPer(Math.abs(item.value));
  }
  if (item.fb == false) {
    if (item.value == 0) {
      type = "endType";
      chValue.value.ch2 = acceleratorCenter.value.current_value;
    } else {
      type = "downType";
      ratioValue = mapToPer(Math.abs(item.value));
    }
  }

  carHandler.value.handleTwoDirectionControlChannel(true, type, ratioValue);
};

const changeConstSpeed = () => {
  carHandler.value.handleTwoDirectionControlChannel(true, 'upType', constSpeed.value / 100);
}
// 左右
const handleLRDrive = (item) => {

  let type = "endType";
  let ratioValue = 0;
  if (item.lr == true) {
    console.log("向左", mapToPer(item.value));
    ratioValue = mapToPer(Math.abs(item.value));
    type = "leftType";
  }
  if (item.lr == false) {
    if (item.value == 0) {
      console.log("停止", 0);
      chValue.value.ch1 = directionCenter.value.current_value;
    } else {
      console.log("向右", mapToPer(item.value));
      ratioValue = mapToPer(Math.abs(item.value));
      type = "rightType";
    }
  }

  carHandler.value.handleTwoDirectionControlChannel(false, type, ratioValue);
  console.log(carHandler.value.ch1);
};
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
  right: 8px;

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
  top: 25px;
  right: 7px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
    margin-bottom: 1px;
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
  top: 110px;
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
  bottom: 3px;
  left: 10px;
  display: flex;
  align-items: center;
  opacity: 0.8;

  img {
    display: block;
    width: 5px;
    height: 5px;
    margin-right: 2px;
  }
}

.icon-wrapper :deep(svg) {
  width: 8px;
  height: 8px;
  fill: #fff;
  /* Vant 4 的主题色 */
}



.slider-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 40px;

  .num {
    position: absolute;
    top: 5px;
    transform: translateX(-50%);
    /* 关键：让标签的中心点对齐 left 值，实现完美居中 */
    color: #fff;
    font-size: 6px;
    white-space: nowrap;
    /* 防止数字换行 */
    pointer-events: none;
    text-align: left;
    /* 防止标签拦截鼠标的拖拽事件 */
  }

  .slider-label {
    position: relative;
    height: 15px;
  }

  .slider-label-bottom {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;

    .num-text {
      color: #fff;
      font-size: 6px;
    }

    .num-left {
      margin-left: -1px;
    }

    .nl {
      margin-left: -4px;
    }

    .num-right {
      margin-right: -4px;
    }
  }
}
</style>
