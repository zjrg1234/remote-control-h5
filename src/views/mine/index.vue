<template>
  <div class="container">
    <!-- 背景图 -->
    <div class="bg-image">
      <img src="@/assets/images/mine/bg@2x.png" alt="" />
    </div>

    <!-- 用户信息区域 -->
    <div class="header">
      <div class="user-info">
        <div class="avatar-image" @click="goEditProfile">
          <van-image
            round
            width="50px"
            height="50px"
            fit="cover"
            :src="userInfo.head_shot"
          />
          <img
            class="arrow-edit"
            src="@/assets/images/mine/icon_edit@2x.png"
            alt="编辑"
          />
        </div>
        <div class="user-text">
          <span class="username">{{ userInfo.username }}</span>
          <span class="user-id">ID: {{ userInfo.show_id }}</span>
        </div>
      </div>
    </div>

    <!-- 资产卡片 -->
    <div class="asset-card">
      <div class="card-title">我的资产</div>
      <div class="card-content">
        <div class="asset-item">
          <span class="asset-num">{{ userInfo.wallet?.balance }}</span>
          <div class="asset-label" @click="goBattery">
            <span>我的电池</span>
            <van-icon name="arrow" size="12px" color="#333" />
          </div>
        </div>
        <div class="asset-item">
          <span class="asset-num">{{ userInfo.wallet?.energy }}</span>
          <span class="asset-label">我的能量</span>
        </div>
      </div>
    </div>

    <!-- 功能列表 -->
    <van-cell-group inset class="menu-list">
      <van-cell
        v-for="(item, index) in menuList"
        :key="index"
        :title="item.name"
        is-link
        center
        @click="handleClick(item)"
      >
        <template #icon>
          <img class="menu-icon" :src="item.icon" alt="" />
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 弹窗组件 -->
    <BusinessModal v-model:visible="showModal" />
    
    <TipModal
      v-model:visible="serviceModal"
      title="在线客服"
      :content="serviceTip"
      cancel-text="拒绝"
      confirm-text="确认"
      @confirm="openService"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import BusinessModal from "@/components/BusinessModal/index.vue";
import TipModal from "@/components/TipModal/index.vue";
import { useUserStore } from "@/store/modules/user";
import { copyToClipboard } from "@/utils/utils";
import {  GetUserInfo } from "@/api/index";

const router = useRouter();
const userStore = useUserStore();

const userInfo = computed(() => userStore.getUserInfo());


const showModal = ref(false);
const serviceModal = ref(false);
const serviceTip = ref("是否打开微信，联系在线客服");

const menuList = ref([
  {
    name: "变更专区",
    icon: new URL("@/assets/images/mine/icon_change@2x.png", import.meta.url)
      .href,
    key: "area",
    url: "changeArea",
  },
  {
    name: "我的预约",
    icon: new URL("@/assets/images/mine/icon_book@2x.png", import.meta.url)
      .href,
    key: "order",
    url: "/reservation",
  },
  {
    name: "我的申诉",
    icon: new URL("@/assets/images/mine/icon_appeal@2x.png", import.meta.url)
      .href,
    key: "appeal",
    url: "/appeal",
  },
  {
    name: "驾驶记录",
    icon: new URL("@/assets/images/mine/icon_record@2x.png", import.meta.url)
      .href,
    key: "record",
    url: "/driveRecord",
  },
  {
    name: "在线客服",
    icon: new URL("@/assets/images/mine/icon_service@2x.png", import.meta.url)
      .href,
    key: "service",
    url: "",
  },
  {
    name: "商务合作",
    icon: new URL(
      "@/assets/images/mine/icon_cooperation@2x.png",
      import.meta.url,
    ).href,
    key: "cooperation",
    url: "",
  },
  {
    name: "设置",
    icon: new URL("@/assets/images/mine/icon_set@2x.png", import.meta.url).href,
    key: "set",
    url: "/set",
  },
]);

// --- 页面跳转 ---
const goEditProfile = () => {
  router.push("/editProfile");
};

const goBattery = () => {
  router.push("/battery");
};



// --- 生命周期 ---
onMounted(async () => {
  GetUserInfo().then(res => {
    userStore.setUser(res.data);
  }).catch()
});

// --- 菜单点击 ---
const handleClick = (item) => {
  const navKeys = ["area", "order", "appeal", "record", "set"];
  if (navKeys.includes(item.key)) {
    router.push(item.url);
    return;
  }
  if (item.key === "cooperation") {
    showModal.value = true;
    return;
  }
  if (item.key === "service") {
    serviceModal.value = true;
  }
};

// --- 客服逻辑（H5 / App 通用） ---
const openService = () => {
  // 微信小程序环境判断
  

  // H5 / App → 复制微信号
  copyToClipboard("we1731747901")
    .then(() => showToast({ message: "微信号已复制", type: "success" }))
    .catch(() =>
      showToast({
        message: "复制失败，请手动添加：we1731747901",
        type: "fail",
      }),
    );
};
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  background-color: #fff;
  min-height: 100vh;
}

.bg-image {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 200px;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

/* 用户信息 */
.header {
  position: relative;
  z-index: 1;
  padding: 24px 15px 0;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar-image {
  position: relative;
  margin-right: 10px;

  .arrow-edit {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    display: block;
  }
}

.user-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.username {
  font-weight: 500;
  font-size: 15px;
  color: #333;
  line-height: 21px;
  margin-bottom: 4px;
}

.user-id {
  font-weight: 400;
  font-size: 12px;
  color: #666;
}

/* 资产卡片 */
.asset-card {
  position: relative;
  z-index: 1;
  margin: 10px 15px;
  border-radius: 12px;
  padding: 10px 10px 15px;
  background-image: url("@/assets/images/mine/bg_car@2x.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

.card-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.card-content {
  display: flex;
  justify-content: space-around;
}

.asset-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
}

.asset-num {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.asset-label {
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 400;
  font-size: 12px;
  color: #333;
}

/* 菜单列表 */
.menu-list {
  margin: 0;
  margin-top: 40px;

  .menu-icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    display: block;
  }
}
</style>
