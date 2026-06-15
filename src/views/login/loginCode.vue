<template>
  <div class="page">
    <!-- 头像 -->
    <div class="avatar-wrap">
      <img class="avatar" src="@/assets/logo.png" alt="logo" />
    </div>

    <!-- 表单 -->
    <div class="form">
      <!-- 手机号 -->
      <van-field
        v-model="form.phone"
        type="number"
        maxlength="11"
        label="手机号"
        placeholder="请输入手机号"
        class="custom-field"
      />

      <!-- 验证码 -->
      <VerifyCodeInput v-model="form.code" :phone="form.phone" />

      <!-- 忘记密码 / 验证码登录 -->
      <div class="row-link">
        <span class="link" @click="goLogin">密码登录</span>
      </div>

      <!-- 登录按钮 -->
      <div class="btn-wrap">
        <van-button
          round
          block
          type="primary"
          class="login-btn"
          color="linear-gradient(90deg, #FFC838 0%, #FFC838 100%)"
          text-color="#1A1A1A"
          @click="handleLogin"
        >
          登录
        </van-button>
      </div>

      <!-- 注册账号 -->
      <div class="register-link" @click="goRegister">
        <span>注册帐号</span>
      </div>
    </div>

    <!-- 协议勾选 -->
    <div class="agreement">
      <van-checkbox
        v-model="agree"
        shape="square"
        icon-size="18px"
        checked-color="#FFC838"
      />
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { Login, GetUserInfo } from "@/api/index";
import VerifyCodeInput from "@/components/VerifyCode/index.vue";
import { useUserStore } from "@/store/modules/user";

const router = useRouter();
const userStore = useUserStore();

const form = ref({
  phone: "",
  code: "",
});

const agree = ref(true);

// 登录逻辑
const handleLogin = async () => {
  if (!form.value.phone) {
    showToast({ title: "请输入手机号", icon: "none" });
    return;
  }
  if (!form.value.code) {
    showToast({ title: "请输入验证码", icon: "none" });
    return;
  }
  if (!agree.value) {
    showToast({ title: "请先同意用户协议和隐私条款", icon: "none" });
    return;
  }

  try {
    const res = await Login({ ...form.value, type: 1 });
    if (res.code === 200) {
      userStore.setToken(res.data.session_key);

      const userRes = await GetUserInfo({ uid: res.data.id });
      userStore.setUser(userRes.data);
      router.replace("/home");
    }
  } catch (error) {
    console.error("登录失败", error);
  }
};

// 路由跳转封装
const goLogin = () => router.push("/login");
const goRegister = () => router.push("/register");
const goto = (url) => router.push(url);
</script>

<style lang="scss" scoped>
.page {
  padding: 60px 16px 20px;
  box-sizing: border-box;
  min-height: 100vh;
  background-color: #fff;
  position: relative;
}

/* 头像 */
.avatar-wrap {
  text-align: center;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column; /* 让内部元素垂直排列 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 8px;
  }
}

/* 表单 */
.form {
  width: 100%;
}

/* 自定义输入框背景 */
.custom-field {

  margin-bottom: 10px;
}

.row-link {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 25px;
  padding: 0 16px;

  .link {
    font-size: 13px;
    color: #999;
    cursor: pointer;
  }
}

/* 按钮区域 */
.btn-wrap {
  margin-bottom: 25px;

  .login-btn {
    height: 48px;
    font-size: 16px;
    font-weight: 400;
  }
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-bottom: 30px;
  cursor: pointer;
}

/* 协议区域 */
.agreement {
  position: absolute;
  bottom: calc(20px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  .text {
    font-size: 12px;
    color: #29220a;
    margin-left: 6px;

    .highlight {
      color: #ffc838;
      cursor: pointer;
    }
  }
}
</style>
