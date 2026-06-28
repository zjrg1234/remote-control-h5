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
<style></style>
