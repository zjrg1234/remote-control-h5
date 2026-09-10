<template>
  <div class="container">
    <!-- 顶部 Banner -->
    <div class="banner-section">
      <img :src="imgUrl" class="banner-img" loading="lazy" alt="" />
    </div>

    <!-- 分类导航栏（吸顶 + 横向滚动） -->
    <div class="nav">
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
    </div>

    <!-- 滚动区域 + 下拉刷新 -->
    <div class="scroll-body">
      <van-pull-refresh
        v-model="isRefreshing"
        class="waterfall-refresh"
        success-text="刷新成功"
        @refresh="onRefresh"
      >
        <!-- 骨架屏 -->
        <div
          v-if="loading && leftList.length === 0 && rightList.length === 0"
          class="skeleton-wrapper"
        >
          <div class="column col-left">
            <SkeletonCard />
            <SkeletonCard
              v-for="i in 3"
              :key="'s-left-' + i"
              card-height="270px"
            />
          </div>
          <div class="column col-right">
            <SkeletonCard
              v-for="i in 4"
              :key="'s-right-' + i"
              card-height="270px"
            />
          </div>
        </div>

        <!-- 瀑布流列表 -->
        <div v-else class="waterfall-container">
          <!-- 空状态 -->
          <div
            v-if="leftList.length === 0 && rightList.length === 0 && !loading"
            class="empty-state"
          >
            <img
              class="empty-img"
              src="@/assets/images/common/car@2x.png"
              alt=""
            />
            <span class="empty-text">{{ t("nodata") }}</span>
          </div>

          <!-- 左列 -->
          <div class="column col-left">
            <div
              v-for="(item, index) in leftList"
              :key="'left-' + index"
              class="card-item"
              @click="handleCar(item)"
            >
              <img
                :src="item.venue_image[0]"
                class="card-img"
                loading="lazy"
                alt=""
              />
              <div class="meta">
                <span class="status online"></span>
                <span>{{ t("在线") }}{{ item.online }}</span>
                <span class="divider">|</span>
                <span class="drivers">{{ t("驾驶") }}{{ item.driving }}</span>
              </div>
              <div class="card-info">
                <div class="title-tags">
                  <span class="title">{{ item.venue_name }}</span>
                  <span class="tag">{{ item.labels }}</span>
                </div>
                <div class="num">
                  <img
                    src="@/assets/images/common/icon_queue@2x.png"
                    class="icon"
                    loading="lazy"
                    alt=""
                  />
                  <span class="text">{{ t("排队", { num: item.online }) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 右列 -->
          <div class="column col-right">
            <div
              v-for="(item, index) in rightList"
              :key="'right-' + index"
              class="card-item"
              @click="handleCar(item)"
            >
              <img
                :src="item.venue_image[0]"
                class="card-img"
                loading="lazy"
                alt=""
              />
              <div class="meta">
                <span class="status online"></span>
                <span>{{ t("在线") }}{{ item.online }}</span>
                <span class="divider">|</span>
                <span class="drivers">{{ t("驾驶") }}{{ item.driving }}</span>
              </div>
              <div class="card-info">
                <div class="title-tags">
                  <span class="title">{{ item.venue_name }}</span>
                  <span class="tag">{{ item.labels }}</span>
                </div>
                <div class="num">
                  <img
                    src="@/assets/images/common/icon_queue@2x.png"
                    class="icon"
                    loading="lazy"
                    alt=""
                  />
                  <span class="text">{{ t("排队", { num: item.online }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 公告弹窗（替代 uni-app 的 NoticePopup） -->
    <van-dialog
      v-model:show="showNotice"
      title="公告"
      confirm-button-text="知道了"
      :show-cancel-button="false"
    >
      <div class="notice-content" v-html="noticeContent"></div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import SkeletonCard from "@/components/skeleton-card/skeleton-card.vue";

import {
  GetHomeBanner,
  GetHomeTabTitle,
  GetHomeDataList,
  GetNotice,
} from "@/api/index";

import { throttle } from "@/utils/system";
import { shouldFetchNotice, resetNoticeFlag } from "@/utils/notice";

const { t } = useI18n();
const router = useRouter();

// --- 数据定义 ---
const categories = ref([]);
const currentCategory = ref("");

const leftList = ref([]);
const rightList = ref([]);
const page = ref(1);
const loading = ref(false);
const noMore = ref(false);
const imgUrl = ref("");
const isRefreshing = ref(false);
const totalData = ref([]);

const showNotice = ref(false);
const noticeContent = ref("");
const isLoggedIn = ref(!!localStorage.getItem("token"));

// --- 工具：左右列分发 ---
const distribute = (list) => {
  list.forEach((item, index) => {
    if (index % 2 === 0) {
      leftList.value.push(item);
    } else {
      rightList.value.push(item);
    }
  });
};

// --- 获取列表数据 ---
const fetchData = async (isRefresh = false) => {
  if (loading.value || noMore.value) return;

  loading.value = true;

  if (isRefresh) {
    page.value = 1;
    noMore.value = false;
    await nextTick();
    leftList.value = [];
    rightList.value = [];
  }

  try {
    const res = await GetHomeDataList({
      type: currentCategory.value,
      size: 9999,
    });
    const { code, data } = res || {};
    const venueList = data?.venueList || [];

    if (venueList.length && currentCategory.value === "") {
      totalData.value = venueList;
    }

    if (code === 200) {
      if (venueList.length) {
        distribute(venueList);
      } else if (currentCategory.value !== "") {
        // 分类无数据时兜底展示全部
        distribute(totalData.value);
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

// --- 下拉刷新 ---
const onRefresh = async () => {
  isRefreshing.value = true;
  try {
    await fetchData(true);
  } finally {
    isRefreshing.value = false;
  }
};

// --- 分类点击（节流 300ms） ---
const handleCategoryClick = throttle((item) => {
  if (currentCategory.value === item.id) return;
  currentCategory.value = item.id;
  noMore.value = false;
  fetchData(true);
}, 300);

// --- 跳转详情 ---
const handleCar = (item) => {
  localStorage.setItem("carTitle", item.venue_name);
  router.push({ path: "/car", query: { id: item.id } });
};

// --- 公告 ---
const getNotice = () => {
  GetNotice()
    .then((res) => {
      if (res?.data && res.data.status === 1) {
        showNotice.value = true;
        noticeContent.value = res.data.content;
      }
    })
    .catch(() => {
      resetNoticeFlag();
    });
};

// --- 生命周期（替代 onLoad） ---
onMounted(() => {
  categories.value = [{ name: t("全部"), id: "" }];

  GetHomeBanner()
    .then((res) => {
      imgUrl.value = res?.data?.[0]?.image || "";
    })
    .catch(() => {});

  GetHomeTabTitle()
    .then((res) => {
      categories.value = [...categories.value, ...(res?.data || [])];
    })
    .catch(() => {});

  fetchData();

  if (shouldFetchNotice(isLoggedIn.value)) {
    getNotice();
  }
});
</script>

<style lang="scss" scoped>
/* 全局容器：撑满屏幕 */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;
  overflow: hidden;
}

/* Banner 区域 */
.banner-section {
  width: 100%;
  height: 140px;
  overflow: hidden;
  flex-shrink: 0;

  .banner-img {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.nav {
  margin-top: -30px;
  position: relative;
  z-index: 99;
}

/* 导航栏 */
.sticky-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 99;
  background-color: #fff;
  box-shadow: 0 -2px 10px 0 rgba(0, 0, 0, 0.1);
  border-radius: 20px 20px 0 0;
  flex-shrink: 0;
  border-bottom: 1px solid #f6f6f6;
}

.nav-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  /* 隐藏滚动条 */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-list {
  display: inline-flex;
  padding: 0 10px;
  height: 44px;
  align-items: center;
}

.nav-item {
  display: inline-block;
  padding: 0 15px;
  font-size: 14px;
  font-weight: 400;
  color: #777;
  position: relative;
  flex-shrink: 0;
  line-height: 44px;
  cursor: pointer;

  &.active {
    color: #1a1a1a;
    font-weight: 500;
    font-size: 15px;

    &::after {
      content: "";
      position: absolute;
      bottom: 5px;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 3px;
      background-color: #000;
      border-radius: 1px;
    }
  }
}

/* 滚动容器：占据剩余空间 */
.scroll-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.waterfall-refresh {
  min-height: 100%;
}

/* 瀑布流布局 */
.waterfall-container {
  display: flex;
  padding: 5px;
  padding-top: 10px;
  gap: 5px;
  background-color: #fff;

  .column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}

.col-left {
  .card-item {
    &:first-child {
      height: 200px;

      .card-img {
        width: 100%;
        height: 200px !important;
        display: block;
      }
    }
  }
}

/* 卡片样式 */
.card-item {
  position: relative;
  overflow: hidden;
  background: #e9e9e9;
  border-radius: 8px;
  height: 270px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  cursor: pointer;

  .card-img {
    position: absolute;
    inset: 0;
    height: 100%;
    width: 100%;
    display: block;
  }

  .card-info {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 5px;

    .title-tags {
      margin-bottom: 5px;
      display: flex;
      align-items: center;

      .title {
        font-weight: 600;
        font-size: 15px;
        color: #fff;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 125px;
      }

      .tag {
        font-weight: 400;
        font-size: 10px;
        color: #1a1a1a;
        padding: 0 3px;
        background: #fee2a2;
        border-radius: 2px;
        margin-left: 8px;
        flex-shrink: 0;
      }
    }

    .num {
      display: flex;
      justify-content: flex-start;
      align-items: center;

      .icon {
        width: 10px;
        height: 10px;
        display: block;
      }

      .text {
        font-weight: 400;
        font-size: 11px;
        color: #ffc838;
        margin-left: 5px;
      }
    }
  }

  .meta {
    position: absolute;
    right: 5px;
    top: 5px;
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    font-weight: 400;
    font-size: 12px;
    color: #ffffff;
    padding: 0 8px;
    height: 20px;
    line-height: 20px;

    .online {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      margin-right: 5px;
      background: #15cb50;
    }

    .divider {
      margin: 0 8px;
      color: #ddd;
    }
  }
}

.loading-status {
  text-align: center;
  padding: 15px 0;
  font-size: 13px;
  color: #999;
}

/* 空状态 */
.empty-state {
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

/* 骨架屏 */
.skeleton-wrapper {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;

  .column {
    width: 48%;
  }
}

/* 公告内容 */
.notice-content {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  max-height: 50vh;
  overflow-y: auto;
}
</style>