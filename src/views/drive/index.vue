<template>
  <div class="landscape-page">
    <div class="page-content">
      <div class="logout" @click="logout">
        <img src="./static/icon_exit@2x.png" class="image" alt="退出" />
      </div>

      <!-- 视频区域：H5 用 iframe -->
      <iframe
        :src="videoUrl"
        ref="iframeView"
        class="video-frame"
        frameborder="0"
      ></iframe>

      <!-- 顶部状态栏 -->

      <div class="status-bar-capsule">
        <div class="vlot-text">{{ vlot }}V</div>
        <img
          class="link-status"
          src="@/assets/images/icon_connected@2x.png"
          alt="车辆"
        />
        <div>
          <nBattery v-model="batteryPer" />
        </div>
        <div class="time-text">{{ currentTime }}</div>
      </div>

      <div
        class="tip"
        v-show="numTip > 0"
        :style="{ display: numTip > 0 ? 'block' : 'none' }"
      >
        <div>距离本次结束驾驶还有{{ 31 - numTip }}s</div>
      </div>

      <!-- 设置按钮 -->
      <div class="right-cont" @click="set">
        <img class="image" src="./static/icon_set@2x.png" alt="设置" />
      </div>

      <div class="side-menu">
        <!-- 菜单项列表 -->
        <div
          class="menu-item"
          v-for="(item, index) in menuList"
          :key="index"
          @click="handleIcon(item)"
        >
          <img
            class="img"
            mode="scaleToFill"
            :src="activeKey.includes(item.key) ? item.iconSelect : item.icon"
          />
          <span class="label">{{ item.name }}</span>
        </div>
      </div>
      。

      <LeftRight @action="handleLRDrive" :isLeft="operMode"></LeftRight>

      <UpDown @action="handleFBDrive" :isLeft="!operMode"></UpDown>

      <div class="time">
        <img src="@/assets/images/icon_time@2x.webp" alt="" />
        <TimeClock></TimeClock>
      </div>

      <ALLPopup
        ref="allPopup"
        v-model:show="allPopupVisible"
        type="tip"
        :orderNo="orderNo"
        :vehicleId="vehicleId"
        :isShow="showRepairReason"
        @action="handlePopupAction"
      />

      <SetPopup
        v-model:show="setVisible"
        :videoDefinition="videoDefinition"
        :operFB="operFB"
        :directionCenter="directionCenter"
        :acceleratorDynamics="acceleratorDynamics"
        :directionDynamics="directionDynamics"
        :operDir="operDir"
        :type="carType"
        @action="handleOper"
        @operAction="handleFBDir"
        @changeValue="changeVal"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast } from "vant";
import { useUserStore } from "@/store/modules/user";
import { StartDrive } from "@/api/index";
import { LoginTop, DeviceDetails } from "@/api/video";

import ALLPopup from "./components/ALLPopup.vue";
import SetPopup from "./components/SetPopup.vue";

import TimeClock from "./components/TimeClock.vue";
import nBattery from "./components/nBattery.vue";
import UpDown from "./components/UpDown.vue";
import LeftRight from "./components/LeftRight.vue";
import { formatTime, mapToPer } from "@/utils/utils";
import { getWebSocket } from "@/utils/socket";
import { handleDriverSocketData } from "@/utils/socketHelper";
import { encryptAES } from "@/utils/crypto";
import { useInactivityAlarm } from "@/composables/useInactivityAlarm.js";

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
const allPopupVisible = ref(false);

const currentTime = ref(0);
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
const allPopup = ref();
const userStore = useUserStore();
const router = useRouter();
const vlot = ref(12.0);

// 余额
const balance = computed(() => {
  return userStore.getUserInfo().wallet.balance;
});
const energy = computed(() => {
  return userStore.getUserInfo().wallet.energy;
});

// 进入页面3s 定时器，拿中位值发不停发 0.04
// 调三方接口，显示video
// 摄像头 前置后置 要判断一下
// 按次计费 30s 发一次 继续驾驶请求。剩余20s有若提示。剩余5s 弹窗提示结束。同时发送中位值。（停车）
// 退出，再发送2s 中位值。
// 按时间计费，eg：1分2电池，有11个电池。只能玩5分钟 30s 发一次 继续驾驶请求。剩余20s有若提示。剩余5s 弹窗提示结束。同时发送中位值。（停车）
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
  clearSendTimer(); // 清理发送定时器
  if (ws.value) ws.value.close();
});

