<template>
  <div class="page">
    <!-- 顶部导航栏 -->
    <NavBar title="我的电池" />

    <div class="wrap-content">
     
      <!-- 电池卡片 -->
      <div class="card">
        <div class="card-bg">
          <img
            class="card-bg-img"
            src="@/assets/images/mine/bg_battery@2x.png"
          />
        </div>
        <div class="card-content">
          <div class="card-left">
            <div class="label">
              <span class="label-text">我的电池</span>
              <img
                class="battery"
                src="@/assets/images/mine/icon_battery@2x.png"
              />
            </div>
            <div class="num">{{ balance }}</div>
          </div>
        </div>
      </div>

      <!-- 标签切换 -->
      <van-tabs
        v-model:active="activeTab"
        class="tabs"
        color="#1A1A1A"
        title-active-color="#1A1A1A"
        title-inactive-color="#777777"
      >
        <van-tab
          v-for="item in tabs"
          :key="item.id"
          :title="item.name"
          :name="item.id"
        />
      </van-tabs>

      <!-- 充值套餐 -->
      <div class="section">
        <span class="section-title">充值套餐</span>
        <div class="package-list">
          <div
            class="package-item"
            :class="{
              active:
                selectedPackage ===
                (activeTab === 'normal' ? item.amount : item.payment_amount),
            }"
            v-for="item in activeTab === 'normal'
              ? packageList
              : packageFirstList"
            :key="item.amount || item.payment_amount"
            @click="selectedPackageIndex(activeTab, item)"
          >
            <div class="num">
              <span>{{
                activeTab === "normal" ? item.amount : item.payment_amount
              }}</span>
              <img
                class="icon"
                src="@/assets/images/common/icon_battery@2x.png"
              />
            </div>
            <div v-if="activeTab === 'first'" class="energy">
              送{{ item.send_energy }}能量
            </div>
            <div class="price">
              ¥{{
                (activeTab === "normal"
                  ? item.amount
                  : item.payment_amount
                ).toFixed(2)
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义充值 -->
      <div class="section">
        <span class="section-title">自定义数量充值</span>
        <input
          class="custom-input"
          type="number"
          placeholder="请输入电池数量（不低于3个）"
          v-model.number="customNum"
        />
      </div>

      <!-- 支付方式 -->
      <div class="section">
        <span class="section-title">支付方式</span>
        <van-radio-group
          v-model="payType"
          direction="horizontal"
          class="pay-list"
        >
          <van-radio name="alipay" class="pay-item">
            <img
              class="pay-icon"
              src="@/assets/images/common/icon_zfb@2x.png"
            />
            <span>支付宝支付</span>
          </van-radio>
          <van-radio name="wechat" class="pay-item">
            <img class="pay-icon" src="@/assets/images/common/icon_wx@2x.png" />
            <span>微信支付</span>
          </van-radio>
        </van-radio-group>
      </div>

      <!-- 说明文字 -->
      <div class="desc">
        <span class="desc-title">充值说明：</span>
        <div class="desc-item">1. 如您未满18岁，请在监护人陪同下操作；</div>
        <div class="desc-item">2. 如对充值有其它疑问，请联系客服。</div>
      </div>

      <!-- 确定按钮 -->
      <van-button class="submit-btn" type="primary" @click="handleSubmit"
        >确定</van-button
      >
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import NavBar from "@/components/CustomNavBar/index.vue";
import {
  GetDepositList,
  GetFirstDepositList,
  AlipayDeposit,
  WechatDeposit,
} from "@/api/recharge";
import { useUserStore } from "@/store/modules/user";

const router = useRouter();
const userStore = useUserStore();

// 余额
const balance = computed(() => {
  return userStore.getUserInfo().wallet.balance;
});

// 当前选中标签
const activeTab = ref("normal");
const tabs = [
  { id: "normal", name: "普通充值" },
  { id: "first", name: "首充优惠" },
];

// 套餐列表
const packageList = ref([]);
const packageFirstList = ref([]);
const activityId = ref(undefined);

// 选中的套餐
const selectedPackage = ref(null);

// 自定义充值数量
const customNum = ref(null);

// 支付方式
const payType = ref("alipay");

// 获取套餐列表
const getDepositList = () => {
  GetDepositList({ uid: userStore.getUserInfo().id })
    .then((res) => {
      packageList.value = res.data;
    })
    .catch(() => {
      showToast("获取套餐列表失败");
    });
};

// 获取首充套餐列表
const getFirstDepositList = () => {
  GetFirstDepositList({ uid: userStore.getUserInfo().id })
    .then((res) => {
      packageFirstList.value = res.data;
    })
    .catch(() => {
      showToast("获取首充套餐列表失败");
    });
};

// 监听自定义数量变化
watch(customNum, (newValue) => {
  if (newValue) {
    selectedPackage.value = -1;
  }
});

// 选择套餐
const selectedPackageIndex = (type, item) => {
  if (type === "normal") {
    selectedPackage.value = item.amount;
  } else {
    selectedPackage.value = item.payment_amount;
    activityId.value = item.activity_id;
  }
  customNum.value = "";
};

// 提交
const handleSubmit = async () => {
  let amount = 0;
  if (selectedPackage.value && selectedPackage.value !== -1) {
    amount = selectedPackage.value;
  } else if (customNum.value && customNum.value >= 3) {
    amount = customNum.value;
  } else {
    showToast({ message: "请选择或输入充值数量", icon: "none" });
    return;
  }

  const obj = {
    uid: userStore.getUserInfo().id,
    amount: selectedPackage.value || customNum.value,
    activity_id: activityId.value || undefined,
  };

  if (payType.value === "alipay") {
    try {
      const {
        code,
        data: { order_str },
      } = await AlipayDeposit(obj);
      const payUrl = "https://mapi.alipay.com/gateway.do?" + order_str;
      const encodedUrl = encodeURIComponent(payUrl);
      const scheme = `alipays://platformapi/startapp?appId=20000067&url=${encodedUrl}`;

      // 尝试唤起App
      window.location.href = scheme;

      // 若未安装，3秒后跳转H5收银台
      setTimeout(() => {
        window.location.href = payUrl;
      }, 3000);
    } catch (error) {
      showToast("支付请求失败");
    }
  } else {
    try {
      await WechatDeposit(obj);
      showToast("微信支付功能待实现");
    } catch (error) {
      showToast("支付请求失败");
    }
  }
};

// 初始化
getDepositList();
getFirstDepositList();
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
  position: relative;
  padding-bottom: 80px;
}

.wrap-content {
  position: relative;
  width: 100%;
  background: #ffffff;
}

/* 顶部背景图 */
.bg-image {
  position: absolute;
  top: -48.5px; // 97rpx / 2
  left: 0;
  width: 100%;
  height: 85px; // 170rpx / 2
  z-index: 0;
  .image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

/* 电池卡片 */
.card {
  position: relative;
  z-index: 1;
  padding: 10px 15px 0;
  overflow: hidden;
  height: 98px; // 196rpx / 2
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 0;
  .card-bg-img {
    width: 100%;
    height: 98px; // 196rpx / 2
  }
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.label {
  padding-top: 5px;
  display: flex;
  align-items: center;
  .label-text {
    font-size: 14px;
    color: #222222;
  }
  .battery {
    width: 19px;
    height: 19px;
    margin-left: 5px;
  }
}

.num {
  font-weight: 600;
  font-size: 20px;
  color: #222222;
  padding-top: 3px;
  padding-left: 5px;
}

/* 标签切换 */
.tabs {
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 通用 section */
.section {
  background: #fff;
  // margin: 10px 5px 0;
  border-radius: 8px;
  padding: 15px;
  .section-title {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 10px;
    display: block;
  }
}

/* 套餐列表 */
.package-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  .package-item {
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 12px 5px;
    text-align: center;
    .num {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      display: flex;
      align-items: baseline;
      justify-content: center;
      .icon {
        width: 14px;
        height: 14px;
        margin-left: 3px;
      }
    }
    .price {
      font-size: 13px;
      color: #999;
      margin-top: 5px;
    }
    .energy {
      font-size: 13px;
      color: #999;
    }
    &.active {
      border-color: #ffc832;
      background: #fff9e6;
      .num {
        color: #ff8500;
      }
      .price {
        color: #ff8500;
      }
    }
  }
}

/* 自定义输入框 */
.custom-input {
  height: 40px;
  background: #f8f8f8;
  border-radius: 6px;
  padding: 0 5px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}

/* 支付方式 */
.pay-list {
  display: flex;
  gap: 10px;
  .pay-item {
    flex: 1;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 15px;
    color: #1a1a1a;
    .pay-icon {
      width: 20px;
      height: 20px;
    }
    :deep(.van-radio__label) {
      display: flex;
    }

    // &.van-radio--checked {
    //   background: #ffc838;
    //   border-color: #ffc838;
    //   color: #1a1a1a;
    // }

     :deep(.van-radio__icon--checked .van-icon) {
      background: #ffc838;
      border-color: #ffc838;
  
     }
  }
}

/* 说明文字 */
.desc {
  margin: 10px 15px;
  font-size: 12px;
  color: #999999;
  .desc-title {
    font-weight: 500;
  }
  .desc-item {
    margin-top: 5px;
  }
}

/* 提交按钮 */
.submit-btn {
  position: fixed;
  bottom: env(safe-area-inset-bottom);
  margin: 10px;
  width: calc(100% - 20px);
  background: #ffc832;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  color: #1a1a1a;
}
</style>
