<template>
  <van-tabbar v-model="active" :placeholder="true" :route="true" fixed>
    <van-tabbar-item
      v-for="(item, index) in tabbarData"
      :key="index"
      :name="item.name"
      :to="item.to"
    >
      <template #icon="props">
        <img class="image" :src="props.active ? item.active : item.inactive" />
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
    title: computed(() => $t("首页")),
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

:deep(.van-tabbar) {
  width: 420px;
  height: 126px;
  background: #fff;
  border-radius: 68px;
  filter: blur(0px);
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
}
.image {
  width: 54px;
  height: 54px;
}

:deep(.van-tabbar-item) {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 24px;
  color: #999;
  background: none;
}

:deep(.van-tabbar-item--active) {
  color: #34d2a5;
}


</style>
