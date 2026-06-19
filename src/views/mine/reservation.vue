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
        

        <!-- 列表项 -->
        <div
          class="order-item"
          v-for="(item, index) in list"
          :key="item.order_no || index"
          :class="{ active: item.reservation_status === 4 }"
        >
          <!-- 状态角标 -->
          <div class="corner-tag" v-if="statusMap[item.reservation_status]">
            <img
              class="tag-img"
              :src="statusMap[item.reservation_status]"
              alt="status"
            />
          </div>

          <!-- 标题 -->
          <div class="title-row">
            <span class="vehicle-name">{{ item.vehicle_name }}</span>
          </div>

          <!-- 信息行 -->
          <div class="info-row">
            <span class="label">预约编号：</span>
            <span class="value text-ellipsis">{{ item.order_no }}</span>

            <img
              class="copy-icon"
              src="@/assets/images/common/icon_copy@2x.png"
              mode="aspectFill"
              @click="copyOrderNo(item.order_no)"
            />
            <van-icon
              name="copy"
              size="14"
              color="#999"
              class="copy-icon"
              @click="copyOrderNo(item.order_no)"
            />
          </div>

          <div class="info-row">
            <span class="label">预约类型：</span>
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

          <!-- 操作按钮区域 -->
          <div class="action-area">
            <!-- 状态 1 或 2：开始驾驶 -->
            <van-button
              v-if="[1, 2].includes(item.reservation_status)"
              type="primary"
              size="small"
              color="#FFC838"
              class="action-btn"
              @click="handleAction(item)"
            >
              开始驾驶
            </van-button>

            <!-- 状态 4 且 is_reservation=1：申诉 -->
            <van-button
              v-if="item.reservation_status === 4 && item.is_reservation === 1"
              plain
              size="small"
              color="#FFC838"
              text-color="#FFC838"
              class="action-btn"
              @click="handleAppeal(item)"
            >
              申诉
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { showToast, showFailToast } from "vant";
import NavBar from "@/components/CustomNavBar/index.vue";

import { GetReservationList } from "@/api/mine"; // 假设你的 api 路径
import { formatDate, copyToClipboard } from "@/utils/utils";
import { billingMethod } from "@/utils/filter";

import icon_wait from "@/assets/images/reservation/icon_waiting@2x.png";
import icon_canceled from "@/assets/images/reservation/icon_canceled@2x.png";
import icon_driving from "@/assets/images/reservation/icon_driving@2x.png";
import icon_completed from "@/assets/images/reservation/icon_completed@2x.png";

const router = useRouter();

// 状态映射表
const statusMap = {
  2: icon_wait,
  5: icon_canceled,
  3: icon_driving,
  4: icon_completed,
};

// 数据定义
const list = ref([]);
const loading = ref(false); // 控制 van-list 加载状态
const finished = ref(false); // 控制是否加载完毕
const page = ref(1);
const pageSize = 10;


// 复制订单号
const copyOrderNo = async (text) => {
  try {
    await copyToClipboard(text);
    showToast("复制成功");
  } catch (err) {
    // 兼容不支持 clipboard API 的环境 (如部分旧版 WebView)
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
    showToast("复制成功");
  }
};

// 按钮点击：开始驾驶 (根据业务需求补充逻辑)
const handleAction = (item) => {
  console.log("开始驾驶", item);
  // TODO: 跳转到驾驶页面
};

// 按钮点击：申诉
const handleAppeal = (item) => {
  router.push({
    path: "/orderAppeal",
    query: { order_no: item.order_no },
  });
};

// 【修复3】核心加载逻辑优化
const onLoad = async () => {

  try {
    const res = await GetReservationList({
      page: page.value,
      pageSize: pageSize,
    });

    const content = res.data?.content || [];

    // 追加数据
    list.value = [...list.value, ...content];

    // 【修复4】无论是否还有下一页，页码都应该递增（防止下次加载拿到重复数据）
    page.value++;

    // 判断是否还有下一页
    if (content.length < pageSize) {
      finished.value = true;
    }
  } catch (error) {
    console.error("加载失败:", error);
    showFailToast("加载失败，请重试");
  } finally {
    // 确保加载状态被正确关闭
    loading.value = false;
  }
};

// 【修复5】删除了原有的 onMounted 中的 onLoad() 调用，交由 van-list 自动触发首次加载
</script>

<!-- 样式部分保持原样，无需修改 -->
<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #fff;
  box-sizing: border-box;
}
.cont {
  background: #f2f4f7;
  padding: 10px;
  height: 100vh;
}
.order-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 10px;
  position: relative;
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid transparent;

  &.active {
    border-color: #409eff;
  }

  // 右上角角标
  .corner-tag {
    position: absolute;
    top: 0;
    right: 0;
    width: 42px;
    height: 42px;
    z-index: 1;

    .tag-img {
      width: 100%;
      height: 100%;
      display: block;
    }
  }

  // 标题
  .title-row {
    margin-bottom: 10px;
    padding-right: 70px;

    .vehicle-name {
      font-weight: 500;
      font-size: 14px;
      color: #333;
    }
  }

  // 信息行
  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    font-size: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: #777;
      white-space: nowrap;
    }

    .value {
      color: #333;
      margin-left: 4px;
      flex: 1;
    }

    .text-ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy-icon {
      width: 16px;
      height: 16px;
      margin-left: 5px;
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  // 底部按钮区域
  .action-area {
    position: absolute;
    right: 15px;
    bottom: 15px;
    display: flex;
    justify-content: flex-end;

    .action-btn {
      height: 28px;
      padding: 0 12px;
      font-size: 12px;
      border-radius: 6px;
    }
  }
}
.mt {
  margin-top: 10px;
}
</style>