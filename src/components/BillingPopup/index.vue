<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    teleport="body"
    :close-on-click-overlay="false"
    @close="close"
  >
    <div class="billing-popup">
      <!-- 标题栏 -->
      <div class="header">
        <span class="title">选择计费方式</span>
        <van-icon name="cross" class="close-btn" @click="close" />
      </div>

      <!-- 顶部：付费单位切换 -->
      <div class="payment-type-row">
        <span class="label">付费方式</span>
        <div class="type-selector">
          <div
            class="type-item"
            :class="{ active: currentUnit === 1 }"
            @click="switchUnit(1)"
          >
            <div class="radio-circle" :class="{ checked: currentUnit === 1 }"></div>
            <span>电池</span>
          </div>
          <div
            class="type-item"
            :class="{ active: currentUnit === 2 }"
            @click="switchUnit(2)"
          >
            <div class="radio-circle" :class="{ checked: currentUnit === 2 }"></div>
            <span>能量</span>
          </div>
        </div>
      </div>

      <!-- 按时间计费 -->
      <div class="section">
        <div class="section-title">按时间计费</div>
        <span class="desc">按照分钟计费，不受时间限制，想玩就玩</span>
        <div class="grid-box">
          <div
            class="option-card"
            :class="{ selected: selectedIndex == -1 }"
            @click="selectOption(-1, billData.time_billing.time, billData.time_billing.battery)"
          >
            {{ billData.time_billing.time }}分钟{{ billData.time_billing.battery }}{{ unitText }}
          </div>
        </div>
      </div>

      <!-- 按次计费 -->
      <div class="section">
        <div class="section-title">按次计费</div>
        <span class="desc">按照单次时间游玩，时间到则立即结束</span>
        <div class="grid-box">
          <div
            v-for="(item, index) in billData.one_billing"
            :key="index"
            class="option-card"
            :class="{ selected: selectedIndex === index }"
            @click="selectOption(index, item.time, item.battery)"
          >
            {{ item.time }}分钟{{ item.battery }}{{ unitText }}
          </div>
        </div>
      </div>

      <div class="card">
        <span class="card-title">我的{{ unitText }}</span>
        <span class="battery-num">
          {{ currentUnit === 1 ? userInfo.wallet.balance : userInfo.wallet.energy }}
        </span>
      </div>

      <!-- 底部按钮 -->
      <van-button
        block
        type="warning"
        class="confirm-btn"
        @click="isWallet ? handleConfirm() : goRecharge()"
      >
        {{ isWallet ? '确定支付' : '去充值' }}
      </van-button>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch, defineExpose } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';

const props = defineProps({
  billData: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['confirm']);

const router = useRouter();
const userStore = useUserStore();

const show = ref(false);
const currentUnit = ref(1);
const selectedIndex = ref(-1);
const selectedOpt = ref({});
const isWallet = ref(true);

const userInfo = computed(() => {
  const val = userStore.getUserInfo();
  // 哪个有值用哪个
  if (val.wallet.balance > 0 && val.wallet.energy == 0) {
    currentUnit.value = 1;
  }
  if (val.wallet.balance == 0 && val.wallet.energy > 0) {
    currentUnit.value = 2;
  }
  return val;
});

const unitText = computed(() => (currentUnit.value === 1 ? '电池' : '能量'));

watch(currentUnit, (val) => {
  if (
    (val == 1 && Number(userInfo.value.wallet.balance) > 0) ||
    (val == 2 && Number(userInfo.value.wallet.energy) > 0)
  ) {
    isWallet.value = true;
  } else {
    isWallet.value = false;
  }
});

// 打开弹窗
const open = () => {
  selectedIndex.value = -1;
  selectedOpt.value = {
    time: props.billData.time_billing.time,
    battery: props.billData.time_billing.battery,
  };
  show.value = true;
};

// 关闭弹窗
const close = () => {
  show.value = false;
};

// 切换付费单位
const switchUnit = (type) => {
  currentUnit.value = type;
};

// 选择具体的时长卡片
const selectOption = (id, label, cost) => {
  selectedIndex.value = id;
  selectedOpt.value = {
    time: label,
    battery: cost,
  };
};

// 点击确定
const handleConfirm = () => {
  const result = {
    unitType: currentUnit.value,
    selectType: selectedIndex.value,
    selectedOpt: selectedOpt.value,
  };
  emit('confirm', result);
  close();
};

const goRecharge = () => {
  router.push('/pages/mine/recharge');
};

// 暴露方法给父组件调用
defineExpose({
  open,
});
</script>

<style scoped>
.billing-popup {
  width: 100%;
  background-color: #fff;
  padding: 20px;
  box-sizing: border-box;
  max-height: 80vh;
  overflow-y: auto;
}

/* 标题栏 */
.header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 20px;
}

.header .title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.header .close-btn {
  position: absolute;
  right: 0;
  font-size: 22px;
  color: #999;
  cursor: pointer;
}

/* 顶部付费方式切换 */
.payment-type-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.payment-type-row .label {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-right: 15px;
}

.type-selector {
  display: flex;
  gap: 15px;
}

.type-item {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #666;
  cursor: pointer;
}

.type-item.active {
  color: #333;
  font-weight: bold;
}

.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #ccc;
  margin-right: 8px;
  box-sizing: border-box;
  position: relative;
}

.radio-circle.checked {
  border-color: #ee0a24;
}

.radio-circle.checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background-color: #ee0a24;
  border-radius: 50%;
}

/* 分区样式 */
.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
  display: block;
}

/* 选项网格 */
.grid-box {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.option-card {
  width: calc(33.33% - 10px);
  height: 40px;
  border: 1px solid #ffc838;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  transition: all 0.2s;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;
}

.option-card.selected {
  background: #ffc838;
  color: #333;
}

/* 余额卡片 */
.card {
  background-color: #fff;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.battery-num {
  font-size: 24px;
  font-weight: bold;
  color: #ee0a24;
}

/* 确定按钮 */
.confirm-btn {
  margin-top: 20px;
  border-radius: 24px;
  height: 48px;
  font-size: 16px;
  font-weight: bold;
}
</style>