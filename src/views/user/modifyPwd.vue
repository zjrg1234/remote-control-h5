<template>
  <div class="container">

    <div class="form-wrapper">

      <div class="input-item phone-box">
        <span class="phone-text">{{ userInfo.phone_number }}</span>
      </div>

      <VerifyCodeInput v-model="formData.code" :phone="userInfo.phone_number" />

      <div class="input-item">
        <!-- <span class="icon-locked">🔒</span> -->

        <input class="input" :type="showPassword1 ? 'text' : 'password'" maxlength="12" placeholder="请输入新密码"
          v-model="formData.password1" />

        <span class="icon-eye" @click="showPassword1 = !showPassword1">
          {{ showPassword1 ? '🙈' : '👁️' }}
        </span>
      </div>

      <div class="input-item">
        <!-- <span class="icon-locked">🔒</span> -->

        <input class="input" maxlength="12" :type="showPassword2 ? 'text' : 'password'" placeholder="请再次输入密码"
          v-model="formData.password2" />

        <span class="icon-eye" @click="showPassword2 = !showPassword2">
          {{ showPassword2 ? '🙈' : '👁️' }}
        </span>
      </div>
    </div>

    <div class="btn-area">
      <button class="submit-btn" @click="handleSubmit">确定</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import VerifyCodeInput from '@/components/verify-code/verify-code.vue';
import { ChangePwd } from "@/api/mine.js"

import { useUserStore } from "@/store/modules/user";

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

// --- 数据定义 ---
const formData = reactive({
  code: '',
  password1: '',
  password2: '',
});

const showPassword1 = ref(false);
const showPassword2 = ref(false);

// 提交表单
const handleSubmit = () => {
  if (!formData.code) return uni.showToast({ title: '请输入验证码', icon: 'none' });
  if (!formData.password1) return uni.showToast({ title: '请输入新密码', icon: 'none' });
  if (formData.password1 !== formData.password2)
    return uni.showToast({ title: '两次密码不一致', icon: 'none' });
  console.log(formData)
  ChangePwd({ code: formData.code, phone: userInfo.value.phone_number, password: formData.password1 }).then(res => {
    if (res.code == 200) {
      uni.showToast({ title: '密码重置成功', icon: 'success' });
    } else {
      uni.showToast({ title: res.msg, icon: 'none' });
    }
    // 这里执行提交逻辑
  }).catch()

};
</script>

<style lang="scss" scoped>
.container {
  padding: 120px; /* 60rpx * 2 */
  background-color: #fff;
  min-height: 100vh;
}

.input-item {
  height: 176px; /* 88rpx * 2 */
  background-color: #f7f7f7;
  border-radius: 24px; /* 12rpx * 2 */
  margin-bottom: 50px; /* 25rpx * 2 */
  padding: 0 60px; /* 0 30rpx * 2 */
  display: flex;
  align-items: center;
  position: relative;

  &.phone-box {
    color: #333;
    font-size: 56px; /* 28rpx * 2 */
    font-weight: 500;
  }
}

.input {
  flex: 1;
  height: 100%;
  font-size: 56px; /* 28rpx * 2 */
  padding-left: 40px; /* 20rpx * 2 */
  color: #333;
  border: none;
  background: transparent;
  outline: none;

  &::placeholder {
    color: #999;
  }
}

/* 手机号文本 */
.phone-text {
  margin-left: 40px; /* 20rpx * 2 */
  font-size: 56px; /* 28rpx * 2 */
  color: #333;
}

/* 眼睛图标（替代 uni-icons） */
.icon-eye {
  font-size: 40px; /* uni-icons size 20px * 2 */
  line-height: 1;
  color: #999;
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
}

/* 验证码按钮 */
.code-btn {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 56px; /* 28rpx * 2 */
  color: #FF8500;
  position: absolute;
  right: 40px; /* 20rpx * 2 */
  padding: 20px 40px; /* 10rpx 20rpx * 2 */
}

/* 按钮区域 */
.btn-area {
  margin-top: 160px; /* 80rpx * 2 */
  padding: 0 40px; /* 0 20rpx * 2 */
}

/* 提交按钮 */
.submit-btn {
  background-color: #f7ba2a;
  /* 黄色背景 */
  color: #333;
  /* 黑色文字 */
  font-size: 64px; /* 32rpx * 2 */
  font-weight: bold;
  border-radius: 24px; /* 12rpx * 2 */
  height: 180px; /* 90rpx * 2 */
  line-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 去除按钮默认样式 */
  &::after {
    border: none;
  }
}
</style>