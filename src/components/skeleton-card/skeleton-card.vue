<!-- components/skeleton-card/skeleton-card.vue -->
<template>
  <div class="skeleton-card">
    <!-- 图片占位 -->
    <div class="skeleton-img" />

    <!-- 信息区占位 -->
    <div class="skeleton-info">
      <div class="skeleton-title" />
      <div class="skeleton-meta">
        <div class="skeleton-tag" />
        <div class="skeleton-tag" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cardHeight: {
    type: String,
    default: '476px',
  },
})
</script>

<style lang="scss" scoped>
.skeleton-card {
  overflow: hidden;
  background: linear-gradient(253deg, #ffffff 0%, #d9fff2 100%);
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  height: 476px;
  display: flex;
  flex-direction: column;

  /* 图片骨架 */
  .skeleton-img {
    width: 100%;
    height: 345px;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  /* 信息区 */
  .skeleton-info {
    padding: 20px 0 8px 20px;
    flex: 1;
    box-sizing: border-box;

    /* 标题骨架 */
    .skeleton-title {
      width: 60%;
      height: 42px;
      background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    /* 标签组 */
    .skeleton-meta {
      padding-top: 8px;
      display: flex;

      .skeleton-tag {
        width: 100px;
        height: 33px;
        background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 20px;

        & + .skeleton-tag {
          margin-left: 12px;
        }
      }
    }
  }
}

/* 流光动画 */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>