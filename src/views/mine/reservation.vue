<template>
  <div class="page-container">
    <NavBar title="我的预约"></NavBar>

    <div class="cont">
      <!-- 【修复1】去掉 :immediate-check="false"，让 van-list 自动触发首次加载 -->
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :finished-text="list.length > 10 ? '没有更多了' : ''"
        @load="onLoad"
      >
        <!-- 【修复2】增加 !finished 判断，防止加载结束瞬间空状态闪烁 -->

        <div
          class="order-item"
          v-for="(item, index) in list"
          :key="item.order_no || index"
        >
          <!-- 标题行 -->
          <div class="title-row">
            <!-- 头像占位或图片 -->
            <img class="avatar" :src="item.head_shot" alt="avatar" />
            <span class="vehicle-name">{{ item.vehicle_name }}</span>
            <span
              class="status-tag"
              :class="statusClass(item.reservation_status)"
            >
              {{ statusText(item.reservation_status) }}
            </span>
          </div>

          <!-- 信息行 -->
          <div class="info-row">
            <span class="label">预约编号：</span>
            <span class="value">{{ item.order_no }}</span>
             <img class="copy-icon" src="@/assets/images/common/icon_copy@2x.png" mode="aspectFill"
              @click="copyOrderNo(item.order_no)" />
          </div>
          <div class="info-row">
            <span class="label">预约方式：</span>
            <!-- 根据图片改为“预约方式” -->
            <span class="value">{{ billingMethod(item.billing_method) }}</span>
          </div>
          <div class="info-row">
            <span class="label">预约场地：</span>
            <span class="value text-ellipsis">{{ item.venue_name }}</span>
          </div>
          <div class="info-row">
            <span class="label">预约时间：</span>
            <span class="value">{{ formatDate(item.order_time) }}</span>
          </div>

          <!-- 车辆状态为 1 时展示操作按钮 -->

          <div class="action-area" v-if="item.vehicle_state == 1">
            <!-- 状态 1、2：取消预约 + 开始驾驶 -->
            <template v-if="[1, 2].includes(item.reservation_status)">
              <van-button
                plain
                size="small"
                color="#34D2A5"
                text-color="#34D2A5"
                class="action-btn btn-cancel"
                @click="cancelOrder(item)"
              >
                取消预约
              </van-button>

              <div
     
                class="action-btn btn-start"
                @click="handleAction(item)"
              >
                开始驾驶
              </div>
            </template>

            <!-- 状态 3：结束驾驶 -->
            <van-button
              v-if="item.reservation_status == 3"
              type="primary"
              size="small"
              color="#34d2a5"
              class="action-btn btn-start"
              @click="overDrive(item)"
            >
              结束驾驶
            </van-button>

            <!-- 状态 4 且 is_reservation=1：申诉  -->
            <van-button
              v-if="item.reservation_status == 4 && item.is_reservation == 1"
              plain
              size="small"
              color="#34d2a5"
              text-color="#333"
              class="action-btn btn-appeal"
              @click="handleAppeal(item)"
            >
              申诉
            </van-button>
          </div>

          <!-- 车辆状态不为 1：等待中 -->
          <div class="action-area" v-else>
            <van-button
              plain
              size="small"
              color="#5BCC9B"
              text-color="#5BCC9B"
              class="action-btn btn-waiting"
              @click="handleAction(item)"
            >
              等待中
            </van-button>
          </div>
        </div>
      </van-list>

      <van-empty
        v-if="!loading && list.length === 0"
        description="暂无预约记录"
        image="search"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showFailToast } from "vant";
import NavBar from "@/components/CustomNavBar/index.vue";
import { formatDate, copyToClipboard } from "@/utils/utils";
import { GetReservationList } from "@/api/mine";
import {
  GetCarDetails,
  CancelReservation,
  StartDrive,
  CheckCar,
  LockCar,
} from "@/api/index";
import { billingMethod } from "@/utils/filter";

import icon_wait from "@/assets/images/reservation/icon_waiting@2x.png";
import icon_canceled from "@/assets/images/reservation/icon_canceled@2x.png";
import icon_driving from "@/assets/images/reservation/icon_driving@2x.png";
import icon_completed from "@/assets/images/reservation/icon_completed@2x.png";

const router = useRouter();
const statusText = (status) => {
  const map = {
    1: "等待中",
    2: "等待中",
    3: "驾驶中",
    4: "已完成",
    5: "已取消",
  };
  return map[status] || "";
};
const statusClass = (status) => {
  const map = {
    1: "tag-waiting",
    2: "tag-waiting",
    3: "tag-driving",
    4: "tag-completed",
    5: "tag-canceled",
  };
  return map[status] || "";
};
// 状态图标映射
const statusMap = {
  1: icon_wait,
  2: icon_wait,
  5: icon_canceled,
  3: icon_driving,
  4: icon_completed,
};

const list = ref([]);
const page = ref(1);
const pageSize = 10;
const loading = ref(false); // van-list 加载状态
const finished = ref(false); // van-list 是否加载完毕
const isRefreshing = ref(false); // van-pull-refresh 刷新状态
const flag = ref(false); // 防止重复点击

// 首次加载
onMounted(() => {
  refreshData();
});

// 下拉刷新
const onRefresh = async () => {
  isRefreshing.value = true;
  await refreshData();
  isRefreshing.value = false;
};

// 重置并刷新数据
const refreshData = async () => {
  page.value = 1;
  finished.value = false;
  list.value = [];
  await fetchData();
};

