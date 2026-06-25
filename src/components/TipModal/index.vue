<template>
  <!-- 
    使用 Vant 4 的 van-dialog 组件
    v-model:show 替代了原有的 visible 控制显隐
    :show-confirm-button="false" 和 :show-cancel-button="false" 隐藏默认按钮，使用自定义 footer 插槽
  -->
  <van-dialog
    v-model:show="dialogVisible"
    :title="title"
    :show-cancel-button="false"
    :show-confirm-button="false"
    :close-on-click-overlay="false"
    class="custom-modal"
  >
    <!-- 内容区插槽 -->
    <template #default>
      <div class="modal-content">
        <slot name="content">
          <div>{{ content }}</div>
        </slot>
      </div>
    </template>

    <!-- 底部按钮插槽 -->
    <template #footer>
      <slot name="footer">
        <div class="btn-group">
          <div class="btn refuse" @click="onCancel">{{ cancelText || '取消' }}</div>
          <div class="btn allow" @click="onConfirm">{{ confirmText || '确认' }}</div>
        </div>
      </slot>
    </template>
  </van-dialog>
</template>

<script setup>
/**
 * 通用弹窗组件 (Vue 3 + Vant 4 版)
 * 支持 v-model:visible 双向绑定
 * 支持 title / content / footer 三个具名插槽
 */
import { computed } from 'vue';

// --- Props ---
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确认'
  }
});

// --- Emits ---
const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

// 计算属性，将父组件的 visible 映射为 van-dialog 需要的 show
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

// --- Methods ---
const onCancel = () => {
  emit('update:visible', false);
  emit('cancel');
};

const onConfirm = () => {
  emit('confirm');
  // 注意：确认按钮是否自动关闭由父组件决定
  // 如果希望确认后自动关闭，可在此处加上 emit('update:visible', false)
};
</script>

<style lang="scss" scoped>
/* ========== 内容区 ========== */
.modal-content {
  padding: 20px;
  text-align: center;
}

/* ========== 按钮组 ========== */
.btn-group {
  display: flex;
  justify-content: space-around;
  padding: 0 16px 16px;
}

.btn {
  text-align: center;
  padding: 9px 43px;
  border-radius: 8px;
  font-weight: 400;
  font-size: 15px;
  color: #222222;
  cursor: pointer;

  &.refuse {
    background: #f0f0f0;
  }

  &.allow {
    font-weight: 600;
    background: #ffc838;
  }
}
</style>