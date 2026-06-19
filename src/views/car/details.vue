<template>
  <div class="page">

    <NavBar :title="title"></NavBar>

    <!-- 1. 顶部背景图与基础信息 -->
    <div class="header-section">
      <img class="banner-img" :src="imageUrl" alt="venue banner" />
      <div class="info-box">
        <div class="title-row">
          <span class="main-title">{{ detailData.venue_name }}</span>
          <text class="tag">{{ detailData.labels }}</text>
        </div>
        <div class="time-text">营业时间：{{ detailData.start_time }} ~ {{ detailData.end_time }}</div>
      </div>
    </div>

    <!-- 2. 统计数据 -->
    <van-cell-group inset class="stats-container">
      <div class="stat-item">
        <div class="num-box">
          <span class="stat-num">{{ stats.queue }}</span>
          <span class="stat-unit">人</span>
        </div>
        <span class="stat-label">总排队人数</span>
      </div>
      <van-divider vertical />
      <div class="stat-item">
        <div class="num-box">
          <span class="stat-num">{{ stats.online }}</span>
          <span class="stat-unit">辆</span>
        </div>
        <span class="stat-label">在线车辆</span>
      </div>
      <van-divider vertical />
      <div class="stat-item">
        <div class="num-box">
          <span class="stat-num">{{ stats.drive }}</span>
          <span class="stat-unit">辆</span>
        </div>
        <span class="stat-label">驾驶中</span>
      </div>
    </van-cell-group>

    <!-- 3. 车辆列表 -->
    <div class="list-title">车辆列表</div>
    <div class="car-list">
      <div class="car-card" v-for="car in carList" :key="car.id">
        <!-- 状态标签 -->


        <div class="status-tag" :class="car.vehicle_state === '1' ? 'tag-green' : 'tag-blue'">
          {{
            car.vehicle_state === "1"
              ? "空闲"
              : "排队" + car.vehicle_queue + "人"
          }}
        </div>

        <!-- 左侧图片区域 -->
        <div class="img-wrapper">
          <img class="car-img" :src="car.vehicle_image" alt="car" />
          <div class="lock-mask" v-if="car.is_password == 1">
            <van-icon name="lock" size="30" color="#ffffff" />
          </div>
        </div>

        <!-- 右侧信息区域 -->
        <div class="info-wrapper">
          <div class="top-row">
            <span class="car-name">{{ car.name }}</span>
          </div>
          <div class="desc-row">
            <span class="label">车辆特点：</span>
            <span class="value">{{ car.vehicle_introduction }}</span>
          </div>
          <div class="desc-row">
            <span class="label">最高时速：</span>
            <span class="value">{{ car.top_speed || '0km/h' }}</span>
          </div>
          <div class="bottom-row">
            <span class="battery">车辆电量：{{ car.vehicle_battery }}</span>

            <button class="action-btn" :class="{ 'btn-disabled': car.vehicle_state == 2 }"
              :disabled="car.vehicle_state == 2" @click="handleDrive(car)">
              我要驾驶
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 弹窗组件 -->

    <!-- 用户协议弹窗 -->
    <van-popup v-model:show="agree" position="center" round>
      <div class="modal-content">
        <h3>用户驾驶协议</h3>
        <div class="cont">禁止未成年人充值使用。</div>
        <div class="cont">用户充值消费驾驶后不支持退余额，充值的金额只能在平台消费，如果排队没玩到车，保留到后面场地有车继续消费。</div>
        <div class="cont">车辆预约会扣费，如没排队上，预约取消会自动退回账户里。</div>
        <div class="cont">如有疑问请联系客服。</div>
        <div class="modal-footer">
          <van-button block type="primary" @click="handleAgree">我已同意</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 密码输入弹窗 -->
    <van-popup v-model:show="pwdVisible" position="center" round>
      <div class="modal-content">
        <h3>输入密码</h3>
        <van-field v-model="password" type="password" placeholder="请输入密码" maxlength="20" />
        <div class="modal-footer">
          <van-button block type="primary" @click="handlePwd">确认</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 预约成功弹窗 -->
    <van-popup v-model:show="orderVisible" position="center" round>
      <div class="modal-content order-cont">
        <img class="car-image" :src="selectCar.vehicle_image" alt="car" />
        <div class="main-status">已成功预约 {{ orderCar.vehicle_name }} 车辆</div>
        <div class="sub-status">当前还有 {{ orderCar.people_number }} 人排队，请耐心等待</div>

        <div class="info-card">
          <div class="info-item">
            <span class="label">预约类型：</span>
            <span class="value">按{{ orderCar.billing_method == "0" ? "时间" : "次" }}计费</span>
          </div>
          <div class="info-item">
            <span class="label">预约时间：</span>
            <span class="value">{{ orderCar.time }}</span>
          </div>
        </div>

        <div class="tip-text">请在【我的-预约订单】中查看</div>
        <div class="modal-footer">
          <van-button block type="primary" @click="gotoUrl">查看订单</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 计费方式选择组件 (模拟) -->
    <BillingPopup ref="billingPopupRef" :billData="billingMethod" @confirm="onBillingConfirm" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import BillingPopup from '@/components/BillingPopup/index.vue';
