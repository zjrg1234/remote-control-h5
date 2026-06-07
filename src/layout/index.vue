<template>
  <div class="app-wrapper">
    <van-config-provider :theme="useDarkMode() ? 'dark' : 'light'">
      <!-- <nav-bar /> -->
      <router-view v-slot="{ Component }">
        <keep-alive :include="cachedViews">
          <component :is="Component" />
        </keep-alive>
      </router-view>
      <tabbar v-if="showNavBar" />
    </van-config-provider>
  </div>
</template>

<script setup lang="ts">
import tabbar from "@/components/Tabbar/index.vue";
// import NavBar from "@/components/NavBar/index.vue";
import { useCachedViewStoreHook } from "@/store/modules/cachedView";
import { useDarkMode } from "@/hooks/useToggleDarkMode";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()

const showNavBar = ref(false)

watch(
  () => route.meta,
  (meta) => {
    showNavBar.value = !meta.hiddenNavBar
    console.log(12223)
  },
  { immediate: true }
)

const cachedViews = computed(() => {
  return useCachedViewStoreHook().cachedViewList;
});
</script>

<style lang="less" scoped>
@import "@/styles/mixin.less";

.app-wrapper {
  .clearfix();
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
