<template>
  <!-- 使用 Transition 包裹，支持进场/离场动画 -->

    <div class="modal-overlay" @touchmove.stop.prevent>
      <!-- 弹窗主体：点击遮罩关闭（可选） -->
      <div class="modal-container" @click.stop>
        <!-- ✅ 标题插槽 -->
        <div class="modal-title">
          <slot name="title">
            <div v-if="title">{{ title }}</div>
          </slot>
        </div>

        <!-- ✅ 内容插槽 -->
        <div class="modal-content">
          <slot name="content">
            <div>{{ content }}</div>
          </slot>
        </div>

        <!-- ✅ 底部按钮插槽 -->
        <div class="btn-group">
          <slot name="footer">
            <div class="btn refuse" @click="onCancel">{{ cancelText || '取消' }}</div>
            <div class="btn allow" @click="onConfirm">{{ confirmText || '确认' }}</div>
          </slot>
        </div>
      </div>
    </div>
</template>

<script setup>
/**
 * 通用弹窗组件
 * 支持 v-model:visible 双向绑定
 * 支持 title / content / footer 三个具名插槽
 */

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
})

// --- Emits ---
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// --- Methods ---
const onCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}

const onConfirm = () => {
  emit('confirm')
  // 注意：确认按钮是否自动关闭由父组件决定
  // 如果希望确认后自动关闭，可在此处加上 emit('update:visible', false)
  // 但推荐由父组件控制，以支持异步操作（如请求成功后再关闭）
}
</script>

<style lang="scss" scoped>
/* ========== 蒙层 ========== */
// .modal-overlay {
//   position: fixed;
//   top: 0;
//   left: 0;
//   right: 0;
//   bottom: 0;
//   background-color: rgba(0, 0, 0, 0.5);
//   z-index: 999;
//   display: flex;
//   justify-content: center;
//   align-items: center;
// }

/* ========== 弹窗容器 ========== */
.modal-container {
  width: 100px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}

/* ========== 标题 ========== */
.modal-title {
  padding: 5px;
  text-align: center;
  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 8px;
  color: #222222;

  /* 当插槽传入自定义内容时，移除默认间距 */
  &:empty {
    display: none;
  }
}

/* ========== 内容区 ========== */
.modal-content {
  padding: 0 10px;
  text-align: center;
  margin-bottom: 5px;
}


/* ========== 按钮组 ========== */
.btn-group {
  display: flex;
  justify-content: space-around;
  padding: 0 8px 8px;
}

.btn {
  text-align: center;
  border-radius: 2px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 9px;
  color: #222222;
  padding: 1px 4px;

  &.refuse {
    background: #f0f0f0;
  }

  &.allow {
    font-weight: 600;
    background: #ffc838;
  }
}

/* ========== Transition 动画 ========== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;

  .modal-container {
    transition: transform 0.3s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.8);
  }
}
</style>