import NavBar from "@/components/CustomNavBar/index.vue";

import { GetVenueDetail, OrderCar } from '@/api/index';

const route = useRoute();
const router = useRouter();
const stats = ref({ queue: 0, online: 0, drive: 0 });
const agree = ref(false);
const pwdVisible = ref(false);
const orderVisible = ref(false);
const password = ref("");
const billingPopupRef = ref(null);
const imageUrl = ref("");
const billingMethod = ref({});
const detailData = ref({ venue_name: '', labels: '', start_time: '', end_time: '' });
const selectCar = ref({ vehicle_id: "", vehicle_name: "", venue_id: "", billing_rules: "", venue_name: "", vehicle_image: '' });
const orderCar = ref({ vehicle_name: "", time: "", payment_type: 1, billing_method: 0, order_no: "", transmitter_id: 0, people_number: 0 });
const currentCar = ref({}); // 重命名 car 为 currentCar 避免冲突
const carList = ref([]);
const title = ref('')
// 页面加载模拟
onMounted(() => {
  // 模拟获取路由参数

  title.value = localStorage.getItem("carTitle") || "车辆详情";

  GetVenueDetail({ venue_id: route.query.id })
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
        selectCar.value.venue_id = route.query.id;
        selectCar.value.venue_name = data.venue_name;
      } else {
        showToast(msg)
      }

    })
    .catch((e) => {
      throw e
      // showToast(e);
    });
});

// 交互逻辑
const handleDrive = (item) => {
  currentCar.value = { ...item };
  agree.value = true;
};

const handlePwd = () => {
  if (password.value === currentCar.value.password) {
    pwdVisible.value = false;
    selectCar.value.vehicle_id = currentCar.value.id;
    selectCar.value.vehicle_name = currentCar.value.vehicle_name;
    selectCar.value.vehicle_image = currentCar.value.vehicle_image;
    billingPopupRef.value.open();
  } else {
    showToast({ message: "密码不正确", icon: 'none' });
  }
};

const handleAgree = () => {
  agree.value = false;
  if (currentCar.value.is_password == 1) {
    pwdVisible.value = true;
    return;
  }
  if (currentCar.value.vehicle_state === "2") {
    showToast({ message: "该车正在排队中", icon: "none" });
    return;
  }
  selectCar.value.vehicle_id = currentCar.value.id;
  selectCar.value.vehicle_name = currentCar.value.vehicle_name;
  selectCar.value.vehicle_image = currentCar.value.vehicle_image;
  billingPopupRef.value.open();
};

