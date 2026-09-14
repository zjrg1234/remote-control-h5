<template>
  <div class="container">
    <!-- 顶部 Banner -->
    <div class="banner-section">
      <van-image :src="imgUrl" class="banner-img" fit="cover">
        <template #loading>
          <div class="img-placeholder">
            <img :src="imgUrl" alt="" />
          </div>
        </template>
        <template #error>
          <div class="img-placeholder">
            <img src="@/assets/images/banner@2x.png" alt="" />
          </div>
        </template>
      </van-image>
    </div>

    <!-- 分类导航栏 (Sticky 吸顶 + 横向滚动) -->
    <!-- <div class="nav">
      <div class="sticky-nav-wrapper">
        <div class="nav-scroll">
          <div class="nav-list">
            <div
              v-for="(item, index) in categories"
              :key="index"
              class="nav-item"
              :class="{ active: currentCategory === item.id }"
              @click="handleCategoryClick(item)"
            >
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>
    </div> -->
    <p class="cont-tit">
      {{ $t("场地列表") }}
    </p>

    <!-- 核心改动：下拉刷新包裹瀑布流区域 -->
    <van-pull-refresh
      v-model="isRefreshing"
      @refresh="onRefresh"
      class="waterfall-scroll"
      success-text="刷新成功"
    >
      <!-- 骨架屏 -->
      <div v-if="loading && list.length == 0" class="skeleton-wrapper">
        <SkeletonCard v-for="i in 6" :key="'s-' + i"  />
      </div>

      <!-- 瀑布流列表区域 -->
      <div v-else class="waterfall-container">
        <div v-if="list.length === 0 && !loading" class="empty-state">
          <img
            class="empty-img"
            src="@/assets/images/common/car@2x.png"
            alt="empty"
          />
          <span class="empty-text">暂时没有内容哦～</span>
        </div>

        <!-- 直接 v-for，不再用 column 包裹 -->
        <div
          v-for="(item, index) in list"
          :key="index"
          class="card-item"
          @click="handleCar(item)"
        >
          <img
            :src="item.venue_image[0]"
            class="card-img"
            loading="lazy"
            alt="venue"
          />

          <div class="card-info">
            <div class="title">{{ item.venue_name }}</div>
            <div class="meta">
              <span class="status online">在线 {{ item.online }} 辆</span>
              <span class="drivers">驾驶中 {{ item.driving }} 辆</span>
            </div>
          </div>
        </div>
      </div>
    </van-pull-refresh>

    <!-- <NoticePopup v-model="showNotice" title="公告" :content="noticeContent" :is-rich-text="false" /> -->
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";
import { useRouter } from "vue-router";

import {
  GetHomeBanner,
  GetHomeTabTitle,
  GetHomeDataList,
  GetNotice,
} from "@/api/index";

// import NoticePopup from '@/components/notice-popup/notice-popup.vue';
import SkeletonCard from "@/components/skeleton-card/skeleton-card.vue";
import { shouldFetchNotice, resetNoticeFlag } from "@/utils/notice";

const router = useRouter();

// --- 数据定义 ---
const categories = ref([]);
const currentCategory = ref("");
const list = ref([]);

const page = ref(1);
const loading = ref(false);
const noMore = ref(false);
const imgUrl = ref("");
const isRefreshing = ref(false);
const totalData = ref([]);

const showNotice = ref(false);
const noticeContent = ref("");
const isLoggedIn = ref(!!localStorage.getItem("token"));

const fetchData = async (isRefresh = false) => {
  if (loading.value || noMore.value) return;

  loading.value = true;
  if (isRefresh) {
    page.value = 1;
    noMore.value = false;
    await nextTick(() => {
      list.value = [];
    });
  }

  try {
    const {
      code,
      data: { venueList },
    } = await GetHomeDataList({ type: currentCategory.value, size: 9999 });
    if (venueList && currentCategory.value == "") {
      totalData.value = venueList;
    }
    if (code == 200) {
      if (venueList && venueList.length) {
        venueList.forEach((item, index) => {
          list.value.push(item);
        });
      }
    } else if (isRefresh) {
      noMore.value = true;
    }
  } catch (error) {
    console.error("获取数据失败", error);
  } finally {
    loading.value = false;
  }
};

// 下拉刷新逻辑 (配合 van-pull-refresh)
const onRefresh = async () => {
  try {
    await fetchData(true);
  } finally {
    isRefreshing.value = false; // 关闭刷新状态
  }
};

const handleCar = (item) => {
  localStorage.setItem("carTitle", item.venue_name);
  // Vue 3 路由跳转
  router.push({ path: "/car", query: { id: item.id } });
};