let sendMsgTimer = null;

const handleInactivityAlarm = () => {
  allPopupVisible.value = true;
  allPopup.value.setType("longTimeTip");
};

// 3. 使用组合式函数
const { resetTimer: resetInactivityTimer } = useInactivityAlarm(
  180 * 1000,
  handleInactivityAlarm,
);

// --- 初始化与生命周期 ---
onMounted(() => {
  if (!sessionStorage.sendNum) {
    sessionStorage.setItem("sendNum", 0);
  }
  initOrientation();
  initTimer();
  // initRouteData();
  // initVehicleConfig();
  // initWebSocket();
  // initThreeSend();
  // initTopVideo();
});
const checkOrientation = () => {
  isLandscape.value = window.innerWidth > window.innerHeight;
};
const initOrientation = () => {
  checkOrientation();
  window.addEventListener("resize", checkOrientation);
  window.addEventListener("orientationchange", checkOrientation);
};

const initTimer = () => {
  let num = 1;
  timerNum.value = setInterval(() => {
    currentTime.value = formatTime(++num);
    console.log(currentTime.value);
  }, 1000);
};

const initRouteData = () => {
  orderNo.value = route.query.order_no || "";
  vehicleId.value = route.query.vehicle_id || "";
  const details = JSON.parse(localStorage.carDetails || "{}");
  carDetails.value = details;
  videoDefinition.value = details.video_definition; // 视频清晰度

  // 车辆类型判断
  const type = details.vehicle_type;
  if (type >= 10 && type <= 19) carType.value = "1";
  else if (type >= 20 && type <= 29) carType.value = "2";
  else carType.value = "3";
};

const initVehicleConfig = () => {
  const details = carDetails.value;
  if (!details) return;

  operFB.value = carDetails.value.reverse_left_right;
  operDir.value = carDetails.value.reverse_up_down;
  directionCenter.value = carDetails.value.direction_center; // 方向中位
  directionDynamics.value = carDetails.value.direction_dynamics; // 方向力度
  acceleratorCenter.value = carDetails.value.accelerator_center; // 油门中位
  acceleratorDynamics.value = carDetails.value.accelerator_dynamics; // 油门

  const config = carDetails.value.vehicle_config_detail;
  ["ch3", "ch4", "ch5", "ch6", "ch7", "ch8"].forEach((key) => {
    if (config[key]) {
      chValue.value[key] = config[key].close_value.current_value;
    }
  });

  chValue.value.ch1 = directionCenter.value.current_value;
  chValue.value.ch2 = acceleratorCenter.value.current_value; // 油门中位值

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
};

const initWebSocket = () => {
  const url = localStorage.wssUrl;
  const port = localStorage.wssPort;
  const wsUrl = "ws://" + url + ":" + port;
  console.log(wsUrl);
  ws.value = getWebSocket("ws://zksjtest.zksjyk.cn/ws", {
    maxReconnectCount: 5,
    reconnectInterval: 3000,
    heartBeatInterval: 30000,
  });
  ws.value.connect();
};

// 假设这是你想实现的功能：在3秒内，每40ms发送一次数据
const initThreeSend = () => {
  // 3000ms / 40ms = 75次
  const maxCount = 75;
  let count = 0;

  // 首先，清除可能已存在的旧定时器，避免重复创建
  if (sendMsgTimer) {
    clearInterval(sendMsgTimer);
  }

  sendMsgTimer = setInterval(() => {
    count++;

    // 发送数据的逻辑
    if (ws.value && ws.value.readyState === 1) {
      const val = handleDriverSocketData(
        carDetails.value.app_transmitter_id,
        chValue.value.ch1,
        chValue.value.ch2,
        chValue.value.ch3,
        chValue.value.ch4,
        chValue.value.ch5,
        chValue.value.ch6,
        chValue.value.ch7,
        chValue.value.ch8,
      );
      ws.value.send(val);
    }

    // 达到指定次数后，清除定时器
    if (count >= maxCount) {
      clearInterval(sendMsgTimer);
      sendMsgTimer = null; // 重置定时器变量
      initSendLoop();
    }
  }, 40); // 每40毫秒执行一次
};

