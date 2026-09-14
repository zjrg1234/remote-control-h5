<template>
  <div class="page">
    <NavBar :title="$t('场地详情')"></NavBar>
    <div class="content">
      <div class="header-section">
        <van-image class="banner-img" :src="imageUrl" fit="cover" />
        <div class="info-box">
          <div class="title-row">
            <span class="main-title">{{ detailData.venue_name }}</span>
            <span class="tag">● 营业中</span>
          </div>

          <!-- 2. 统计数据 -->
          <div class="stats-container">
            <div class="stat-item">
              <div class="num-box">
                <span class="stat-num">{{ stats.queue }}</span>
              </div>
              <span class="stat-label">总排队人数(人)</span>
            </div>

            <div class="stat-item">
              <div class="num-box">
                <span class="stat-num">{{ stats.online }}</span>
              </div>
              <span class="stat-label">在线车辆(辆)</span>
            </div>

            <div class="stat-item">
              <div class="num-box">
                <span class="stat-num">{{ stats.drive }}</span>
              </div>
              <span class="stat-label">驾驶中(辆)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-title">车辆列表</div>

      <!-- 3. 车辆列表 -->
      <div class="car-list">
        <div class="car-card" v-for="car in carList" :key="car.id">
          <!-- 排队状态标签 (右上角) -->
          <div class="queue-tag" v-if="car.vehicle_state == 2">
            {{ car.vehicle_queue }}人等待
          </div>

          <!-- 左侧图片区域 -->
          <div class="img-wrapper">
            <van-image
              class="car-img"
              :src="car.vehicle_image"
              fit="cover"
              lazy-load
            />
            <div class="lock-mask" v-if="car.is_password == 1">
              <van-icon name="lock" size="24" color="#ffffff" />
            </div>
          </div>

          <!-- 右侧信息区域 -->
          <div class="info-wrapper">
            <div class="top-row">
              <span class="car-name">{{ car.vehicle_name }}</span>
              <span
                class="status-dot"
                :class="car.vehicle_state == 1 ? 'online' : 'offline'"
              >
                {{ car.vehicle_state == 1 ? "在线" : "离线" }}
              </span>
            </div>
            <div class="desc">{{ car.vehicle_introduction }}</div>
            <div class="battery-row">
              <van-icon name="location-o" size="12" color="#3dbf9a" />
              <span class="battery-text">{{
                car.vehicle_battery.includes("%")
                  ? car.vehicle_battery
                  : car.vehicle_battery + "%"
              }}</span>
            </div>
            <div class="action-row">
              <van-button
                class="action-btn"
                :class="car.vehicle_state == 1 ? 'btn-green' : 'btn-orange'"
                @click="handleDrive(car)"
              >
                {{ car.vehicle_state == 1 ? "开始驾驶" : "驾驶中" }}
              </van-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部弹窗替换 (使用 Vant 4 的 van-popup / van-dialog 或直接复用原有组件) -->
      <!-- 注：为保持逻辑完整，这里保留原有的 TipModal 组件用法，但在 Vue3+Vant4 项目中建议替换为 van-dialog -->
      <TipModal
        title="用户驾驶协议"
        v-model:visible="agree"
        key="1"
        :cancelFlag="false"
        confirmText="已阅读"
        @confirm="handleAgree"
      >
        <template #content>
          <div class="custom-content">
            <div class="cont">禁止未成年人充值使用。</div>
            <div class="cont">
              用户充值消费驾驶后不支持退余额，充值的金额只能在平台消费，如果排队没玩到车，保留到后面场地有车继续消费。
            </div>
            <div class="cont">
              车辆预约会扣费，如没排队上，预约取消会自动退回账户里。
            </div>
            <div class="cont">如有疑问请联系客服。</div>
          </div>
        </template>
      </TipModal>

      <TipModal
        title="输入密码"
        v-model:visible="pwdVisible"
        key="2"
        @confirm="handlePwd"
      >
        <template #content>
          <div class="custom-input">
            <input
              class="input"
              type="password"
              maxlength="6"
              placeholder="请输入密码"
              v-model="password"
            />
          </div>
        </template>
      </TipModal>

      <TipModal
        title="车辆预约"
        v-model:visible="orderVisible"
        key="2"
        cancelText="取消预约"
        @cancel="cancelOrder"
        @confirm="gotoUrl"
      >
        <template #content>
          <div class="order-cont">
            <div class="img">
              <van-image
                class="car-image"
                :src="selectCar.vehicle_image"
                fit="cover"
              />
            </div>
            <span class="main-status"
              >已成功预约 {{ orderCar.vehicle_name }} 车辆</span
            >
            <span class="sub-status" v-if="orderCar.people_number > 0"
              >当前还有 {{ orderCar.people_number }} 人排队，请耐心等待</span
            >
            <span class="sub-status" v-if="orderCar.people_number == 0"
              >当前排在首位，请尽快去驾驶</span
            >
            <div class="info-card">
              <div class="info-item">
                <span class="label">预约类型：</span>
                <span class="value"
                  >按{{
                    orderCar.billing_method == "0" ? "时间" : "次"
                  }}计费</span
                >
              </div>
              <div class="info-item">
                <span class="label">预约时间：</span>
                <span class="value">{{ orderCar.time }}</span>
              </div>
            </div>
            <span class="tip-text">请在【我的-预约订单】中查看</span>
          </div>
        </template>
      </TipModal>

      <TipModal
        title="存在已预约的订单"
        v-model:visible="orderedVisible"
        key="3"
        cancelText="驾驶已有"
        @cancel="gotoUrl"
        confirmText="继续支付"
        @confirm="continuePay"
      >
        <template #content>
          <div class="order-cont">
            <div class="order-text">
              您有预约单还未驾驶，如果继续支付，将取消之前的预约单，请选择
            </div>
          </div>
        </template>
      </TipModal>

      <BillingPopup
        ref="billingPopupRef"
        :billData="billingMethod"
        @confirm="onBillingConfirm"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast } from "vant";

