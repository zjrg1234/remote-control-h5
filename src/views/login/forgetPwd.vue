<template>
  <div class="page">
    <!-- 页面标题区域 -->
    <div class="header">
      <h2 class="title">重置密码</h2>
    </div>

    <!-- 表单 -->
    <div class="form">
      <!-- <van-form @submit="handleLogin">
       
      </van-form> -->


	   <!-- 输入框组 -->
        <div class="form-card">
          <!-- 手机号 -->

		  <van-cell-group inset>
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
            placeholder="请输入新密码"
            
          />

          <!-- 确认密码 -->
          <van-field
            v-model="form.passwordAgain"
            type="password"
            maxlength="20"
            placeholder="请再次输入新密码"
           
          />

		  </van-cell-group>
        </div>

        <!-- 提交按钮 -->
        <div class="btn-wrap">
          <van-button 
            round 
            block 
            type="primary" 
            native-type="submit"
            class="submit-btn"
            color="linear-gradient(90deg, #FFC838 0%, #FFC838 100%)"
            text-color="#1A1A1A"
          >
            确认修改
          </van-button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { UserChangePwd } from '@/api/index';
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
  try {
    const res = await UserChangePwd(form.value);
    if (res.code === 200) {
      showToast('密码修改成功');
      // 跳转到登录页
      router.replace('/login');
    }
  } catch (error) {
    console.error('修改密码失败', error);
  }
};
</script>

<style lang="scss" scoped>
.page {
  padding: 40px 16px;
  box-sizing: border-box;
  min-height: 100vh;
  background-color: #f7f8fa; /* 浅灰色背景，突出表单卡片 */
}

/* 页面头部 */
.header {
  margin-bottom: 30px;
  padding-left: 8px;

  .title {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

/* 表单卡片区域 */
.form-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden; /* 确保内部输入框的圆角不溢出 */
  padding-bottom: 2px;
}

/* 按钮区域 */
.btn-wrap {
  margin: 40px 0 20px;

  .submit-btn {
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    /* 增加按钮的立体感 */
    box-shadow: 0 4px 10px rgba(255, 200, 56, 0.4);
  }
}
</style>