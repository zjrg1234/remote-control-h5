<template>
  <div class="page-container">
    <NavBar title="我的申诉"></NavBar>

    <div class="cont">
      <!-- 下拉刷新 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <!-- 滚动加载列表 -->
        <van-list
          v-model:loading="loading"
          :finished="finished"
          :finished-text="list.length > 10 ? '没有更多了' : ''"
          @load="onLoad"
        >
          <!-- 空状态提示 -->
          <van-empty
            v-if="!loading && list.length === 0"
            description="暂无申诉记录"
            image="search"
          />

          <!-- 列表项 -->
          <div
            class="order-item"
            v-for="(item, index) in list"
            :key="item.id || index"
          >
            <!-- 信息行 -->
            <div class="info-line">
              <span class="label">预约编号：</span>
              <span class="value text-ellipsis">{{ item.order_no }}</span>
              <img
                class="copy-icon"
                src="@/assets/images/common/icon_copy@2x.png"
                mode="aspectFill"
                @click="copyOrderNo(item.order_no)"
              />
            </div>

            <div class="info-line">
              <span class="label">预约类型：</span>
              <span class="value">{{
                getBillingText(item.billing_method)
              }}</span>
            </div>

            <div class="info-line">
              <span class="label">预约场地：</span>
              <span class="value text-ellipsis">{{ item.venue_name }}</span>
            </div>

            <div class="info-line">
              <span class="label">预约时间：</span>
              <span class="value">{{ dateTime(item.time) }}</span>
            </div>

            <div class="info-line">
              <span class="label">预约状态：</span>
              <span class="value">{{
                getAppealStatus(item.appeal_status)
              }}</span>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { showToast } from "vant";
import { GetAppealList } from "@/api/mine"; // 请根据实际路径调整
import { dateTime , copyToClipboard} from "@/utils/utils"; // 请根据实际路径调整
import NavBar from "@/components/CustomNavBar/index.vue";


// 状态定义
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = 10;

// 获取计费文案
const getBillingText = (type) => {
  const map = {
    0: "按时间计费",
    1: "按次计费",
  };
  return map[type] || "-";
};

// 获取申诉状态文案
const getAppealStatus = (type) => {
  // 申诉状态 0未申请 1待处理 2已处理
  const map = {
    0: "未申请",
    1: "待处理",
    2: "已处理",
  };
  return map[type] || "-";
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

// 核心加载逻辑 (van-list 触底触发)
const onLoad = async () => {
  try {
    const res = await GetAppealList({
      page: page.value,
      pageSize: pageSize,
    });

    const content = res.data?.content || [];

    // 追加数据
    list.value = [...list.value, ...content ,{
			"id": 1,
			                "uid": 9,
			                "order_no": "aaacasd13213121", //预约号
			                "venue_id": 1, 
			                "venue_name": "测试", //场地名称
			                "billing_method": 0, //计费方式 0按时间 1按次
			                "appeal_status": 2,//申诉状态 0未申请 1待处理 2已处理
			                "time": 1766747094 //时间

			}];

    // 判断是否还有下一页
    if (content.length < pageSize) {
      finished.value = true;
    } else {
      page.value++;
    }
  } catch (error) {
    console.error("加载失败:", error);
    showToast("加载失败，请重试");
  } finally {
    loading.value = false;
  }
};

// 下拉刷新逻辑 (van-pull-refresh 触发)
const onRefresh = async () => {
  page.value = 1;
  finished.value = false;
  list.value = [];
  await onLoad();
  refreshing.value = false;
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
  position: relative;
  margin-bottom: 10px;
  overflow: hidden;

  .info-line {
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
		width: 20px;
		height: 20px;
      margin-left: 5px;
      cursor: pointer;
      flex-shrink: 0;
    }
  }
}
</style>
