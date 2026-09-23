<template>
  <div class="input-group code-input-group">
    <input 
      type="text" 
      :value="modelValue" 
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder" 
      maxlength="6"
    />
    <span 
      class="get-code-text" 
      :class="{ disabled: countdown > 0 }"
      @click="handleGetCode"
    >
      {{ countdown > 0 ?  $t('ns后重新获取',{num:countdown }) :$t('获取验证码') }}
    </span>
  </div>
</template>

<script setup>

import { ref, watch, onMounted, onUnmounted } from 'vue';
import { showToast } from 'vant';
import { GetPhoneCode } from '@/api/index';
import { $t } from "@/locales"
// 定义 Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: $t('验证码')
  },
  countdownSeconds: {
    type: Number,
    default: 60
  }
})

// 定义 Emits
const emit = defineEmits(['update:modelValue', 'send'])

// 倒计时状态
const countdown = ref(0)
let timer = null

// 处理点击获取验证码
const handleGetCode = () => {
  if (countdown.value > 0) return
  
  if (!props.phone) {
    showToast($t('请输入手机号'))
    return
  }
  
  // 校验手机号格式
  // if (!/^1[3-9]\d{9}$/.test(props.phone)) {
  //   showToast('请输入正确的手机号')
  //   return
  // }

  sendRequest();
  // 开始倒计时

}

// 发送验证码请求
const sendRequest = async () => {
  try {
    await GetPhoneCode({ phone: props.phone });
    
    showToast($t('发送成功'));
    emit('success');
    startCountdown();
  } catch (err) {
    showToast( '发送失败，请重试',);
    emit('error', err);
  }
};

// 开始倒计时
const startCountdown = () => {
  countdown.value = props.countdownSeconds
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 组件销毁时清理定时器，防止内存泄漏
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.input-group {
  position: relative;
}

.code-input-group {
  display: flex;
  align-items: center;
}


.input-group input {
  width: 100%;
  height: 96px;
  padding: 0 25px;
  box-sizing: border-box;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 30px;
  color: #1A1A1A;
  background-color: #fff;
  outline: none;
  transition: border-color 0.3s;
  border-radius: 16px;
}

.input-group input:focus {
  border-color: #5bd3a8;
}

.input-group input::placeholder {
  color: #2d3748;
}

/* 获取验证码文字按钮 */
.get-code-text {
  position: absolute;
  right: 16px;
  font-size: 15px;
  color: #5bd3a8;
  cursor: pointer;
  user-select: none;

  font-family: PingFangSC, PingFang SC;
font-weight: 400;
font-size: 30px;
color: #34D2A5;

}

.get-code-text.disabled {
  color: #a0aec0;
  cursor: not-allowed;
}
</style>