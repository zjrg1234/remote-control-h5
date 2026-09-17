<template>
  <div class="tabbar-wrap">
    <div
      class="tabbar-item"
      v-for="(item, index) in tabbarData"
      :key="index"
      :class="{ 'is-active': active === item.name }"
      @click="handleSwitch(item)"
    >
      <img
        class="image"
        :src="active === item.name ? item.active : item.inactive"
        alt="tab"
      />
      <span class="title">{{ item.title }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { $t } from "@/locales";

// 图标资源
import homeIcon from "@/assets/images/tabBar/icon_home@2x.png";
import homeActiveIcon from "@/assets/images/tabBar/icon_home_selected@2x.png";
import mineIcon from "@/assets/images/tabBar/icon_mine@2x.png";
import mineActiveIcon from "@/assets/images/tabBar/icon_mine_selected@2x.png";

const route = useRoute();
const router = useRouter();

// 当前激活项，根据路由 name 初始化
const active = ref(route.name || "Home");

const tabbarData = ref([
  {
    name: "Home",
    active: homeActiveIcon,
    inactive: homeIcon,
    title: $t("首页"),
    to: { name: "Home" },
  },
  {
    name: "Mine",
    active: mineActiveIcon,
    inactive: mineIcon,
    title: $t("我的"),
    to: { name: "Mine" },
  },
]);

// 点击切换
const handleSwitch = (item) => {
  if (active.value === item.name) return;
  active.value = item.name;
  router.push(item.to);
};
</script>

<style scoped>
/* 外层悬浮容器 */
.tabbar-wrap {
  position: fixed;
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
  width: 420px;
  height: 126px;
  background: #fff;
  border-radius: 68px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  z-index: 1000;
}

/* 单个 tab 项 */
.tabbar-item {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s ease;
}

.tabbar-item.is-active {
  color: #34d2a5;
}

.image {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.title {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 24px;
  line-height: 1;
}
</style>