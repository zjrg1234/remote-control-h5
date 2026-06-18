<template>
  <div class="container">
    <NavBar title="变更专区"></NavBar>

    <!-- 网格列表 -->
    <div class="grid">
      <div
        class="grid-item"
        v-for="item in list"
        :key="item.id"
        :class="{ active: selected === item.id }"
        @click="selected = item.id"
      >
        <img
          class="car-img"
          src="@/assets/images/common/car@2x.png"
          alt="car"
        />
        <div class="info">
          <span class="name">{{ item.agent_name }}</span>
          <span class="desc">分区数 ｜ {{ item.partitions_number }} 个</span>
          <span class="desc">车辆数 ｜ {{ item.vehicles_number }} 辆</span>
          <span class="price">剩余金额 ￥{{ item.balance }}</span>
        </div>
      </div>
    </div>

    <!-- 底部加载/无数据状态 -->
    <div class="loading-layout" v-if="list.length || noData">
      <van-loading v-if="!noData" type="spinner" color="#1989fa"
        >加载中...</van-loading
      >
      <!-- <van-empty v-else description="没有更多了" image="search" /> -->
    </div>

    <!-- 底部确定按钮 -->
    <div class="btn-wrap">
      <button class="confirm-btn common-btn" @click="confirm">确定</button>
    </div>

    <!-- 提示弹窗 -->
    <van-dialog
      v-model:show="tipVisible"
      title="提示"
      show-cancel-button
      @confirm="handleConfirm"
    >
      <div class="dialog-content">
        <p class="text">
          变更专区后您所有的账户数据不会转移到新的专区（您稍后也可自行变更到当前专区）
        </p>
        <p class="text">确定变更到专区「{{ name }}」吗?</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { showSuccessToast, showFailToast } from "vant";


import { GetSpecialList, ChangeSpecialList } from "@/api/mine";
import { useUserStore } from "@/store/modules/user";
import NavBar from "@/components/CustomNavBar/index.vue";
// Vant 4 组件按需引入（如果你使用了 unplugin-vue-components 自动导入，可删除以下 import）
// import { Loading as VanLoading, Empty as VanEmpty, Button as VanButton, Dialog as VanDialog } from 'vant';

const userStore = useUserStore();

const list = ref([]);
const selected = ref(userStore.areaId);

const name = ref("");
const tipVisible = ref(false);
const loading = ref(false);
const noData = ref(false);

const queryParams = {
  page: 1,
  size: 12,
};

// 获取列表数据
const getSpecialList = async () => {
  try {
    const res = await GetSpecialList(queryParams); // 建议将 queryParams 传给后端
    list.value = [...list.value, ...res.data];
    if (queryParams.size > res.data.length) {
      noData.value = true;
    }
  } catch (error) {
    console.error("获取列表失败:", error);
  }
};

// 触底加载逻辑 (替代 onReachBottom)
const handleScroll = () => {
  const scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;

  // 距离底部 100px 时触发
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    if (noData.value || loading.value) return;

    loading.value = true;
    queryParams.page++;

    // 模拟防抖/延迟，实际开发中建议直接调用接口
    setTimeout(async () => {
      await getSpecialList();
      loading.value = false;
    }, 500);
  }
};