const flag = ref(true);
const onBillingConfirm = (params) => {
  if (!flag.value) return;
  flag.value = false;

  const min = Math.pow(10, 7);
  const max = Math.pow(10, 8) - 1;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

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
        orderVisible.value = true;
      }
    })
    .catch(() => {
      showToast('预约失败');
    })
    .finally(() => {
      flag.value = true;
    });
};

const gotoUrl = () => {
  orderVisible.value = false;
  router.push('/pages/mine/reservation');
};
</script>

<style lang="scss" scoped>
/* 全局容器 */
.page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 30px;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif;
}

/* 1. 头部样式 */
.header-section {
  background-color: #ffffff;
  margin-bottom: 10px;
}

.banner-img {
  width: 100%;
  height: 170px;
  object-fit: cover;
  display: block;
}

.info-box {
  padding: 15px;
}

.title-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.main-title {
  font-weight: 500;
  font-size: 18px;
  color: #1a1a1a;
  margin-right: 10px;
}

.tag {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 10px;
  color: #3e77ac;
  padding: 2px 5px;
  background: #c7e0ff;
  border-radius: 2px;
}

.time-text {
  font-size: 12px;
  color: #666666;
}

/* 2. 统计栏样式 */
.stats-container {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  background-color: #ffffff;
  padding: 15px 0;
  margin-bottom: 10px;
}

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
  font-weight: bold;
  font-size: 24px;
  color: #1a1a1a;
  font-family: 'DINAlternate', sans-serif;
}

.stat-unit {
  font-size: 14px;
  color: #999999;
  margin-left: 2px;
}

.stat-label {
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

.list-title {
  padding: 15px;
  font-size: 16px;
  color: #333;
}

/* 3. 列表卡片样式 */
.car-list {
  padding: 0 15px;
}

.car-card {
  background-color: #ffffff;
  border-radius: 12px;
  margin-bottom: 15px;
  display: flex;
  padding: 15px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.status-tag {
  position: absolute;
  top: 0;
  right: 0;
  border-radius: 0 12px 0 12px;
  font-size: 10px;
  padding: 4px 8px;
}

.img-wrapper {
  width: 100px;
  height: 100px;
  margin-right: 15px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.car-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lock-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.info-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.car-name {
  font-weight: 600;
  font-size: 16px;
  color: #222222;
}

.desc-row {
  display: flex;
  font-size: 12px;
  color: #555555;
  margin-top: 5px;
}

.label {
  width: 60px;
  flex-shrink: 0;
}

.value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.battery {
  font-size: 12px;
  color: #555555;
}

.action-btn {
  height: 28px;
  font-size: 12px;
  padding: 0 15px;
}

/* 弹窗通用样式 */
.modal-content {
  padding: 20px;
  width: 80vw;
  max-width: 300px;
  text-align: center;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
}

.cont {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  text-align: left;
}

.modal-footer {
  margin-top: 20px;
}

/* 预约成功弹窗特有样式 */
.order-cont .car-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 15px;
  background-color: #f0f0f0;
}

.main-status {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.sub-status {
  font-size: 12px;
  color: #999;
  margin-bottom: 15px;
}

.info-card {
  background-color: #f7f8fa;
  border-radius: 8px;
  padding: 10px;
  text-align: left;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  font-size: 12px;
  margin-bottom: 5px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.tip-text {
  font-size: 10px;
  color: #999;
  margin-bottom: 15px;
}

.status-tag {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 22rpx;
  font-size: 20rpx;
  color: #fff;
  padding: 6rpx 15rpx;
  border-radius: 0rpx 16rpx 0rpx 16rpx;

  &.tag-green {
    background-color: #4cd964;
    /* 绿色 */
  }

  &.tag-blue {
    background-color: #007aff;
    /* 蓝色 */
  }
}

.action-btn {
  background-color: #f1c40f;
  /* 黄色按钮 */
  color: #333;
  font-size: 24rpx;
  font-weight: bold;
  padding: 0 30rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 30rpx;
  margin: 0;
  /* 去除默认外边距 */

  &.btn-disabled {
    background-color: #cccccc;
    color: #666;
  }
}
</style>