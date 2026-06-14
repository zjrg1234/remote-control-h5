<template>
  <div class="container">
    <!-- 顶部 Banner -->
    <div class="banner-section">
      <img :src="imgUrl" class="banner-img" alt="Banner" />
    </div>

    <!-- 分类导航栏 -->
    <van-tabs 
      v-model:active="currentTabIndex" 
      sticky 
      offset-top="0"
      @click-tab="handleCategoryClick"
      class="sticky-nav"
    >
      <van-tab 
        v-for="(item, index) in categories" 
        :key="index" 
        :title="item.name" 
        :name="item.id" 
      />
    </van-tabs>

    <!-- 列表区域 -->
    <van-list
      v-model:loading="loading"
      :finished="noMore"
      finished-text="没有更多了"
      @load="fetchData"
    >
      <!-- 空状态 -->
      <div v-if="list.length === 0 && !loading" class="empty-state">
        <van-empty description="暂无相关数据" />
      </div>

      <!-- 单列卡片列表 -->
      <div v-else class="list-container">
        <div
          v-for="(item, index) in list"
          :key="index"
          class="card-item"
          @click="handleCar(item)"
        >
          <img :src="item.image || item.venue_image?.[0]" class="card-img" />
          <div class="meta">
            <span class="status online"></span>
            <span>在线{{ item.online }}</span>
            <span class="divider">|</span>
            <span>驾驶{{ item.drivers || item.driving }}</span>
          </div>
          <div class="card-info">
            <div class="title-tags">
              <span class="title">{{ item.title || item.venue_name }}</span>
              <span class="tag">{{ item.tag || item.labels }}</span>
            </div>
            <div class="num">
              <img src="@/assets/images/common/icon_queue@2x.png" class="icon" />
              <span class="text">{{ item.online || item.queue }}人排队</span>
            </div>
          </div>
        </div>
      </div>
    </van-list>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { GetHomeBanner, GetHomeTabTitle, GetHomeDataList } from "@/api/index";

const router = useRouter();

// --- 数据定义 ---
const categories = ref([]);
const currentTabIndex = ref(0);
const currentCategoryId = ref("");

// 【修改】：合并为一个统一的列表数组
const list = ref([]);
const loading = ref(false);
const noMore = ref(false);
const imgUrl = ref("");

// --- 核心请求逻辑 ---
const fetchData = async () => {
  if (loading.value || noMore.value) return;

  loading.value = true;
  try {
    const { code, data: { venueList } } = await GetHomeDataList({
      type: currentCategoryId.value
    });

    if (code == 200 && venueList.length) {
      // 【修改】：直接将新数据追加到统一列表中
      list.value.push(...venueList);
    } else {
      noMore.value = true;
    }
  } catch (error) {
    console.error("获取数据失败", error);
    noMore.value = true;
  } finally {
    loading.value = false;
  }
};

// --- 事件处理 ---
const handleCategoryClick = ({ name }) => {
  const item = categories.value.find(cat => cat.id === name);
  if (item && currentCategoryId.value !== item.id) {
    currentCategoryId.value = item.id;
    // 切换分类时清空列表并重新加载
    list.value = [];
    noMore.value = false;
    fetchData();
  }
};

const handleCar = (item) => {
  localStorage.setItem('carTitle', item.venue_name || item.title);
  router.push(`/car/details?id=${item.id}`);
};

// --- 生命周期 ---
onMounted(async () => {
  categories.value = [{ name: "全部", id: "" }];
  console.log(123)
  try {
    // const [bannerRes, tabRes] = await Promise.all([
    
    // ]);

   const bannerRes = await   GetHomeBanner()
    const tabRes = await  GetHomeTabTitle()
    console.log(tabRes,"---")
    // imgUrl.value = bannerRes.data[0]?.image;
    categories.value = [...categories.value, ...tabRes.data];
    debugger
  } catch (err) {
    showToast("页面初始化失败");
  }

  fetchData();
});
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-bottom: 40px;
}

.banner-section {
  width: 100%;
  overflow: hidden;
  height: 140px;

  .banner-img {
    width: 100%;
    display: block;
    height: 100%;
    object-fit: cover;
  }
}

.sticky-nav {
  :deep(.van-tabs__nav) {
    background-color: #fff;
    border-radius: 20px 20px 0 0;
    margin-top: -5px;
    box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.1);
  }
}

/* 【修改】：单列列表布局 */
.list-container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 10px;
  background-color: #fff;
}

/* 卡片样式 (单列下建议改为横向或保持纵向，这里保持原有的纵向卡片) */
.card-item {
  position: relative;
  background: #e9e9e9;
  border-radius: 8px;
  height: 200px; /* 单列建议适当调整高度，避免卡片过高 */
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);

  .card-img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .card-info {
    padding: 10px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    .title-tags {
      margin-bottom: 5px;
      display: flex;
      align-items: center;

      .title {
        font-weight: 600;
        font-size: 18px;
        color: #ffffff;
      }

      .tag {
        font-size: 10px;
        color: #1a1a1a;
        padding: 2px 4px;
        background: #fee2a2;
        border-radius: 2px;
        margin-left: 8px;
      }
    }

    .num {
      display: flex;
      align-items: center;
      .icon { width: 12px; height: 12px; display: block; }
      .text { font-size: 12px; color: #ffc838; margin-left: 4px; }
    }
  }

  .meta {
    position: absolute;
    right: 10px;
    top: 10px;
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    font-size: 12px;
    color: #ffffff;
    padding: 2px 8px;

    .online {
      width: 6px; height: 6px;
      border-radius: 50%;
      margin-right: 4px;
      background: #15cb50;
    }
    .divider { margin: 0 6px; color: #ddd; }
  }
}

.empty-state {
  padding: 50px 0;
}
</style>