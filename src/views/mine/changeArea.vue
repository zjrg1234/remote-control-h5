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
        <img class="car-img" :src="item.image" alt="car" />
        <div class="info">
          <div class="flex">
            <span class="name">{{ item.agent_name }}</span>
            <span class="price">￥{{ item.balance }}</span>
          </div>

          <span class="desc">分区数 <span class="line"></span> {{ item.partitions_number }} 个</span>
          <span class="desc">车辆数 <span class="line"></span> {{ item.vehicles_number }} 辆</span>
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
import { showToast } from "vant";
import { GetSpecialList, ChangeSpecialList } from "@/api/mine";
import { useUserStore } from "@/store/modules/user";
import NavBar from "@/components/CustomNavBar/index.vue";

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
    const res = await GetSpecialList(queryParams);
    list.value = [...list.value, ...res.data];
    if (queryParams.size > res.data.length) {
      noData.value = true;
    }
  } catch (error) {
    console.error("获取列表失败:", error);
  }
};

// 增加防抖定时器变量
let scrollTimer = null;

// 触底加载逻辑
const handleScroll = () => {
  // 如果正在加载或已经没有更多数据，直接返回
  if (noData.value || loading.value) return;

  // 增加防抖，避免滚动事件高频触发
  if (scrollTimer) clearTimeout(scrollTimer);

  scrollTimer = setTimeout(() => {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // 判断内容是否超出屏幕。
    // 如果内容没有超出屏幕（即没有产生滚动条），则不触发加载，防止首次加载后立刻触发第二次
    if (scrollHeight <= clientHeight) return;

    // 距离底部 100px 时触发
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loading.value = true;
      queryParams.page++;

      // 直接调用接口，去掉了不必要的 setTimeout 延迟
      getSpecialList().finally(() => {
        loading.value = false;
      });
    }
  }, 100); // 100ms 防抖
};

onMounted(() => {
  getSpecialList();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  // 组件销毁时清除定时器，防止内存泄漏
  if (scrollTimer) clearTimeout(scrollTimer);
});

const confirm = () => {
  if (userStore.areaId == selected.value) return;
  const obj = list.value.find((item) => item.id == selected.value);
  if (!obj) return;
  name.value = obj.agent_name;
  tipVisible.value = true;
};

const handleConfirm = async () => {
  const obj = { special_id: selected.value };
  try {
    const res = await ChangeSpecialList(obj);
    if (res.code == 200) {
      userStore.setAreaId(selected.value);
      showToast("变更专区成功");
    } else {
      showToast(res.msg);
    }
  } catch (error) {
    console.error("变更专区失败:", error);
  }
};
</script>

<style lang="scss" scoped>
.container {
  background: #ffffff;
  min-height: 100vh;
  padding-bottom: 240px; // 给底部按钮留出空间
}

.loading-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

/* 网格布局：一行一个 */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 25px;
  padding: 25px;
}

.grid-item {
  background: #fff;

  overflow: hidden;
  border: 1px solid transparent;
  transition: border-color 0.2s;
  cursor: pointer;

  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  display: flex;
  justify-content: flex-start;
  padding: 20px;

  &.active {
    border-color: #34d2a5;
    position: relative;
  }

  .car-img {
    flex: 0 0 136px;
    width: 136px;
    height: 136px;
    object-fit: cover;
    display: block;
    box-sizing: border-box;
    border-radius: 8px;
  }

  .info {
    padding-left: 20px;
    font-size: 26px;
    width: 100%;

    .flex {
      display: flex;
      justify-content: space-between;
    }

    .name {
      display: block;
      font-family: PingFangSC, PingFang SC;
      font-weight: 700;
      font-size: 30px;
      color: #1a1a1a;
      line-height: 32px;
      margin-bottom: 20px;
    }

    .desc {
      display: block;
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 24px;
      color: #1a1a1a;

      &:first-of-type {
        margin-bottom: 16px;
      }
      .line {
          height: 20px;
          border: 1px solid rgba(153,153,153,0.6);
          display: inline-block;
          margin: 0 10px;
      } 
    }

    .price {
      display: block;
      font-family: PingFangSC, PingFang SC;
      font-weight: 600;
      font-size: 28px;
      color: #1a1a1a;
      line-height: 32px;
    }
  }

  /* 选中标记 */
  &.active::after {
    content: " ";
    position: absolute;
    bottom: 0;
    right: -2px;
    width: 48px;
    height: 34px;
    background-image: url("@/assets/images/icon_check@2x.png");
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
  }
}

/* 底部按钮 */
.btn-wrap {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 20px;
  width: calc(100% - 40px);

  .confirm-btn {
    width: 100%;
    height: 90px;
    line-height: 90px;
    border: none;
    font-family: PingFangSC, PingFang SC;
    font-weight: 700;
    font-size: 32px;
    color: #1a1a1a;

  }
}

.dialog-content {
  padding: 20px 40px;

  .text {
    text-align: left;
    color: #333;
    font-weight: 400;
    font-size: 28px;
    line-height: 1.6;
    margin: 0;

    & + .text {
      margin-top: 16px;
    }
  }
}
</style>
