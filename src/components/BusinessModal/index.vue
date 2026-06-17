<template>
  <van-popup
    :show="visible"
    round
    position="center"
    closeable
    close-icon-position="top-right"
    @update:show="close"
    @click-overlay="close"
    class="business-modal"
  >
    <div class="title">商务合作</div>

    <!-- 微信 -->
    <div class="item">
      <div class="line">
        <img class="icon" :src="wechatIcon" alt="" />
        <span class="label">微信：</span>
      </div>
      <div class="line">
        <span class="text">we1731747901</span>
        <img class="icon copy-btn" :src="copyIcon" alt="复制" @click="handleCopy('we1731747901')" />
      </div>
    </div>

    <!-- 邮箱 -->
    <div class="item mb">
      <div class="line">
        <img class="icon" :src="emailIcon" alt="" />
        <span class="label">邮箱：</span>
      </div>
      <div class="line">
        <span class="text">fuhuanyong@sqzskj.cn</span>
        <img class="icon copy-btn" :src="copyIcon" alt="复制" @click="handleCopy('fuhuanyong@sqzskj.cn')" />
      </div>
    </div>

    <van-button type="primary" block round class="confirm-btn" @click="close">
      确定
    </van-button>
  </van-popup>
</template>

<script setup>
import { showToast, copyText } from 'vant'
import 'vant/es/toast/style'
import 'vant/es/popup/style'
import 'vant/es/button/style'

// 图片资源（Vite 项目推荐写法）
const wechatIcon = new URL('@/assets/images/common/icon_wechat@2x.png', import.meta.url).href
const emailIcon = new URL('@/assets/images/common/icon_email@2x.png', import.meta.url).href
const copyIcon = new URL('@/assets/images/common/icon_copy@2x.png', import.meta.url).href

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible'])

const close = () => {
  emit('update:visible', false)
}

const handleCopy = async (text) => {
  try {
    await copyText(text)
    showToast({ message: '已复制', type: 'success' })
  } catch {
    showToast({ message: '复制失败，请手动复制', type: 'fail' })
  }
}
</script>

<style lang="scss" scoped>
.business-modal {
  width: 280px;
  padding: 24px 16px 16px;
  box-sizing: border-box;
}

.title {
  text-align: center;
  margin-bottom: 16px;
  font-weight: 500;
  font-size: 16px;
  color: #222;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  .line {
    display: flex;
    align-items: center;
  }

  &.mb {
    margin-bottom: 30px;
  }
}

.label {
  min-width: 45px;
  font-size: 14px;
  color: #333;
  margin-left: 5px;
}

.text {
  font-size: 14px;
  color: #333;
  margin-right: 10px;
  word-break: break-all;
}

.icon {
  width: 16px;
  height: 16px;
  display: block;
  flex-shrink: 0;
}

.copy-btn {
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.5;
  }
}

.confirm-btn {
  height: 40px;
  font-size: 16px;
}
</style>