// van-list 的 @load 事件
const onLoad = async () => {
  if (isRefreshing.value) return;
  await fetchData();
};

// 获取列表数据
const fetchData = async () => {
  try {
    loading.value = true;

    const res = await GetReservationList({
      page: page.value,
      pageSize,
    });

    const content = res.data?.content || [];

    if (page.value === 1) {
      list.value = content;
    } else {
      list.value = list.value.concat(content);
    }

    if (content.length < pageSize) {
      finished.value = true;
    } else {
      page.value++;
    }
  } catch (error) {
    console.error("获取预约列表失败:", error);
    showFailToast("加载失败，请重试");
  } finally {
    loading.value = false;
  }
};

// 复制订单号
const copyOrderNo = async (text) => {
  try {
    await copyToClipboard(text);
    showToast("复制成功");
  } catch (err) {
    // 兼容不支持 clipboard API 的环境
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
    showToast("复制成功");
  }
};

// 开始驾驶
const handleAction = async (item) => {
  if (flag.value) return;
  flag.value = true;

  try {
    const { code, msg, data } = await CheckCar({ vehicle_id: item.vehicle_id });

    if (code == 200) {
      if (data.state == 0) {
        showToast(msg);
        flag.value = false;
        return;
      }
    }

    if (code != 200) {
      showToast(msg);
      flag.value = false;
      return;
    }

    const lockRes = await LockCar({ vehicle_id: item.vehicle_id });
    if (lockRes.code != 200) {
      showToast(lockRes.msg);
      flag.value = false;
      return;
    }

    const carRes = await GetCarDetails({ id: item.vehicle_id });

    if (carRes.code == 200) {
      localStorage.setItem("app_id", item.app_transmitter_id);
      localStorage.removeItem("loadingOne");
      localStorage.removeItem("sendNum");
      localStorage.setItem("carInfo", JSON.stringify(item));
      localStorage.setItem("carDetails", JSON.stringify(carRes.data));

      // 根据车型跳转不同驾驶页，请根据实际路由调整
      const path =
        carRes.data.vehicle_type == 31 ? "/earthmover/drive" : "/drive";

      router.push({
        path,
        query: {
          order_no: item.order_no,
          vehicle_id: item.vehicle_id,
        },
      });
    } else {
      showToast("联系客服，报错原因：" + carRes.msg);
    }
  } catch (error) {
    console.error(error);
    showToast("操作失败，请重试");
  } finally {
    flag.value = false;
  }
};

// 申诉
const handleAppeal = (item) => {
  if (item.reservation_status == 4 && item.is_reservation == 1) {
    router.push({
      path: "/orderAppeal",
      query: { order_no: item.order_no },
    });
  }
};

// 结束驾驶
const overDrive = async (item) => {
  try {
    const res = await StartDrive({
      order_no: item.order_no,
      type: 3,
      vehicle_id: item.vehicle_id,
    });

    if (res.code == 200) {
      showToast("结束驾驶成功");
    } else {
      showToast(res.msg);
    }

    refreshData();
  } catch (error) {
    console.error(error);
  }
};

// 取消预约
const cancelOrder = async (item) => {
  try {
    const res = await CancelReservation({ order_no: item.order_no });

    if (res.code == 200) {
      showToast("取消预约成功");
      refreshData();
    } else {
      showToast(res.msg);
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<!-- 样式部分保持原样，无需修改 -->
<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #fff;
  box-sizing: border-box;
}

.cont {
  background: #f2f5f8;
  padding: 25px;
  height: 100vh;
}

.mt {
  margin-top: 20px;
}

.order-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  position: relative;

  .title-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 16px;
      object-fit: cover;
    }

    .vehicle-name {
      font-family: PingFangSC, PingFang SC;
      font-weight: 600;
      font-size: 30px;
      color: #1a1a1a;
      line-height: 42px;
      text-align: left;
      font-style: normal;
    }

    .status-tag {
      display: inline-block;
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 24px;
      color: #ffffff;
      padding: 4px 16px;
      background: #797979;
      border-radius: 21px;
      margin-left: 16px;

      &.tag-waiting {
        background: #00a5ff;
      }
      &.tag-completed {
        background: #34d2a5;
      }
    }
  }

  // 信息行
  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    font-size: 24px;
    padding-left: 60px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 24px;
      color: #777777;
      line-height: 33px;
      text-align: left;
      font-style: normal;
    }

    .value {
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 24px;
      color: #1a1a1a;
      line-height: 33px;
      text-align: left;
      font-style: normal;
      margin-left: 10px;
      flex: 1;
    }

    .text-ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy-icon {
      width: 32px;
      height: 32px;
      margin-left: 10px;
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  // 底部按钮区域
  .action-area {
    right: 30px;
    bottom: 30px;
    display: flex;
    justify-content: flex-end;

    .action-btn {
      font-family: PingFangSC, PingFang SC;
      font-size: 30px;
      padding: 0 30px;
      border-radius: 36px;
      height: 72px;
    }

    .btn-cancel {
      height: 72px;
      border-radius: 36px;
      border: 1px solid #34d2a5;
      margin-right: 25px;
    }

    .btn-start {
      font-weight: 700;
      color: #1a1a1a;
      background: #34d2a5;
      text-align: center;
      padding: 0 30px;
      line-height: 72px;
    }
    .btn-appeal {
      width: 180px;
      height: 72px;
      line-height: 72px;
      border-radius: 36px;
      border: 1px solid #34D2A5;
    }
  }
}
</style>
