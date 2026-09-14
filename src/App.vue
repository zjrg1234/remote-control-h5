<template>
  <router-view />

   <div v-if="loadingStore.loading" class="global-loading-mask">
    <div class="loading-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoadingStore } from '@/store/modules/loading';

const loadingStore = useLoadingStore();

</script>
<style>
/* 注意：没有 scoped！这是全局样式 */
.van-tabbar__placeholder {
  height: 0 !important;
}
</style>
