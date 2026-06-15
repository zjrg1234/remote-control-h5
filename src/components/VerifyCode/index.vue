<template>
  <div class="input-item">
    <van-field
      v-model="inputValue"
      type="number"
      maxlength="6"
      :placeholder="placeholder"
      autocomplete="off"
      autocorrect="off"
      :name="randomInputName"
      class="custom-field"
    >
      <!-- 使用 Vant 4 的 button 插槽放置右侧按钮 -->
      <template #button>
        <span
          class="code-btn"
          :class="{ disabled: isCounting }"
          @click="handleClick"
        >
          {{ btnText }}
        </span>
      </template>
    </van-field>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { showToast } from 'vant';
import { GetPhoneCode } from '@/api/index';

// 1. 定义延迟渲染的状态（防止浏览器自动填充）
const inputReady = ref(false);
const randomInputName = ref('verify_code_' + Math.random().toString(36).substring(2, 9));

onMounted(() => {
  setTimeout(() => {
    inputReady.value = true;
  }, 100);
});

// --- Props 定义 ---
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  time: { type: Number, default: 60 },
  placeholder: { type: String, default: '请输入验证码' },
  phone: { type: String, required: true }
});

const emit = defineEmits(['update:modelValue', 'success', 'error']);

const inputValue = ref(props.modelValue);
const isCounting = ref(false);
const count = ref(props.time);
let timer = null;
const btnText = ref('获取验证码');

// 监听输入值变化，同步给父组件
watch(inputValue, (val) => {
  emit('update:modelValue', val);
});

// 发送验证码请求
const sendRequest = async () => {
  try {
    await GetPhoneCode({ phone: props.phone });
    
    showToast('发送成功');
    emit('success');
    startCountdown();
  } catch (err) {
    showToast( '发送失败，请重试',);
    emit('error', err);
  }
};

// --- 倒计时逻辑 ---
const startCountdown = () => {
  isCounting.value = true;
  count.value = props.time;
  btnText.value = `${count.value}s后重发`;

  timer = setInterval(() => {
    count.value--;
    if (count.value <= 0) {
      clearInterval(timer);
      isCounting.value = false;
      btnText.value = '获取验证码';
    } else {
      btnText.value = `${count.value}s后重发`;
    }
  }, 1000);
};

// 组件卸载时清除定时器，防止内存泄漏
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// --- 按钮点击事件 ---
const handleClick = () => {
  if (isCounting.value) return;
  if (!props.phone) {
    showToast('手机号不能为空');
    return;
  }
  sendRequest();
};
</script>

<style lang="scss" scoped>
.input-item {
  margin-bottom: 15px;
//   border-bottom: 1px solid #ebedf0;
}

/* 覆盖 Vant Field 默认背景，适配你的设计 */
.custom-field {
  background-color: #fff;

  border-bottom: 1px solid #ebedf0;
}

.code-btn {
  color: #ffc200;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.code-btn.disabled {
  color: #999;
  cursor: not-allowed;
}
</style>