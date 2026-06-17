<template>
  <div class="page">
    <!-- 头像 -->
    <div class="avatar-wrap">
      <img class="avatar" src="@/assets/logo.png" alt="logo" />
    </div>

    <!-- 表单 -->
    <div class="form">
      <van-form @submit="handleLogin">
        <van-field
          v-model="form.phone"
          type="tel"
          label="手机号"
          placeholder="请输入手机号"
        />

        <van-field
          v-model="form.password"
          type="password"
          maxlength="6"
          label="密码"
          placeholder="请输入密码"
        />

        <!-- 忘记密码 / 验证码登录 -->
        <div class="row-link">
          <span class="link" @click="goForgetPwd">忘记密码</span>
          <span class="link" @click="goCodeLogin">验证码登录</span>
        </div>

        <!-- 登录按钮 -->
        <div class="btn-wrap">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            color="linear-gradient(90deg, #ffc838 0%, #ffc838 100%)"
            text-color="#1a1a1a"
          >
            登录
          </van-button>
        </div>
      </van-form>

      <!-- 注册账号 -->
      <div class="register-link" @click="goRegister">
        <span>注册帐号</span>
      </div>
    </div>

    <!-- 协议勾选 -->
    <div class="agreement">
      <van-checkbox
        v-model="agree"
        shape="round"
        icon-size="16px"
        checked-color="#ffc838"
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
import { useUserStore } from "@/store/modules/user";

const router = useRouter();
const userStore = useUserStore();

const form = ref({
  phone: "",
  password: "",
});
const agree = ref(true);

// 登录逻辑
const handleLogin = async () => {
  if (!form.value.phone) {
    showToast({
      title: "请输入手机号",
      icon: "none",
    });
    return;
  }
  if (!form.value.password) {
    showToast({
      title: "请输入密码",
      icon: "none",
    });
    return;
  }
  if (!agree.value) {
    showToast("请先同意用户协议和隐私条款");
    return;
  }

  try {
    const res = await Login({ ...form.value, type: 1 });
    if (res.code === 200) {
      userStore.setToken(res.data.session_key);
      userStore.setAreaId(res.data.special_area);
      userStore.setId(res.data.id);

      const userRes = await GetUserInfo({ uid: res.data.id });
      userStore.setUser(userRes.data);

      // 替换 uni.switchTab，跳转到首页
      router.replace("/index");
    }
  } catch (error) {
    console.error("登录失败", error);
  }
};

// 路由跳转封装
const goForgetPwd = () => router.push("/forgetPwd");
const goCodeLogin = () => router.push("/loginCode");
const goRegister = () => router.push("/register");
const goto = (url) => router.push(url);
</script>

<style lang="scss" scoped>
.page {
  padding: 60px 16px 40px;
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

/* 链接行 */
.row-link {
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
  margin-bottom: 25px;

  .link {
    font-size: 13px;
    color: #999;
    cursor: pointer;
  }
}

/* 按钮区域 */
.btn-wrap {
  padding: 0 16px;
  margin-bottom: 25px;
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