const initSendLoop = () => {
  clearSendTimer();
  sendMsgTimer = setInterval(() => {
    // 确保连接已打开
    const val = handleDriverSocketData(
      carDetails.value.app_transmitter_id,
      chValue.value.ch1,
      chValue.value.ch2,
      chValue.value.ch3,
      chValue.value.ch4,
      chValue.value.ch5,
      chValue.value.ch6,
      chValue.value.ch7,
      chValue.value.ch8,
    );
    ws.value.send(val);
  }, 3000); // 3秒发送一次
};

const clearSendTimer = () => {
  if (sendMsgTimer) {
    clearInterval(sendMsgTimer);
    sendMsgTimer = null;
  }
};

const initTopVideo = () => {
  LoginTop({
    username: carDetails.value.web_camera_user_name,
    password: encryptAES(carDetails.value.web_camera_user_password),
    usertype: "0",
  })
    .then((res) => {
      console.log(res, "---");
      if (res.code == 200) {
        GetDeviceInfo(res.data);
      }
    })
    .catch();
};
// 获取设备信息，拿到视频
const GetDeviceInfo = (data) => {
  DeviceDetails({
    ...data,
  })
    .then((res) => {
      console.log(res);
      let url = "";
      if (res.data && res.data.rows && res.data.rows.length) {
        url = "" + res.data.rows[0].id;
      }
    })
    .catch();
};

const activeKey = ref([]);

const handleIcon = (item) => {
  // 点击维修，显示上报原因，把原因显示出来
  if (item.key === "repairs") {
    allPopupVisible.value = true;
    allPopup.value.setType("repair", true);
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
        allPopupVisible.value = false;
        if (res.code != 200) {
          showToast(res.msg);
        } else {
          sendConDrive();
        }
      })
      .catch()
      .finally(() => {
        allPopupVisible.value = false;
      });
    return;
  }

  if (type == "logout") {
    StartDrive({
      order_no: orderNo.value,
      type: 3,
      vehicle_id: vehicleId.value,
    })
      .then((res) => {
        // 2000 是正确的
        if (res.code != 2000) {
          showToast(res.msg);
        } else {
          // 发送2s 中未值 ,在退出
          setTimeout(() => {
            router.push("/reservation");
          }, 2000);
        }
      })
      .catch();
  }
};

const handleOper = (type) => {
  console.log(type);
  operMode.value = type == "mode2" ? true : false; // 操作模式 箭头上下 在左

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
  showSpeed.value = false;
  handleFBDrive({ fb: false, value: 0 });
  handleIcon("speed");
};

const logout = () => {
  allPopup.value.setType("logout");

  allPopupVisible.value = true;
  // 点击退出，定速消失 重置车辆
  showSpeed.value = false;
  handleFBDrive({ fb: false, value: 0 });
  handleIcon("speed");
};

// 前进后退
const handleFBDrive = (item) => {
  showSpeed.value = false;
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
  console.log(carHandler.value.ch2, "-----------------");
  chValue.value.ch2 = carHandler.value.ch2;
};

const changeConstSpeed = () => {
  carHandler.value.handleTwoDirectionControlChannel(
    true,
    "upType",
    constSpeed.value / 100,
  );
};
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
  console.log(carHandler.value.ch1, "-----------------");
  chValue.value.ch1 = carHandler.value.ch1;
};

