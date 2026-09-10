<template>
  <div class="page">
    <div class="avatar-wrap">
      <img class="avatar" src="@/assets/logo.png" mode="aspectFill" />
    </div>

    <form class="form">
      <!-- 手机号 -->
      <div class="input-item">
        <span class="prefix">+86</span>
        <input
          class="input"
          type="number"
          maxlength="11"
          :placeholder="$t('请输入手机号')"
          v-model="form.phone"
        />
      </div>

      <!-- 密码 -->
      <div class="input-item input-item--last">
        <input
          class="input"
          type="password"
          maxlength="10"
         :placeholder="$t('请输入密码')"
          autocomplete="password"
          v-model="form.password"
        />
      </div>

      <!-- 忘记密码 / 验证码登录 -->
      <div class="row-link">
        <span class="link" @click="goForgetPwd">忘记密码</span>
        <span class="link" @click="goCodeLogin">验证码登录</span>
      </div>

      <!-- 登录按钮 -->
      <div class="login-btn" @click="handleLogin">登录</div>

      <!-- 注册账号 -->
      <div class="register-link" @click="goRegister">
        <span>注册帐号</span>
      </div>
    </form>

    <div class="agreement">
      <div class="checkbox" :class="{ checked: agree }" @click="agree = !agree">
        <img
          class="check-icon"
          src="@/assets/images/login/checked@2x.png"
          mode="aspectFill"
          v-if="agree"
        />
        <img
          class="un-check-icon"
          src="@/assets/images/login/circle@2x.png"
          mode="aspectFill"
          v-if="!agree"
        />
      </div>
      <span class="span">
        我已同意<span
          class="highlight"
          @click="goto('/set/userPolicy')"
          >用户协议</span
        >
        和
        <span @click="goto('/set/privacy')" class="highlight"
          >隐私条款</span
        >
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Login, GetUserInfo } from "@/api/index";
import { useUserStore } from "@/store/modules/user";
import { useRouter } from "vue-router";
const router = useRouter();

const form = ref({
  phone: "",
  password: "",
});

const agree = ref(false);
const userStore = useUserStore();
// 登录
const handleLogin = async () => {
  if (!agree.value) {
    uni.showToast({
      title: "请先同意用户协议和隐私条款",
      icon: "none",
    });
    return;
  }

  if (!form.value.phone) {
    uni.showToast({
      title: "请输入手机号",
      icon: "none",
    });
    return;
  }
  if (!form.value.password) {
    uni.showToast({
      title: "请输入密码",
      icon: "none",
    });
    return;
  }

  Login({
    ...form.value,
    password: form.value.password,
    type: 1,
  })
    .then((res) => {
      if (res.code == 200) {
        userStore.setToken(res.data.session_key);
        userStore.setAreaId(res.data.special_area);
        userStore.setId(res.data.id);

        GetUserInfo({ uid: res.data.id })
          .then((res) => {
            userStore.setUser(res.data);

            uni.switchTab({
              url: "/pages/index/index",
            });
          })
          .catch();
      } else {
        uni.showToast({
          title: res.msg,
          icon: "none",
        });
      }
    })
    .catch();
  // 这里写你的登录接口
};

const goForgetPwd = () => {
  router.push("/forgetPwd");
};

const goCodeLogin = () => {
  router.push("/loginCode");
};

const goRegister = () => {
  router.push("/register");
};

const goto = (url) => {
  router.push(url);
};
</script>

<style lang="scss" scoped>
.page {
  padding: 138px 32px 68px;
  box-sizing: border-box;
  position: relative;
  height: 100vh;
  background-color: #fff;
}
/* 头像 */
.avatar-wrap {
  text-align: center;
  margin-bottom: 64px;

  .avatar {
    width: 128px;
    height: 128px;
    border-radius: 16px;
    margin: auto;
  }
}

/* 表单 */
.form {
  width: 100%;
}

.input-item {
  font-family: PingFangSC, PingFang SC;
  display: flex;
  align-items: center;
  background-color: #f8f8f8;
  font-size: 28px;
  border-radius: 16px;
  padding: 0 12px;
  height: 96px;
  margin-bottom: 32px;
  &--last {
    margin-bottom: 18px;
  }

  .prefix {
    font-weight: 400;
    font-size: 28px;
    color: #0e0e0e;
    margin-right: 8px;
  }

  .input {
    flex: 1;
    font-size: 28px;
    background: transparent;
    padding-left: 5px;
    height: 96px;

    color: #0e0e0e;
  }
}

.row-link {
  display: flex;
  justify-content: space-between;
  margin-bottom: 55px;
  .link {
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 24px;
    color: #999999;
  }
}

.login-btn {
  background: linear-gradient(90deg, #ffc838 0%, #ffc838 100%);
  border-radius: 24px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 32px;
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 48px;
  height: 96px;
  line-height: 96px;
  font-style: normal;
}

.register-link {
  text-align: center;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 28px;
  color: #999999;
}

.other-login {
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  .line {
    flex: 1;
    height: 0.5px;
    background-color: #eee;
  }

  .span {
    font-size: 13px;
    color: #999;
    margin: 0 10px;
  }
}

.third-list {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 40px;

  .third-item {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;

    .icon {
      width: 100%;
      height: 100%;
    }
  }
}

.agreement {
  position: absolute;
  bottom: 68px;
  left: 50%;
  width: 100%;
  transform: translatex(-50%);
  display: flex;
  align-items: center;
  justify-content: center;

  .checkbox {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    margin-right: 6px;
    display: flex;
    align-items: center;
    justify-content: center;

    .check-icon {
      width: 40px;
      height: 40px;
    }

    .un-check-icon {
      width: 46px;
      height: 46px;
    }
  }

  .span {
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 24px;
    color: #29220a;

    .highlight {
      color: #ffc838;
    }
  }
}
</style>