// 生命周期 (替代 uni-app 的 onLoad)
onMounted(() => {
  categories.value = [{ name: "全部", id: "" }];

  GetHomeBanner()
    .then((res) => {
      imgUrl.value = res.data[0]?.image;
    })
    .catch(() => {});
  GetHomeTabTitle()
    .then((res) => {
      categories.value = [...categories.value, ...res.data];
    })
    .catch(() => {});
  fetchData();

  if (shouldFetchNotice(isLoggedIn.value)) {
    getNotice();
  }
});

const getNotice = () => {
  GetNotice()
    .then((res) => {
      if (res.data && res.data.status == 1) {
        showNotice.value = true;
        noticeContent.value = res.data.content;
      }
    })
    .catch(() => {
      resetNoticeFlag();
    });
};
</script>

<style lang="scss" scoped>
/* 全局容器：撑满屏幕 */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(236deg, #34d2a5 0%, #e3ffe6 100%);
  overflow: hidden;
  padding: 0 20px;
}

.banner-section {
  width: 100%;
  height: 200px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 10px;

  .banner-img {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.img-placeholder {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 12px;
}

.nav {
  margin-top: -30px; /* -60rpx / 2 */
}

/* 导航栏核心样式 */
.sticky-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 99;
  background-color: #fff;
  box-shadow: 0px -2px 10px 0px rgba(0, 0, 0, 0.1); /* -4rpx 20rpx / 2 */
  border-radius: 20px 20px 0px 0px; /* 40rpx / 2 */
  flex-shrink: 0;
  border-bottom: 0.5px solid #f6f6f6; /* 1rpx / 2 */
}

.cont-tit {
  font-family: YouSheBiaoTiHei;
  font-size: 30px;
  color: #222222;
  line-height: 39px;
  text-align: left;
  font-style: normal;
  font-weight: 700;
  padding-top: 35px;
  position: relative;
  min-width: 100px;
  padding-bottom: 5px;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    height: 5px;
    min-width: 100px;
    background: linear-gradient(270deg, rgba(52, 210, 165, 0) 0%, #34d2a5 100%);
    border-radius: 3px; /* 可选：圆角让横线更柔和 */
  }
}
/* 隐藏横向滚动条 */
.nav-scroll {
  width: 100%;
  white-space: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-list {
  display: inline-flex;
  padding: 0 10px; /* 20rpx / 2 */
  height: 44px; /* 88rpx / 2 */
  align-items: center;
}

.nav-item {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  display: inline-block;
  padding: 0 15px; /* 30rpx / 2 */
  font-size: 14px; /* 28rpx / 2 */
  color: #777;
  position: relative;
  flex-shrink: 0;
  line-height: 44px; /* 88rpx / 2 */
  cursor: pointer;

  &.active {
    color: #1a1a1a;
    font-weight: 500;
    font-size: 15px; /* 30rpx / 2 */

    &::after {
      content: "";
      position: absolute;
      bottom: 5px; /* 10rpx / 2 */
      left: 50%;
      transform: translateX(-50%);
      width: 15.5px; /* 31rpx / 2 */
      height: 2.5px; /* 5rpx / 2 */
      background-color: #000;
      border-radius: 1px; /* 2rpx / 2 */
    }
  }
}

/* 下拉刷新容器占据剩余空间 */
.waterfall-scroll {
  flex: 1;
  height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 骨架屏：两列 Grid */
.skeleton-wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 10px;
}

/* 瀑布流：两列 Grid */
.waterfall-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding-top: 15px; 
  padding-bottom: 165px;
}

/* 空状态：跨满两列 */
.empty-state {
  grid-column: 1 / -1; /* 关键：让空状态占据整行 */
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;

  .empty-img {
    width: 150px;
    margin-bottom: 10px;
  }

  .empty-text {
    font-size: 14px;
    color: #999;
  }
}

/* 卡片样式 */
.card-item {
  overflow: hidden;
  background: linear-gradient(253deg, #ffffff 0%, #d9fff2 100%);
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  cursor: pointer;
  height: 476px;

  .card-img {
    width: 345px;
    height: 345px;
    display: block;

    object-fit: cover;
  }

  .card-info {
    padding: 20px 0 8px 20px;
    width: 100%;
    box-sizing: border-box;
    .title {
      font-family: PingFangSC, PingFang SC;
      font-weight: 600;
      font-size: 30px;
      color: #222222;
      line-height: 42px;
      text-align: left;
      font-style: normal;
    }

    .meta {
      padding-top: 8px;
      span {
        font-family: PingFangSC, PingFang SC;
        font-weight: 400;
        font-size: 24px;
        color: #ffffff;
        line-height: 33px;
        padding: 4px 20px;
      }
      .online {
        background: #3dbf9a;
        border-radius: 20px;
      }
      .drivers {
        background: #58bbf1;
        border-radius: 20px;
        margin-left: 12px;
      }
    }
  }
}
</style>