import TipModal from "@/components/TipModal/index.vue";
import BillingPopup from "@/components/BillingPopup/index.vue";
import NavBar from "@/components/CustomNavBar/index.vue";

import {
  GetVenueDetail,
  OrderCar,
  CancelReservation,
  StartDrive,
} from "@/api/index";
import { GetReservationList } from "@/api/mine";

const router = useRouter();

const title = ref("");
const stats = ref({ queue: 0, online: 0, drive: 0 });
const agree = ref(false);
const pwdVisible = ref(false);
const orderVisible = ref(false);
const orderedVisible = ref(false);

const password = ref("");
const billingPopupRef = ref(null);
const imageUrl = ref("");
const billingMethod = ref({});
const detailData = ref({
  venue_name: "",
  labels: "",
  start_time: "",
  end_time: "",
});
const selectCar = ref({
  vehicle_id: "",
  vehicle_name: "",
  venue_id: "",
  billing_rules: "",
  venue_name: "",
  vehicle_image: "",
});
const orderCar = ref({
  vehicle_name: "",
  time: "",
  payment_type: 1,
  billing_method: 0,
  order_no: "",
  transmitter_id: 0,
  people_number: 0,
});
const currentCar = ref({});
const carList = ref([]);
const selectParam = ref({});
const route = useRoute();

onMounted(() => {
  // 路由参数处理

  const venueId = route.query.id;

  // 从 storage 获取标题
  const storedTitle = localStorage.getItem("carTitle") || "车辆详情";
  title.value = storedTitle;
  document.title = storedTitle; // 修改网页标题

  GetVenueDetail({ venue_id: venueId })
    .then((res) => {
      const { code, data, msg } = res;
      if (code === 200) {
        detailData.value = { ...data };
        stats.value.queue = data.queue;
        stats.value.online = data.online;
        stats.value.drive = data.drive;
        imageUrl.value = data.venue_image?.[0];
        carList.value = data.vehicle;
        billingMethod.value = data.venue_config;
        selectCar.value.venue_id = venueId;
        selectCar.value.venue_name = data.venue_name;
        localStorage.setItem("wssUrl", data.content_url);
        localStorage.setItem("wssPort", data.content_url_port);
      } else {
        showToast(msg);
      }
    })
    .catch((e) => {
      console.error(e);
    });
});

const handleDrive = (item) => {
  if (!localStorage.getItem("token")) {
    // 使用 Vant Dialog 替代 uni.showModal
    // 这里为了演示简化，你可以导入 Dialog 组件
    if (confirm("请您登录/注册，才能驾驶车辆")) {
      router.push("/login");
    }
    return;
  }
  currentCar.value = { ...item };
  agree.value = true;
};

const handlePwd = () => {
  if (password.value === currentCar.value.password) {
    pwdVisible.value = false;
    password.value = "";
    selectCar.value.vehicle_id = currentCar.value.id;
    selectCar.value.vehicle_name = currentCar.value.vehicle_name;
    selectCar.value.vehicle_image = currentCar.value.vehicle_image;
    billingPopupRef.value.open();
  } else {
    showToast("密码不正确");
  }
};

