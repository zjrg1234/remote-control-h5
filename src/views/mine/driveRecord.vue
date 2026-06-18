<template>
  <div class="page-container">
    <!-- 使用 van-list 实现滚动加载 -->
    <NavBar title="驾驶记录" />
    <div class="cont">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :finished-text="list.length > 0 ? '没有更多了' : ''"
        @load="onLoad"
      >
        <!-- 空状态提示 -->
        <van-empty
          v-if="!loading && list.length === 0"
          description="暂无驾驶记录"
          image="search"
        />

        <!-- 列表项 -->
        <div
          class="order-item"
          v-for="(item, index) in list"
          :key="item.id || index"
        >
          <!-- 头像 + 用户名 -->
          <div class="header">
            <img class="avatar" :src="item.head_shot" alt="avatar" />
            <span class="username">{{ item.user_name }}</span>
          </div>

          <!-- 信息列表 -->
          <div class="info-list">
            <div class="info-item">
              <span class="label">预约编号：</span>
              <span class="value text-ellipsis">{{ item.order_no }}</span>
            </div>
            <div class="info-item">
              <span class="label">驾驶场地：</span>
              <span class="value text-ellipsis">{{ item.venue_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">驾驶车辆：</span>
              <span class="value text-ellipsis">{{ item.vehicle_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">预约类型：</span>
              <span class="value">{{
                billingMethod(item.billing_method)
              }}</span>
            </div>
            <div class="info-item">
              <span class="label">预约时间：</span>
              <span class="value">{{ formatDate(item.order_time) }}</span>
            </div>
            <div class="info-item">
              <span class="label">驾驶时长：</span>
              <span class="value">{{
                compareTimestamp(item.start_time, item.end_time).text
              }}</span>
            </div>
            <div class="info-item">
              <span class="label">消费电池：</span>
              <span class="value"
                >{{ paymentType(item.payment_type) }}
                {{ item.payment_amount }}</span
              >
            </div>
            <div class="info-item">
              <span class="label">开始时间：</span>
              <span class="value">{{ formatDate(item.start_time) }}</span>
            </div>
            <div class="info-item">
              <span class="label">结束时间：</span>
              <span class="value">{{ formatDate(item.end_time) }}</span>
            </div>
          </div>
        </div>
      </van-list>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { GetDrivingRecordlList } from "@/api/mine"; // 请根据实际路径调整
import { billingMethod, paymentType } from "@/utils/filter"; // 请根据实际路径调整
import { formatTime, compareTimestamp, formatDate } from "@/utils/utils"; // 请根据实际路径调整
import NavBar from "@/components/CustomNavBar/index.vue";

// ==================== 核心变量 ====================
const list = ref([]); // 列表数据
const loading = ref(false); // 控制 van-list 加载状态
const finished = ref(false); // 控制是否加载完毕
const page = ref(1); // 当前页码
const pageSize = 10; // 每页条数

// ==================== 核心加载逻辑 (van-list 触底触发) ====================
const onLoad = async () => {
  try {
    // 调用真实接口
    const res = await GetDrivingRecordlList({
      page: page.value,
      pageSize: pageSize,
    });

    const content = res.data?.content || [];
    // 追加数据
    list.value = [...list.value, ...content];
    // 判断是否还有下一页
    if (content.length < pageSize) {
      finished.value = true;
    } else {
      page.value++;
    }
  } catch (error) {
    console.error("加载失败:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;

  background: #fff;

  box-sizing: border-box;
}
.cont {
  background: #f2f4f7;
  padding: 10px;
  height: 100vh;
}
.order-item {
  background-color: #FFF;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;

  .header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      margin-right: 10px;
      object-fit: cover;
    }

    .username {
      font-weight: 600;
      font-size: 14px;
      color: #1a1a1a;
      line-height: 20px;
    }
  }

  .info-list {
    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-weight: 400;
        color: #777777;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .value {
        font-weight: 400;
        color: #1a1a1a;
        margin-left: 5px;
        flex: 1;
      }

      .text-ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
