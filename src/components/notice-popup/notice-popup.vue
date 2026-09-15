<template>
  <div v-if="visible" class="notice-mask" @click.stop="handleMaskClick">
    <!-- 弹窗主体 -->
    <div class="notice-popup" @click.stop>
      <div class="notice-header">
        <div class="notice-title">{{ title }}</div>
      </div>

      <div class="notice-content">
        <div class="notice-text">{{ content }}</div>
      </div>

      <div class="btn"  @click.stop="handleClose">{{confirmText}}</div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, watch } from "vue";

interface Props {
  modelValue: boolean;
  title?: string;
  content: string;

  confirmText?: string;
  showClose?: boolean;
  maskClosable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "公告",
  confirmText: "我知道了",
  showClose: true,
  maskClosable: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
  (e: "close"): void;
}>();

const visible = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  },
);

const close = () => {
  visible.value = false;
  emit("update:modelValue", false);
};

const handleConfirm = () => {
  emit("confirm");
  close();
};

const handleClose = () => {
  emit("close");
  close();
};

const handleMaskClick = () => {
  if (props.maskClosable) close();
};
</script>

<style scoped lang="scss">
.notice-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  flex-direction: column; /* ✅ 改为纵向排列，方便弹窗+关闭按钮垂直居中 */
  align-items: center;
  justify-content: center;
}

.notice-popup {
  position: relative;
  width: 560px;
  height: 576px;

  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.25s ease;

  background-image: url("@/assets/images/bg_notice@2x.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

.notice-header {
  padding: 116px 0 0 104px;
  text-align: center;
}

.notice-title {
  font-size: 17px;
  font-weight: bold;
  font-family: YouSheBiaoTiHei;
  font-size: 40px;
  color: #333333;
  line-height: 52px;
  text-align: left;
  font-style: normal;
  transform: skewX(-10deg);
}

.notice-content {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  flex: 1;
  padding: 25px 25px 0 40px;
  font-size: 14px;
  color: #333;
}

.notice-text {
  font-family: PingFangSC, PingFang SC;

  font-weight: 400;
  font-size: 24px;
  color: #333333;
  line-height: 33px;
  text-align: left;
  font-style: normal;
  white-space: pre-wrap;
  height: 200px;
  overflow-y: auto;
}

/* ✅ 关闭按钮样式重写 */
.notice-close {
  margin-top: 20px; /* 与弹窗底部的间距 */
  width: 31px;
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  .image {
    width: 31px;
    height: 31px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.btn {
  width: 496px;
  height: 80px;
  background: #34d2a5;
  border-radius: 40px;
  margin: auto;
  text-align: center;

  font-family: PingFangSC, PingFang SC;
  font-weight: 600;
  font-size: 30px;
  color: #1a1a1a;
  line-height: 80px;
  text-align: center;
  font-style: normal;
  margin-bottom: 40px;
}
</style>