// 30s 发一次请求
//  按次计费 30s 发一次 继续驾驶请求。剩余20s有若提示。剩余5s 弹窗提示结束。同时发送中位值。（停车）
// 按时间计费，eg：2分3电池，有11个电池。只能玩5分钟 30s 发一次 继续驾驶请求。剩余20s有若提示。剩余5s 弹窗提示结束。同时发送中位值。（停车）
// 显示弹窗，发送中位值。 按次 60分钟45
let billingTimer = null;
let tipTimer = null;
let isRequesting = false; // 防止网络慢导致请求堆积
const numTip = ref(0);
const sendConDrive = () => {
  // 1. 彻底清理旧定时器
  clearAllTimers();

  const carInfo = JSON.parse(localStorage.getItem("carInfo"));
  if (!carInfo) return;

  let count = 0;
  if (carInfo.billing_method == 0) {
    // 【按时间计费】
    const balanceVal = carInfo.payment_type == 1 ? balance.value : energy.value;
    const totalCycles = Math.trunc(balanceVal / carInfo.billing_rules.battery);
    count = totalCycles * (carInfo.billing_rules.time * 2);
  } else {
    // 【按次计费】
    count = carInfo.billing_rules.time * 2;
  }

  // 2. 防御性判断
  if (count <= 0) {
    handleDriveEnd();
    return;
  }

  let num = Number(sessionStorage.sendNum);
  let hasTriggeredTip = false; // 防止重复弹窗

  billingTimer = setInterval(async () => {
    // 如果上一个请求还没回来，跳过本次心跳，防止请求堆积
    if (isRequesting) return;

    num++;
    sessionStorage.setItem("sendNum", num);
    isRequesting = true;

    // 3. 进入最后 30s 倒计时
    if (num >= count - 1) {
      clearInterval(billingTimer);
      billingTimer = null;

      numTip.value = 0;
      tipTimer = setInterval(() => {
        numTip.value++;
        // 剩余 5s 提示 (30s - 25s = 5s)
        if (numTip.value === 25 && !hasTriggeredTip) {
          hasTriggeredTip = true;
          allPopup.value.setType("countTip");
          allPopupVisible.value = true;
        }
        // 剩余 0s，清理定时器并触发结束逻辑
        if (numTip.value >= 30) {
          clearInterval(tipTimer);
          tipTimer = null;
          handleDriveEnd();
        }
      }, 1000);
    }

    // 4. 发送继续驾驶请求
    try {
      await StartDrive({
        order_no: orderNo.value,
        type: 2,
        vehicle_id: vehicleId.value,
      });
    } catch (error) {
      console.error("继续驾驶请求失败:", error);
    } finally {
      isRequesting = false; // 无论成功失败，解锁
    }
  }, 30 * 1000);
};

// 封装全局清理函数（供组件卸载或用户主动结束驾驶时调用）
const clearAllTimers = () => {
  if (billingTimer) {
    clearInterval(billingTimer);
    billingTimer = null;
  }
  if (tipTimer) {
    clearInterval(tipTimer);
    tipTimer = null;
  }
};

// 封装结束逻辑
const handleDriveEnd = () => {
  clearAllTimers(); // 确保结束时彻底清理
  console.log("触发结束逻辑：发送中位值、停车");
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

.status-bar-capsule {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;

  /* 核心：一行排布 + 垂直居中 */
  display: flex;
  align-items: center;
  justify-content: space-between;

  // width: 187px;
  height: 40px;
  padding: 0 15px;
  box-sizing: border-box;

  background: rgba(0, 0, 0, 0.4);
  border-radius: 0 0 12px 12px;

  white-space: nowrap;
  overflow: hidden;

  /* 1. 电压图标 + 文字 */
  .vlot-text {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;

    display: flex;
    align-items: center;
    justify-content: center;

    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 12px;

    color: #1a1a1a;

    text-align: center;
    padding-top: 4px;

    background: url("@/assets/images/icon_voltage@2x.png") center / cover
      no-repeat;
  }

  /* 2. 连接状态图标 */
  .link-status {
    flex: 0 0 auto;
    display: block; /* 去掉 inline 基线带来的底部缝隙 */
    width: 36px;
    height: 36px;
  }

  /* 3. 电量组件外层包裹（建议在模板上加 class） */
  .battery-wrap {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  /* 4. 时间 */
  .time-text {
    flex: 0 0 auto;
    font-family: PingFangSC, PingFang SC;
    font-weight: 500;
    font-size: 16px;
    padding-left: 10px;

    color: #ffffff;
    font-variant-numeric: tabular-nums; /* 数字等宽，秒变时不抖动 */
  }
}

.tip {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  /* 优化：使用 transform 替代负 margin，居中更精准 */
  padding: 0 5px;
  /* 优化：提供合适的上下和左右内边距 */
  box-sizing: border-box;
  white-space: nowrap;
  color: #ccc;
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
