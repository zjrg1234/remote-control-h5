<template>
  <div class="page">
     <div class="header">
      <h2 class="title">注册账号</h2>
    </div>

    <!-- 表单 -->
    <div class="form">

        <!-- 手机号 -->
        <van-field
          v-model="form.phone"
          type="number"
          maxlength="11"
          label="+86"
          placeholder="请输入手机号"
          
        />

        <!-- 验证码 -->
        <VerifyCodeInput 
          v-model="form.code" 
          :phone="form.phone" 
        />

        <!-- 密码 -->
        <van-field
          v-model="form.password"
          type="password"
          maxlength="20"
          placeholder="请输入密码"
          
        />

        <!-- 确认密码 -->
        <van-field
          v-model="form.passwordAgain"
          type="password"
          maxlength="20"
          placeholder="请再次输入密码"
          
        />

        <!-- 提交按钮 -->
        <div class="btn-wrap">
          <van-button 
            round 
            block 
            type="primary" 
            native-type="submit"
            color="linear-gradient(90deg, #FFC838 0%, #FFC838 100%)"
            text-color="#1A1A1A"
            @click="handleLogin"
          >
            完成
          </van-button>
        </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { Register } from '@/api/index';
import VerifyCodeInput from '@/components/VerifyCode/index.vue';

const router = useRouter();

const form = ref({
  phone: '',
  password: '',
  code: '',
  passwordAgain: ''
});

// 自定义校验：密码长度
const validatePassword = (val) => {
  return val ? val.length >= 6 : false;
};

// 自定义校验：两次密码一致性
const validatePasswordAgain = (val) => {
  return val === form.value.password;
};

// 表单提交（Vant 会自动校验，校验失败不会触发此函数）
const handleLogin = async () => {

  if (!form.value.phone || form.value.phone.length !== 11) {
		showToast(
			 '请输入手机号'
		);
		return;
	}
	if (!form.value.code) {
		showToast('请输入验证码');
		return;
	}
	if (!form.value.password || form.value.password.length < 6) {
		showToast( '密码至少6位');
		return;
	}
	if (form.value.password !== form.value.passwordAgain) {
		showToast('两码输入不一致');
		return;
	}

  try {
    const res = await Register({
      ...form.value,
      type: 1,
      noteVerify: form.value.code
    });

    if (res.code === 200) {
      showToast('注册成功');
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.replace('/home'); // 替换 uni.reLaunch，跳转到首页
      }, 1500);
    }
  } catch (error) {
    console.error('注册失败', error);
  }
};
</script>

<style lang="scss" scoped>
.page {
  padding: 10px 16px 40px;
  box-sizing: border-box;
  min-height: 100vh;
  background-color: #fff;
}

.header {
  margin-bottom: 30px;
  padding-left: 8px;

  .title {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px 0;
  }
}


.form {
  width: 100%;
}

.btn-wrap {
  margin: 30px 16px 50px;
}
</style>