<template>
  <div class="container">
    <NavBar title="修改密码"></NavBar>


    <div class="form-area">
      <!-- 手机号输入框 -->
      <div class="input-group">
        <input type="tel" v-if="userInfo.phone_number" :value="userInfo.phone_number" :placeholder="$t('手机号')"
          maxlength="11" disabled />
        <input type="tel" v-else :value="userInfo.phone_number" :placeholder="$t('手机号')" maxlength="11" disabled />
      </div>

      <VerifyCodeInput v-model="formData.code" :phone="formData.phone"></VerifyCodeInput>

      <div class="input-group">
        <input type="password" v-model="formData.password" :placeholder="$t('请输入新密码')" />
      </div>

      <div class="input-group">
        <input type="password" v-model="formData.password" :placeholder="$t('请再次输入密码')" />
      </div>


    </div>

    <div class="btn-area">
      <button class="submit-btn" @click="handleSubmit">确定</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import VerifyCodeInput from '@/components/Code/index.vue';
import { ChangePwd } from "@/api/mine"
import NavBar from "@/components/CustomNavBar/index.vue";

import { useUserStore } from "@/store/modules/user";

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

// --- 数据定义 ---
const formData = reactive({
  code: '',
  password1: '',
  password2: '',
});


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

  min-height: 100vh;
  background: #F8F8F8;
}


/* 输入框通用样式 */
.form-area {
  margin-bottom: 30px;
  padding: 64px;
}

.input-group {
  position: relative;
  margin-bottom: 30px;
}

.input-group input {
  width: 100%;
  padding: 0 24px;
  box-sizing: border-box;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 28px;
  color: #222222;
  height: 88px;
  background: #fff;
  outline: none;
  transition: border-color 0.3s;
  border-radius: 16px;
}

.input-group input:focus {
  border-color: #5bd3a8;
}

:deep(.input-group input::placeholder) {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 28px;
  color: #CCCCCC;
}


/* 按钮区域 */
.btn-area {

  text-align: center;
}

/* 提交按钮 */
.submit-btn {
  width: 620px;
  height: 88px;
  margin: auto;
  background: #34D2A5;
  border-radius: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  display: inline-block;

  font-family: PingFangSC, PingFang SC;
font-weight: 700;
font-size: 32px;
color: #1A1A1A;

  /* 去除按钮默认样式 */
  &::after {
    border: none;
  }
}
</style>