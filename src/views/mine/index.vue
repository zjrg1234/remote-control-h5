<template>
  <div class="container">
    <!-- 用户信息区域 -->
    <div class="header">
      <div class="user-info">
        <div class="avatar-image">
          <!-- 上传组件绑定ref，插槽只放头像 -->
          <van-uploader
            ref="uploaderRef"
            :after-read="onFileChange"
            accept="image/*"
            :preview-size="50"
            :max-size="500 * 1024"
            @oversize="
              showToast({ message: '图片不能超过500KB', type: 'fail' })
            "
          >
            <van-image
              class="head-img"
              round
              width="108px"
              height="108px"
              fit="cover"
              :src="userInfo.head_shot || defaultAvatar"
            />
          </van-uploader>
          <!-- 编辑箭头独立在外，点击唤起上传弹窗 -->
          <img
            class="arrow-edit"
            src="@/assets/images/mine/icon_camera@2x.png"
            alt="编辑头像"
            @click="triggerUpload"
          />
        </div>
        <div class="user-text">
          <span class="username" @click="goEditProfile">{{
            userInfo.username
          }}</span>
          <span class="user-id">ID: {{ userInfo.show_id }}</span>
        </div>
      </div>
    </div>

    <div class="asset-card">
      <div class="card-content">
        <!-- 左侧：电池卡片 -->
        <div class="asset-item battery-item">
          <span class="asset-num">{{ userInfo.wallet?.balance }}</span>

          <span class="asset-label">我的电池</span>
          <!-- 充值按钮（绝对定位或根据需要调整） -->
          <div class="recharge-btn" @click="goBattery">
            <span> 充值 </span>

            <img
              class="img"
              src="@/assets/images/common/icon_arrows2@2x.png"
              alt=""
            />
            <!-- <van-icon name="arrow" /> -->
          </div>
        </div>

        <!-- 右侧：能量卡片 -->
        <div class="asset-item energy-item">
          <span class="asset-num">{{ userInfo.wallet?.energy }}</span>
          <span class="asset-label">我的能量</span>
        </div>
      </div>
    </div>

    <!-- 功能列表 -->
    <van-cell-group inset class="menu-list">
      <van-cell
        v-for="(item, index) in menuList1"
        :key="index"
        is-link
        center
        @click="handleClick(item)"
        class="menu-item"
      >
        <template #title>
          <span class="menu-title">{{ item.name }}</span>
        </template>
        <template #icon>
          <img class="menu-left-icon" :src="item.icon" alt="" />
        </template>

        <template #right-icon>
          <img
            class="menu-right-icon"
            src="@/assets/images/common/icon_arrows@2x.png"
            alt=""
          />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="menu-list">
      <van-cell
        v-for="(item, index) in menuList2"
        :key="index"
        is-link
        center
        @click="handleClick(item)"
        class="menu-item"
      >
        <template #title>
          <span class="menu-title">{{ item.name }}</span>
        </template>

        <template #icon>
          <img class="menu-left-icon" :src="item.icon" alt="" />
        </template>
        <template #right-icon>
          <img
            class="menu-right-icon"
            src="@/assets/images/common/icon_arrows@2x.png"
            alt=""
          />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="menu-list">
      <van-cell
        v-for="(item, index) in menuList3"
        :key="index"
        is-link
        center
        @click="handleClick(item)"
        class="menu-item"
      >
        <template #title>
          <span class="menu-title">{{ item.name }}</span>
        </template>
        <template #icon>
          <img class="menu-left-icon" :src="item.icon" alt="" />
        </template>
        <template #right-icon>
          <img
            class="menu-right-icon"
            src="@/assets/images/common/icon_arrows@2x.png"
            alt=""
          />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="menu-list">
      <van-cell
        v-for="(item, index) in menuList4"
        :key="index"
        :title="item.name"
        is-link
        center
        @click="handleClick(item)"
        class="menu-item"
      >
        <template #title>
          <span class="menu-title">{{ item.name }}</span>
        </template>
        <template #icon>
          <img class="menu-left-icon" :src="item.icon" alt="" />
        </template>
        <template #right-icon>
          <img
            class="menu-right-icon"
            src="@/assets/images/common/icon_arrows@2x.png"
            alt=""
          />
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
import { GetUserInfo } from "@/api/index";
import { ChangeHeadImg } from "@/api/mine";
const defaultAvatar = new URL(
  "@/assets/images/mine/default_avatar@2x.png",
  import.meta.url,
).href;
const router = useRouter();
const userStore = useUserStore();
// 上传组件ref，用于手动唤起文件选择
const uploaderRef = ref(null);

const userInfo = computed(() => userStore.getUserInfo());

const showModal = ref(false);
const serviceModal = ref(false);
const serviceTip = ref("是否打开微信，联系在线客服");

const menuList1 = ref([
  {
    name: "变更专区",
    icon: new URL("@/assets/images/mine/icon_change@2x.png", import.meta.url)
      .href,
    key: "area",
    url: "changeArea",
  },
]);

