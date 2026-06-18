<template>
  <van-tabbar v-model="active" :placeholder="true" :route="true" fixed>
    <van-tabbar-item
      v-for="(item, index) in tabbarData"
      :key="index"
      :name="item.name"
      :to="item.to"
    >
      <template #icon="props">
        <img :src="props.active ? item.active : item.inactive" />
      </template>
      {{ item.title }}
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { $t } from "@/locales";

// 引入图片资源
import homeIcon from "@/assets/images/tabBar/icon_home@2x.png";
import homeActiveIcon from "@/assets/images/tabBar/icon_home_selected@2x.png";
import mineIcon from "@/assets/images/tabBar/icon_mine@2x.png";
import mineActiveIcon from "@/assets/images/tabBar/icon_mine_selected@2x.png";

// 初始值：使用当前路由的 name，防止刷新页面时高亮丢失
const active = ref(0);

const tabbarData = ref([
  {
    name: "Home",
    active: homeActiveIcon,
    inactive: homeIcon,
    title: computed(() => $t("demo.tabbar.home")),
    to: { name: "Home" }, // ✅ 这里补上了 to 属性
  },
  {
    name: "Mine",
    active: mineActiveIcon,
    inactive: mineIcon,
    title: computed(() => $t("我的")),
    to: { name: "Mine" }, // ✅ 这里补上了 to 属性
  },
]);
</script>
<style scoped>
:deep(.van-tabbar-item--active) {
  color: #ffc838;
}
</style>