const handleAgree = () => {
  agree.value = false;
  if (currentCar.value.is_password == 1) {
    pwdVisible.value = true;
    return;
  }
  if (currentCar.value.vehicle_state == 2) {
    showToast("该车正在排队中");
    return;
  }
  selectCar.value.vehicle_id = currentCar.value.id;
  selectCar.value.vehicle_name = currentCar.value.vehicle_name;
  selectCar.value.vehicle_image = currentCar.value.vehicle_image;
  billingPopupRef.value.open();
};

const flag = ref(true);
const onBillingConfirm = async (params) => {
  if (!flag.value) return;
  flag.value = false;
  const min = Math.pow(10, 7);
  const max = Math.pow(10, 8) - 1;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  selectParam.value = { ...params };

  const res = await GetReservationList({ size: 99 });
  if (res.code == 200 && res.data.content && res.data.content.length) {
    const firstData = res.data.content.find((item) => {
      if (
        item.reservation_status == 3 &&
        item.vehicle_id == selectCar.value.vehicle_id
      ) {
        return item;
      }
    });

    if (firstData) {
      await StartDrive(
        {
          order_no: firstData.order_no,
          type: 3,
          vehicle_id: firstData.vehicle_id,
        },
        false,
      );
    }
  }

  OrderCar({
    vehicle_id: selectCar.value.vehicle_id,
    vehicle_name: selectCar.value.vehicle_name,
    venue_id: selectCar.value.venue_id,
    venue_name: selectCar.value.venue_name,
    billing_rules: params.selectedOpt,
    payment_type: params.unitType,
    billing_method: params.selectType == -1 ? 0 : 1,
    app_transmitter_id: randomNumber,
  })
    .then((res) => {
      if (res.code === 200) {
        orderCar.value = { ...res.data };
        localStorage.setItem("app_id", res.data.transmitter_id);
        orderVisible.value = true;
      } else if (res.code === 2000) {
        orderedVisible.value = true;
      } else {
        showToast(res.msg);
      }
    })
    .catch((e) => {
      if (e.code == 2000) {
        showToast(e.msg);
      } else {
        showToast("预约失败，请稍后预约");
      }
    })
    .finally(() => {
      flag.value = true;
    });
};

const gotoUrl = () => {
  orderVisible.value = false;
  orderedVisible.value = false;
  router.push("/mine/reservation");
};

const cancelOrder = () => {
  CancelReservation({ order_no: orderCar.value.order_no })
    .then((res) => {
      if (res.code == 200) {
        orderVisible.value = false;
        showToast("取消预约成功");
      } else {
        showToast(res.msg);
      }
    })
    .catch(() => {});
};

const continuePay = async () => {
  const res = await GetReservationList({ size: 99 });
  if (res.code == 200 && res.data.content && res.data.content.length) {
    const firstData = res.data.content.find((item) => {
      if (item.reservation_status == 1 || item.reservation_status == 2) {
        return item; // 简化逻辑
      }
    });

    if (firstData) {
      CancelReservation({ order_no: firstData.order_no })
        .then((res) => {
          if (res.code == 200) {
            orderedVisible.value = false;
            onBillingConfirm(selectParam.value);
          } else {
            showToast(res.msg);
          }
        })
        .catch(() => {});
    } else {
      orderedVisible.value = false;
      onBillingConfirm(selectParam.value);
    }
  } else {
    showToast("获取预约信息失败");
  }
};
</script>

<style lang="scss" scoped>
/* 全局容器 */
.page {
  background: #e8fff8;
  min-height: 100vh;
}
.content {
  padding: 25px;
}

/* 1. 头部样式 */
.header-section {
  position: relative;
  border-radius: 16px;
  height: 675px;
  overflow: hidden;

  .banner-img {
    display: block;
    width: 100%;
    height: 660px;
    padding: 1px;
  }

  .info-box {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 226px;
    padding-top: 30px;
    background: rgba(209, 230, 224, 0.6); /* 半透明白 */
    backdrop-filter: blur(12px); /* 磨砂模糊 */
    -webkit-backdrop-filter: blur(12px); /* Safari 兼容 */
    border-top: 1px solid rgba(123, 130, 133, 0.15); /* 顶部高光边 */
    border-radius: 40px 40px 16px 16px;

    .title-row {
      display: flex;
      align-items: center;
      padding-left: 35px;
      .main-title {
        font-family: PingFangSC, PingFang SC;
        font-weight: 700;
        font-size: 32px;
        color: #1a1a1a;
        line-height: 45px;
        text-align: left;
        font-style: normal;
      }

      .tag {
        font-family: PingFangSC, PingFang SC;
        font-weight: 400;
        font-size: 22px;
        color: #ffffff;
        padding: 4px 12px;
        background: #00a5ff;
        border-radius: 20px 20px 20px 0px;

        display: flex;
        align-items: center;

        margin-left: 12px;
      }
    }
  }
}