const menuList2 = ref([
  {
    name: "驾驶记录",
    icon: new URL("@/assets/images/mine/icon_record@2x.png", import.meta.url)
      .href,
    key: "record",
    url: "/driveRecord",
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
]);

const menuList3 = ref([
  {
    name: "我的卡券",
    icon: new URL("@/assets/images/mine/icon_course@2x.png", import.meta.url)
      .href,
    key: "service",
    url: "",
  },
]);

const menuList4 = ref([
  {
    name: "在线客服",
    icon: new URL("@/assets/images/mine/icon_service@2x.png", import.meta.url)
      .href,
    key: "service",
    url: "",
  },

  {
    name: "设置",
    icon: new URL("@/assets/images/mine/icon_set@2x.png", import.meta.url).href,
    key: "set",
    url: "/set",
  },
]);

// 页面跳转
const goEditProfile = () => {
  router.push("/editProfile");
};
const goBattery = () => {
  router.push("/battery");
};

// 页面初始化
onMounted(async () => {
  GetUserInfo()
    .then((res) => {
      userStore.setUser(res.data);
    })
    .catch(() => {});
});

// 菜单点击事件
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

// 客服复制微信
const openService = () => {
  copyToClipboard("we1731747901")
    .then(() => showToast({ message: "微信号已复制", type: "success" }))
    .catch(() =>
      showToast({
        message: "复制失败，请手动添加：we1731747901",
        type: "fail",
      }),
    );
};

// 点击编辑箭头唤起上传弹窗
const triggerUpload = () => {
  uploaderRef.value?.chooseFile();
};

// 图片选中后上传处理
const onFileChange = async (fileDetail) => {
  console.log(1);
  const file = fileDetail.file;
  // 本地预览临时图
  const previewUrl = URL.createObjectURL(file);
  userStore.setUser({ ...userInfo.value, head_shot: previewUrl });

  try {
    const formData = new FormData();
    formData.append("imageFile[]", file);

    const res = await fetch(
      `${import.meta.env.VITE_BASE_API}/api/upload/picture`,
      {
        method: "POST",
        body: formData,
      },
    );
    const data = await res.json();

    if (data.code === 200) {
      const newUrl = data.data.file[0];
      // 调用接口更新用户头像
      await ChangeHeadImg({ head_shot: newUrl });
      userStore.setUser({ ...userInfo.value, head_shot: newUrl });
      showToast({ message: "上传成功", type: "success" });
    } else {
      showToast({ message: "上传失败", type: "fail" });
    }
  } catch (err) {
    console.error("上传失败：", err);
    showToast({ message: "上传失败", type: "fail" });
  }
};
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  height: 100vh;
  background: linear-gradient(236deg, #34d2a5 0%, #e3ffe6 100%);
}

/* 用户信息 */
.header {
  position: relative;
  z-index: 1;
  padding: 23px 30px 0;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  flex-direction: column; /* 纵向排列 */
  justify-content: center;
}
.head-img {
  // width: 108px !important;
  // height: 108px !important;
}
.avatar-image {
  position: relative;

  width: 180px;
  height: 180px;
  border-radius: 50%;

  // 在这里进行圆形裁剪
  :deep(.van-uploader__wrapper) {
    width: 100%;
    height: 100%;
    border-radius: 50%; /* 圆形头像 */
    overflow: hidden; /* 限制图片不溢出 */
  }

  .arrow-edit {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 54px;
    height: 54px;
    display: block;
    border-radius: 50%;

    z-index: 2;
    pointer-events: auto;
  }
}

.user-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 20px;
}

.username {
  font-weight: 500;
  font-size: 30px;
  color: #333;
  line-height: 42px;
  margin-bottom: 8px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 36px;
  color: #1a1a1a;
  line-height: 50px;
}

.user-id {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 24px;
  color: #1a1a1a;
  line-height: 33px;
}

.asset-card {
  position: relative;
  z-index: 1;
  margin: 35px 30px;
  border-radius: 12px;
  overflow: hidden;
  /* 如果背景图需要保留，可以解开注释 */
  /* background-image: url("@/assets/images/mine/bg_car@2x.png"); */
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.asset-item {
  height: 172px;
  border-radius: 20px;
  padding: 15px 34px 15px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 左侧电池卡片样式 */
.battery-item {
  background: linear-gradient(135deg, #35e1a0 0%, #33c5aa 100%);
  flex: 0 0 430px;
  border-radius: 20px;
}

/* 右侧能量卡片样式 */
.energy-item {
  background: linear-gradient(140deg, #fde5a6 0%, #ffba9e 100%);
  flex: 0 0 240px;
  border-radius: 20px;
}

/* 装饰折角效果 */
.battery-item::after {
  content: "";
  // position: absolute;
  // top: -20px;
  // right: -20px;
  // width: 80px;
  // height: 80px;
  // background: rgba(255, 255, 255, 0.2);
  // transform: rotate(45deg);
}

.asset-num {
  font-size: 28px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 12px;
  font-family: Impact;
  font-size: 40px;
  color: #222222;
  line-height: 48px;
  text-align: left;
  font-style: normal;
}

.asset-label {
  display: flex;
  align-items: center;
  gap: 12px;

  cursor: pointer;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 24px;
  color: #666666;
  line-height: 33px;
  text-align: left;
  font-style: normal;
}

/* 充值按钮 */
.recharge-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);

  border-radius: 24px;
  border: 1px solid #222222;
  padding: 4px 20px;


  display: flex;
  align-items: center;
  gap: 4px;

  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 24px;
  color: #222222;
  line-height: 33px;
  text-align: left;
  font-style: normal;

  img {
    width: 24px;
    height: 24px;
  }
}
/* 菜单列表 */
.menu-list {
  margin: 25px 30px;

  .menu-title {
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 28px;
    color: #1a1a1a;
    line-height: 40px;
    text-align: left;
    font-style: normal;
  }
  .menu-left-icon {
    width: 40px;
    height: 40px;
    margin-right: 12px;
    display: block;
  }

  .menu-right-icon {
    width: 32px;
    height: 32px;
    display: block;
  }

  .menu-item {
    height: 108px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 20px;
  }
  :deep(.van-cell:after) {
    border: none;
  }
}
</style>
