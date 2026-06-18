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
          <van-button class="recharge-btn" size="small" @click="handleRecharge"
            >充值</van-button
          >
        </div>
      </div>

      <!-- 说明 -->
      <div class="desc">
        电池说明：没用完的电池会直接放在这里，下次可以直接使用。电池不能提现，只能消费。
      </div>
    </div>

    <!-- 标签栏 -->
    <van-tabs
      v-model:active="currentTab"
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

    <!-- 列表 -->
    <div class="list">
      <!-- 1. 加载中 -->
      <div class="load-tip" v-if="loading">加载中...</div>

      <!-- 2. 无数据空状态 -->
      <van-empty
        v-if="!loading && list.length === 0"
        :image="nodata"
        description="暂时没有内容哦～"
      />

      <!-- 3. 数据列表 -->
      <div class="item" v-for="(item, index) in list" :key="index">
        <span class="type">{{ item.type == 1 ? "收入" : "消费" }}</span>
        <div class="middle">
          <span class="common-text">{{
            item.type == 1 ? "提前结束驾驶退还" : "驾驶扣款"
          }}</span>
          <span class="amount" :class="item.type == 1 ? 'green' : 'red'">
            {{ item.type == 1 ? "+" : "" }}{{ item.amount }}
          </span>
        </div>
        <span class="common-text time">{{ formatTime(item.time) }}</span>
      </div>

      <!-- 4. 没有更多 -->
      <div class="load-tip" v-if="noMore && list.length > 0">没有更多了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import NavBar from "@/components/CustomNavBar/index.vue";
import { GetUserWalletLog } from "@/api/mine";
import { formatTime } from "@/utils/utils";
import { useUserStore } from "@/store/modules/user";
import nodata from "@/assets/images/common/car_nodata@2x.jpg"
const router = useRouter();
const userStore = useUserStore();

// ==================== 数据 ====================
const balance = computed(() => {
  return userStore.getUserInfo().wallet.balance;
});

const list = ref([]);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const noMore = ref(false);

const tabs = [
  { id: "", name: "全部" },
  { id: "1", name: "充值" },
  { id: "2", name: "消费" },
];
const currentTab = ref("");

// ==================== 获取列表 ====================
const getList = async () => {
  if (loading.value || noMore.value) return;
  loading.value = true;

  try {
    const { data } = await GetUserWalletLog({
      type: currentTab.value,
    });
    const dataList = data?.content || [];

    if (page.value === 1) {
      list.value = dataList;
    } else {
      list.value.push(...dataList);
    }

    // 无更多数据判断
    if (dataList.length < pageSize.value) {
      noMore.value = true;
    } else {
      page.value++;
    }
  } finally {
    loading.value = false;
  }
};

// ==================== 事件 ====================
const goBack = () => window.history.back();

const handleRecharge = () => router.push("/recharge");

// ==================== 生命周期 ====================
onMounted(() => getList());

// 监听滚动到底部（需要配合滚动容器或 window 事件）
// 这里简化处理，实际项目中可能需要使用 IntersectionObserver 或监听 window.onscroll
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
  position: relative;
  padding-bottom: 20px;
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
  padding: 15px;
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
    margin-left: 4px;
  }
}

.num {
  font-weight: 600;
  font-size: 20px;
  color: #222222;
  padding-top: 3px;
  padding-left: 5px;
}

.recharge-btn {
  background: #ffc838;
  border: none;
  color: #1a1a1a;
  font-size: 12px;
  padding: 5px 20px;
  border-radius: 6px;
}

/* 说明 */
.desc {
  padding: 0 10px 10px;
  font-size: 12px;
  color: #999999;
}

/* 标签栏 */
.tabs {
  background-color: #ffffff;
  margin-bottom: 10px;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 列表 */
.list {
  padding: 0 10px 10px;
}

.item {
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
}

.common-text {
  font-size: 12px;
  color: #666666;
}

.type {
  font-weight: 500;
  font-size: 14px;
  color: #333333;
}

.middle {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  color: #999;
  margin-top: 6px;
  .amount {
    font-weight: bold;
    font-size: 20px;
  }
  .red {
    color: #ee4040;
  }
  .green {
    color: #07c160;
  }
}

.time {
  display: block;
  margin-top: 6px;
}

.load-tip {
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 12px;
}
</style>
