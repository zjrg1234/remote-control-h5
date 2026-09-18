<template>
  <div class="page">
    <van-form ref="formRef" @submit="handleSubmit">
      <!-- 手机号 -->
      <van-field
        v-model="form.phone"
        type="tel"
        maxlength="11"
        label="+86"
        label-width="36"
        :placeholder="$t('请输入手机号')"
        class="input-item"
        :border="false"
        :rules="phoneRules"
      />

      <!-- 验证码 -->
      <VerifyCodeInput v-model="form.code" :phone="form.phone" />

      <!-- 密码 -->
      <van-field
        v-model="form.password"
        type="password"
        maxlength="6"
        :placeholder="$t('请输入密码')"
        class="input-item"
        :border="false"
        :rules="passwordRules"
      />

      <!-- 确认密码 -->
      <van-field
        v-model="form.passwordAgain"
        type="password"
        maxlength="6"
        :placeholder="$t('请再次输入密码')"
        class="input-item"
        :border="false"
        :rules="passwordAgainRules"
      />

      <van-button block native-type="submit" class="login-btn">
         {{ $t('确认修改') }}
      </van-button>
    </van-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { UserChangePwd } from '@/api/index'
import { useUserStore } from '@/store/modules/user'
import VerifyCodeInput from '@/components/Code/index.vue'
import { $t } from "@/locales"

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)

const form = ref({
  phone: '',
  password: '',
  code: '',
  passwordAgain: ''
})

const agree = ref(true) // 保留原字段，如无用途可删

/* ---------------- 校验规则 ---------------- */
// const phoneRules = [
//   { required: true, message: '请输入手机号' },
//   { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
// ]

const passwordRules = [
  { required: true, message: $t('请输入新密码') },
  { validator: (val) => val.length >= 6, message: $t('密码至少6位') }
]

const passwordAgainRules = [
  { required: true, message: $t('请再次输入新密码') },
  {
    validator: (val) => val === form.value.password,
    message: $t('两次密码输入不一致')
  }
]

/* ---------------- 提交 ---------------- */
const handleSubmit = () => {
  UserChangePwd({ ...form.value })
    .then((res) => {
      if (res.code === 200) {
        showSuccessToast($t('修改成功'))
        router.replace('/login')
      } else {
        showToast(res.msg || $t('修改失败'))
      }
    })
    .catch(() => {
      // 全局拦截器已处理
    })
}
</script>

<style lang="scss" scoped>
.page {
  padding: 10px 32px 40px;
  box-sizing: border-box;
  min-height: 100vh;
  background-color: #fff;
}

/* 表单 */
.input-item {
  display: flex;
  align-items: center;
  background-color: #f7f7f7;
  border-radius: 12px;
  padding: 0 24px;
  height: 96px;
  margin-bottom: 24px;
  box-sizing: border-box;
  overflow: hidden;

  /* 去掉 van-cell 自带的下边框 */
  &::after {
    display: none;
  }

  :deep(.van-field__label) {
    color: #333;
    font-size: 28px;
    margin-right: 16px;
  }

  :deep(.van-field__control) {
    font-size: 28px;
    height: 96px;
    background: transparent;
  }

  :deep(.van-cell__value) {
    overflow: visible;
  }
}

/* 提交按钮 */
.login-btn {
  --van-button-default-background: #ffc838;
  --van-button-default-border-color: #ffc838;
  --van-button-default-color: #1a1a1a;

  height: 88px;
  border-radius: 24px;
  font-size: 32px;
  font-weight: 400;
  margin-top: 52px;
}
</style>