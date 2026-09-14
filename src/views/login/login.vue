<template>
  <div class="page">
    <!-- 头像 -->
    <div class="avatar-wrap">
      <img class="avatar" src="@/assets/logo.png" alt="logo" />
    </div>
    <div class="login-card">
      <!-- 顶部Tab切换 -->
      <div class="tab-switch">
        <div class="tab-item" :class="{ active: loginType === 'code' }" @click="loginType = 'code'">
          {{ $t('验证码登录') }}
        </div>
        <div class="tab-item" :class="{ active: loginType === 'password' }" @click="loginType = 'password'">
          
           {{ $t('密码登录') }}
        </div>
      </div>

      <!-- 表单输入区 -->
      <div class="form-area">
        <!-- 手机号输入框 -->
        <div class="input-group">
          <input type="tel" v-model="formData.phone" :placeholder="$t('手机号')" maxlength="11" />
        </div>

        <!-- 验证码登录模式 -->
        <template v-if="loginType === 'code'">
          <VerificationCode v-model="formData.code" :phone="formData.phone"></VerificationCode>
          <!-- 未注册提示 -->
          <p class="register-hint">{{ $t("若该手机号未注册我们将自动为您注册") }}</p>
        </template>

        <!-- 密码登录模式 -->
        <template v-else>
          <div class="input-group">
            <input type="password" v-model="formData.password" :placeholder="$t('密码')" />
          </div>
          <div class="forgot-password">
            <a href="javascript:void(0)">{{$t('忘记密码')}}</a>
          </div>
        </template>
      </div>

      <!-- 登录按钮 -->
      <button class="submit-btn" @click="handleLogin">
        {{$t("登录")}}
      </button>
    </div>

    <div class="agreement">
      <van-checkbox v-model="agree" shape="round" icon-size="16px" checked-color="#34D2A5" />
      <span class="text">
        我已同意
        <span class="highlight" @click="goto('/userPolicy')">用户协议</span>
        和
        <span class="highlight" @click="goto('/privacy')">隐私条款</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { Login, GetUserInfo } from "@/api/index";
import { useUserStore } from "@/store/modules/user";

import VerificationCode from '@/components/Code/index.vue' // 引入组件


const userStore = useUserStore();
const router = useRouter();
// 当前登录方式，默认验证码登录
const loginType = ref('code')

// 表单数据
const formData = ref({
  phone: '',
  password: '',
  code: ''
})
const agree = ref(true);

// 验证码倒计时
const countdown = ref(0)



// 登录逻辑
const handleLogin = async () => {
  if (!agree.value) {
    showToast($t("请先同意用户协议和隐私条款"));
    return;
  }

  if (!formData.value.phone) {
    showToast($t("请输入手机号"));
    return;
  }

  if (loginType.value == 'code') {
    if (!formData.value.code) {
      showToast('请输入验证码');
      return;
    }
  } else {
    if (!formData.value.password) {
      showToast($t('请输入密码'));
      return;
    }
  }

  try {
    let obj = {};
    obj.phone = formData.value.phone;
    if (loginType.value == 'code') {

      obj.noteVerify = formData.value.code;
    } else {
      obj.password = formData.value.password;
    }
    const res = await Login({ ...obj, type: 1 });
    if (res.code === 200) {
      userStore.setToken(res.data.session_key);
      localStorage.setItem('token', res.data.session_key)
      userStore.setAreaId(res.data.special_area);
      userStore.setId(res.data.id);

      const userRes = await GetUserInfo({ uid: res.data.id });
      userStore.setUser(userRes.data);

      // 替换 uni.switchTab，跳转到首页
      router.replace("/index");
    } else {
      showToast(res.msg)
    }
  } catch (error) {
    console.error("登录失败", error);
  }
};
</script>

<style lang="scss" scoped>
.page {
  padding: 120px 0 80px;
  box-sizing: border-box;
  min-height: 100vh;
  background-color: #fff;
  position: relative;
}

/* 头像 */
.avatar-wrap {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .avatar {
    width: 160px;
    height: 160px;
    border-radius: 16px;
  }
}


.login-card {
  width: 100%;
  padding: 115px 60px;
  box-sizing: border-box;
}

/* Tab 切换 */
.tab-switch {
  display: flex;
  background: #EDEDED;
  margin: 0 100px;
  margin-bottom: 60px;
  border-radius: 40px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  border-radius: 36px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 28px;
  color: #666666;

}

.tab-item.active {
  color: #1a202c;
  /* 选中时的文字为深色 */
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(91, 211, 168, 0.3);

  background: #34D2A5;
  border-radius: 34px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 28px;
  color: #1A1A1A;
}

/* 输入框通用样式 */
.form-area {
  margin-bottom: 68px;
}

.input-group {
  position: relative;
  margin-bottom: 20px;
}

.input-group input {
  width: 100%;
  height: 96px;
  padding: 0 24px;
  box-sizing: border-box;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 30px;
  color: #1A1A1A;
  background-color: #fff;
  outline: none;
  transition: border-color 0.3s;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.2);

}

.input-group input:focus {
  border-color: #5bd3a8;
}

.input-group input::placeholder {
  color: #2d3748;
}

/* 验证码输入框内部布局 */
.code-input-group {
  display: flex;
  align-items: center;
  position: relative;
}

.code-input-group input {
  padding-right: 110px;
  /* 给右侧的获取验证码文字留出空间 */
}

/* 获取验证码文字链接 */
.get-code-text {
  position: absolute;
  right: 16px;
  font-size: 15px;
  color: #5bd3a8;
  cursor: pointer;
  user-select: none;
}

.get-code-text.disabled {
  color: #a0aec0;
  cursor: not-allowed;
}

/* 注册提示文本 */
.register-hint {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 26px;
  color: #999999;
  line-height: 37px;
  text-align: justify;
  font-style: normal;

}

/* 忘记密码 */
.forgot-password {
  text-align: right;
  margin-top: -10px;
  margin-bottom: 20px;
}

.forgot-password a {

  text-decoration: none;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 24px;
  color: #34D2A5;

}

/* 登录按钮 */
.submit-btn {
  width: 100%;
  height: 94px;
  background-color: #5bd3a8;

  border: none;
  border-radius: 47px;
  cursor: pointer;
  transition: opacity 0.3s;

  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 32px;
  color: #1A1A1A;

}

.submit-btn:active {
  opacity: 0.8;
}

/* 协议区域 */
.agreement {
  display: flex;
  align-items: center;
  /* 关键：垂直居中对齐 */
  justify-content: center;
  /* 水平居中 */
  position: absolute;
  bottom: calc(40px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  width: 100%;
  align-items: baseline;

  .text {
    margin-left: 12px;

    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 26px;
    color: #1A1A1A;


    .highlight {
      color: #34D2A5;
      cursor: pointer;
    }
  }
}
</style>