onMounted(() => {
  getSpecialList();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

// 确认按钮点击
const confirm = () => {
  showSuccessToast("更换专区成功");

  if (userStore.areaId == selected.value) return;
  const obj = list.value.find((item) => item.id == selected.value);
  if (!obj) return;
  name.value = obj.agent_name;
  tipVisible.value = true;
};

// 弹窗确认回调
const handleConfirm = async () => {

  const obj = { special_id: selected.value };
  try {
    const res = await ChangeSpecialList(obj);
    if (res.code == 200) {
      userStore.setAreaId(selected.value);
    } else {
      showFailToast(res.msg);
    }
  } catch (error) {
    console.error("变更专区失败:", error);
  }
};
</script>

<style lang="scss" scoped>
.container {
  background-color: #f2f5f8;
  min-height: 100vh;
  padding-bottom: 120px; // 给底部按钮留出空间
}

.loading-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

/* 网格布局 */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  padding: 5px 10px;
}

.grid-item {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s;
  cursor: pointer;

  &.active {
    border-color: #ffc838;
    position: relative;
  }

  .car-img {
    width: 100%;
    height: 88px;
    object-fit: cover;
    display: block;
    padding: 5px;
    box-sizing: border-box;
    border-radius: 4px;
  }

  .info {
    padding: 0 5px 5px 5px;
    font-size: 13px;

    .name {
      display: block;
      font-weight: 400;
      font-size: 14px;
      color: #333; // 替换 $uni-color-1
      margin-bottom: 2px;
    }

    .desc {
      display: block;
      color: #666;
      margin: 3px 0;
      line-height: 1.2;
      font-size: 12px;
    }

    .price {
      display: block;
      color: #ff8800;
      font-weight: 500;
      margin-top: 4px;
      line-height: 1.2;
      font-size: 12px;
    }
  }

  /* 选中标记 */
  &.active::after {
    content: " ";
    position: absolute;
    bottom: 0;
    right: -1px;
    width: 25px;
    height: 20px;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGYAAABQCAMAAADcIvDgAAAAnFBMVEUAAAD+xzj/yjb/wD//0DH/yDf/yDj/yDj/yDj/yTj/yDf/yTn/yTj/yDj/yTn/xzj/yDj/yDj/yDj/yTj/yDj/yDf/yDj/yDf/yTj/yDj/yTn/yDgaGholIhseHRr6xTfzvzbfsDNtWSQwKx2dfStKPiDquDWzji5gTyPXqjO8lS9VRyE5MR7GnDGphy19ZSc/Nh/OozKTdimIbShPW8HqAAAAG3RSTlMA/hkJBPHj18qXbEX6flst9evBroo4IxK5ok5DxgZVAAACLUlEQVRo3rzVOQKCQBQEUWRYxwFUFNC6/z0Nf2BkUPQFXlZdnbE0ViesHqj8Xe+cwOQLPpNW8JmlB5+ZW3ymeYLP1A/wmVcHPpMLPpPe4DPbgMpEXnxmuuAz+womE3nxmfmGyUReRCbyojKRF5/JBZOJvPjM1oPPfFp8ppnAZ/YDfGbpMJnIi880I/hMPaAycZM+kws+k1bwma3HZCIvJhM36TP7gcrETfrMXPCZNPL/lLz8zsrLtzZz21UQBqJoxONRYjwaXweQ+00Q1P//txPTkikMNHZC12NNWAp072nMS7+v2RqcwvVEjed5QYUaK/FSJd6HlKU5780sXsHR/H0bL09fWO54hy3ESztYQlzjTOF66kBYyhsgq8dLIS2xaoG1a/IxWDagwpjCdaSeoBtbgHHIb7MkDmGWl7S8YYJ5vESfF6nPYYa3tLxgilm84H1pIpiy6aQlBYL5Ib8Q10qiqSUWHwQPoJjHyy2Tnmq8PFgKmIExhYfS4z9VSykXa5iDEy/hXV6yXViiMOKFfHXyAymMeKEPIsfHtQAjXshrlff48i3AjRfcJKKQcSvNwp3Ccct3oirVYKCwpnAMMCTTWXbmh3wkVS0haNgzp3AsFyxkDVfOIR8psJC1uDRejKh9LGQNR3LINyQq/SbdgJ7dD5nCbeCSmrTBxRn/1WaJE5nCbXDYknixwK9jEC98y5nUpAUOjhIvtrictkpNWmLnOqQmVzbsr+5R2fv/YJisvL6xvsMAAAAASUVORK5CYII=);
    background-size: cover;
    background-repeat: no-repeat;
  }
}

/* 底部按钮 */
/* 底部按钮 */
.btn-wrap {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;

  .confirm-btn {
    width: 702px;
    height: 45px;
    line-height: 45px;
    border: none;
    font-family: PingFangSC, PingFang SC;
    font-weight: 500;
    font-size: 16px;
    color: #1a1a1a;
  }
}

.dialog-content {
  padding: 10px 20px;

  .text {
    text-align: left;
    color: #333;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;

    & + .text {
      margin-top: 8px;
    }
  }
}


</style>
