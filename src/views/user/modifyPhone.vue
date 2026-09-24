<template>
  <div class="container">
    <CustomNavBar title="修改手机号"></CustomNavBar>
    <div class="cont">
      <div class="form-wrapper">
        <p class="title">当前手机号码:{{ userInfo.phone_number }}</p>
        <VerifyCodeInput class="code-input" v-model="formData.code" :phone="userInfo.phone_number" />
      </div>
      <div class="form-wrapper">
        <p class="title">新手机号</p>
        <div class="input-item">
          <input class="input" maxlength="11" placeholder="请输入新手机号" v-model="formData.new_phone_number" />
        </div>
        <VerifyCodeInput class="code-input" v-model="formData.code" :phone="formData.new_phone_number" />
      </div>


    <div class="btn-area">
      <button class="submit-btn" @click="handleSubmit">确定</button>
    </div>

    </div>


  </div>

</template>

<script setup>
import { reactive, computed } from "vue";
import { showToast } from "vant";
import VerifyCodeInput from "@/components/Code/index.vue";
import { ChangePhone } from "@/api/mine";
import { useUserStore } from "@/store/modules/user";

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);
// --- 数据定义 ---
const formData = reactive({
  code: "",
  new_phone_number: "",
  phone: "",
});

// 提交表单
const handleSubmit = () => {
  if (!formData.phone) return showToast({ title: '请输入旧手机号', icon: 'none' });
  if (!formData.code) return showToast({ title: '请输入验证码', icon: 'none' });
  if (!formData.new_phone_number) return showToast({ title: '请输入新手机号', icon: 'none' });

  ChangePhone({
    ...formData
  }).then(res => {
    if (res.code == 200) {
      showToast({ title: '修改手机号码成功', icon: 'success' });
    } else {
      showToast({ title: res.msg, icon: 'none' });
    }
  }).catch()

};
</script>

<style lang="scss" scoped>
.container {
  background: #fff;
}

.cont {
  min-height: 100vh;
  padding: 20px;
  background: #F8F8F8;
}


.form-wrapper {
  background: #FFFFFF;
  border-radius: 16px;
  margin-bottom: 20px;
  padding-bottom: 40px;

  .title {
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 28px;
    color: #222222;
    line-height: 40px;
    padding: 40px 0;
    text-align: center;
  }

  .code-input {
    margin: 0 20px;
  }

  :deep(.code-input input) {
    background: #F8F8F8;

    &::placeholder {
      color: #ccc;
    }
  }

}

.input-item {
  height: 88px;
  background-color: #f7f7f7;
  border-radius: 12px;
  display: flex;
  align-items: center;
  position: relative;
  margin: 0 20px;
  margin-bottom: 32px;

  input {
    background-color: #f7f7f7;
  }

  &.phone-box {
    color: #333;
    font-size: 28px;
    font-weight: 500;
  }
}

.input {
  flex: 1;
  height: 100%;
  font-size: 28px;
  padding-left: 20px;

  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 28px;
  color: #222222;

  &::placeholder {
    color: #ccc;
  }
}

/* 手机号文本 */
.phone-text {
  margin-left: 20px;
  font-size: 28px;
  color: #333;
}

/* 验证码按钮 */
.code-btn {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 28px;
  color: #ff8500;
  position: absolute;
  right: 20px;
  padding: 10px 20px;
}

/* 按钮区域 */
.btn-area {
  margin-top: 70px;
  width: 100%;
  text-align: center;
}

/* 提交按钮 */
.submit-btn {
  margin: auto;
  width: 702px;
  height: 94px;
  background: #34D2A5;
  border-radius: 44px;
  margin-top: 25px;

  /* 黄色背景 */
  color: #333;
  /* 黑色文字 */
  font-size: 32px;
  font-weight: bold;
  border-radius:50px;
  line-height: 94px;

  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 32px;
  color: #1A1A1A;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;


  /* 去除按钮默认样式 */
  &::after {
    border: none;
  }
}
</style>
