<template>
  <div class="container">
    <!-- 顶部 Banner -->
    <div class="banner-section">
      <van-image width="100%" fit="cover" :src="imgUrl" radius="0">
        <template #loading>
          <van-loading type="spinner" size="20" />
        </template>
      </van-image>
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

    <!-- 【优化 1】：全局加载状态（仅在首次加载或切换分类且列表为空时显示） -->
    <!-- <div v-if="loading && list.length === 0" class="loading-state">
      <van-loading type="spinner" size="24" vertical>加载中...</van-loading>
    </div> -->

    <!-- 【优化 2】：空状态（严格限制：列表为空、不在加载中、且请求已完成） -->
    <div v-if="list.length === 0 && !loading && noMore" class="empty-state">
      <van-empty description="暂无相关数据" />
    </div>

    <!-- 列表渲染 -->
    <div v-else-if="list.length !== 0" class="list-container">
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

const list = ref([]);
const loading = ref(false);
const noMore = ref(false);
const imgUrl = ref("");

// --- 核心请求逻辑 ---
const fetchData = async () => {
  // 如果已经明确没有更多数据，直接返回
  if (noMore.value) {
    loading.value = false;
    return;
  }
  
  // 【关键优化】：发起请求时，务必将 loading 设为 true，防止空状态提前闪现
  loading.value = true; 
  
  try {
    const { code, data: { venueList } } = await GetHomeDataList({
      type: currentCategoryId.value,
    });

    if (code == 200 && venueList.length) {
      list.value.push(...venueList);
      // 根据实际接口逻辑判断是否还有更多数据（这里假设每次返回20条，若小于20条则没有更多了）
      noMore.value = venueList.length < 20; 
    } else {
      noMore.value = true;
    }
  } catch (error) {
    noMore.value = true;
  } finally {
    loading.value = false;
  }
};

// --- 事件处理 ---
const handleCategoryClick = ({ name }) => {
  const item = categories.value.find((cat) => cat.id === name);
  if (item && currentCategoryId.value !== item.id) {
    currentCategoryId.value = item.id;
    // 切换分类时重置状态
    list.value = [];
    noMore.value = false;
    // 注意：这里不需要手动 loading.value = true，fetchData 内部会处理
    fetchData();
  }
};

const handleCar = (item) => {
  localStorage.setItem("carTitle", item.venue_name || item.title);
  router.push(`/carDetails?id=${item.id}`);
};

// --- 生命周期 ---
onMounted(async () => {
  categories.value = [{ name: "全部", id: "" }];
  try {
    if (localStorage.imgUrl) {
      imgUrl.value = localStorage.imgUrl;
    }
    const res = await GetHomeBanner();
    if (imgUrl.value !== res.data[0]?.image) {
      localStorage.setItem('imgUrl', res.data[0]?.image);
      imgUrl.value = localStorage.imgUrl;
    }
    
    const res1 = await GetHomeTabTitle();
    categories.value = [...categories.value, ...res1.data];
  } catch (err) {
    showToast("页面初始化失败");
    console.log(err, "---");
  }
  fetchData();
});
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
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
  top: -10px;

  :deep(.van-tabs__nav) {
    background-color: #fff;
    border-radius: 20px 20px 0 0;
    box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.1);
  }
}

/* 【新增】：加载状态样式 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

/* 单列列表布局 */
.list-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  padding: 10px;
  gap: 10px;
  background-color: #fff;
}

/* 卡片样式 */
.card-item {
  position: relative;
  background: #e9e9e9;
  border-radius: 8px;
  height: 200px;
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
        color: #fff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }

      .tag {
        font-size: 10px;
        color: #1a1a1a;
        padding: 2px 4px;
        background: #fee2a2;
        border-radius: 2px;
        margin-left: 8px;
        white-space: nowrap;
        flex-shrink: 0;
      }
    }

    .num {
      display: flex;
      align-items: center;

      .icon {
        width: 12px;
        height: 12px;
        display: block;
      }

      .text {
        font-size: 12px;
        color: #ffc838;
        margin-left: 4px;
      }
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
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 4px;
      background: #15cb50;
    }

    .divider {
      margin: 0 6px;
      color: #ddd;
    }
  }
}

.empty-state {
  padding: 50px 0;
}
</style>