/* 2. 统计栏样式 */
.stats-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  padding: 30px 0;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  .num-box {
    display: flex;
    flex-direction: row;
    align-items: baseline;
  }

  .stat-num {
    font-family: DINAlternate, DINAlternate;
    font-weight: bold;
    font-size: 42px;
    color: #1a1a1a;
    line-height: 48px;
    text-align: left;
    font-style: normal;
  }

  .stat-unit {
    font-size: 24px; /* 24rpx / 2 */
    color: #999999;
    margin-left: 4px;
  }

  .stat-label {
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 24px;
    color: #1a1a1a;
    line-height: 33px;
  }

  .divider {
    width: 2px;
    height: 40px;
    background-color: #f0f0f0;
  }
}

.section-title {
  padding: 20px 30px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 30px;
  color: #1a1a1a;
}

/* 3. 列表卡片样式 */
.car-list {
  padding: 0 30px;
}

.car-card {
  background-color: #ffffff;
  border-radius: 24px;
  margin-bottom: 24px;
  display: flex;
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

  .queue-tag {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 20px;
    color: #ffffff;
    padding: 6px 16px;
    background: #fca55d;
    border-radius: 0px 24px 0px 24px;
  }

  /* 图片区域 */
  .img-wrapper {
    width: 200px; /* 200rpx / 2 */
    height: 200px;
    margin-right: 30px;
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    flex-shrink: 0;

    .car-img {
      width: 100%;
      height: 100%;
    }

    .lock-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
  }

  /* 信息区域 */
  .info-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .car-name {
        font-family: PingFangSC, PingFang SC;
        font-weight: 600;
        font-size: 28px; /* 28rpx / 2 */
        color: #222222;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }

      .status-dot {
        font-size: 20px;
        padding: 4px 12px;
        border-radius: 8px;
        &.online {
          color: #40d1a5;
          background: rgba(64, 209, 165, 0.1);
        }
        &.offline {
          color: #999;
          background: rgba(153, 153, 153, 0.1);
        }
      }
    }

    .desc {
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 22px; /* 22rpx / 2 */
      color: #666666;
      margin-top: 8px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .battery-row {
      display: flex;
      align-items: center;
      margin-top: 12px;
      gap: 8px;

      .battery-text {
        font-size: 22px;
        color: #3dbf9a;
      }
    }

    .action-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;

      .action-btn {
        padding: 0 30px;
        height: 56px; /* 56rpx / 2 */
        line-height: 56px;
        font-family: PingFangSC, PingFang SC;
        font-weight: 500;
        font-size: 24px;
        border-radius: 12px;
        border: none;

        &.btn-green {
          background: #40d1a5;
          color: #ffffff;
        }
        &.btn-orange {
          background: #fca55d;
          color: #ffffff;
        }
      }
    }
  }
}

/* 弹窗内容样式 */
.custom-input {
  background: #f8f8f8;
  border-radius: 16px;
  margin-bottom: 24px;
  padding: 0 20px;
  .input {
    height: 90px;
    line-height: 1;
    border: none;
    background: transparent;
    width: 100%;
    outline: none;
  }
}

.custom-content {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 28px;
  color: #333333;
  .cont {
    display: block;
    text-align: left;
    padding-bottom: 54px;
    line-height: 50px;
  }
}

.order-cont {
  padding-bottom: 20px;
  .img {
    text-align: center;
  }
  .car-image {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    margin-bottom: 20px;
    background-color: #f0f0f0;
  }
  .main-status {
    font-size: 32px;
    font-weight: bold;
    color: #333333;
    margin-bottom: 10px;
    display: block;
    text-align: center;
  }
  .sub-status {
    font-size: 26px;
    color: #999999;
    margin-bottom: 30px;
    display: block;
    text-align: center;
  }
  .info-card {
    width: 100%;
    background-color: #f7f8fa;
    border-radius: 12px;
    padding: 20px;
    box-sizing: border-box;
    margin-bottom: 20px;
  }
  .info-item {
    display: flex;
    font-size: 26px;
    margin-bottom: 10px;
    line-height: 1.6;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .label {
    color: #666666;
  }
  .value {
    color: #333333;
  }
  .tip-text {
    font-size: 24px;
    color: #999999;
    display: block;
    text-align: center;
  }
  .order-text {
    font-size: 28px;
    color: #666;
    margin-bottom: 10px;
  }
}
</style>
