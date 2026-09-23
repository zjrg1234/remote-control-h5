<template>
  <div class="page">
    <NavBar title="设置"></NavBar>


    <!-- 顶部操作组 -->
    <div class="card">
      <div class="item" @click="operaUrl(1)">
        <span class="label">修改密码</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div>
      <div class="item" @click="operaUrl(2)">
        <span class="label">提现密码</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div>
      <div class="item" @click="operaUrl(3)">
        <span class="label">修改手机号</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div>
    </div>

    <!-- 版本与服务信息组 -->
    <div class="card">

      <!-- <div class="item" @click="handleOpenPrivacy">
        <span class="label">隐私政策</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div>
      <div class="item" @click="handleOpenInfoList">
        <span class="label">个人信息收集清单</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div>
      <div class="item" @click="handleOpenSDKList">
        <span class="label">SDK 共享清单</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div> -->


      <div class="item" @click="handleDeleteAccount">
        <span class="label">注销账号</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div>
    </div>

    <!-- 退出登录按钮 -->
    <div class="logout-btn" @click="handleLogout">
      退出登录
    </div>

    <TipModal title="提示" v-model:visible="logoutVisible" @confirm="logout">
      <template #content>
        <div class="custom-content">确定要退出登录吗？</div>
      </template>
    </TipModal>

    <TipModal v-model:visible="logoutModal" title="" content="是否注销账号?" cancelText="取消" confirmText="确定"
      @cancel="logoutModal = false" @confirm="handleConfirm">

      <template #content>
        <div class="tip-content">
          <div class="tip-img">
            <img src="@/assets/images/icon_hint@2x.png" alt="" />
          </div>
          <div class="tip-tit">{{ $t("提示") }}</div>
          <div class="tip-text">{{ $t("确定注销账号吗？") }}</div>

        </div>
      </template>

    </TipModal>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import NavBar from "@/components/CustomNavBar/index.vue";
import { Logout, logoutAccount } from "@/api/mine";
import TipModal from "@/components/TipModal/index.vue";


const router = useRouter();
const logoutVisible = ref(false)
const logoutModal = ref(false)

const logoutType = ref(1)
let obj = Object.freeze({
  1: '/modifyPwd',
  2: '/modifyPwd',
  3: '/modifyPhone',
})

const operaUrl = (type) => {
  router.push(obj[type]);

}
// const handleOpenPrivacy = () => {
//   router.push('/privacy');
// };

// const handleOpenInfoList = () => {
//   router.push('/infoSheet');
// };

// const handleOpenSDKList = () => {
//   router.push('/sdkSheet');
// };



// 退出登录
const handleLogout = () => {
  logoutType.value = 2
  logoutVisible.value = true
};

const handleDeleteAccount = () => {
  logoutModal.value = true
}
const handleConfirm = () => {
  logoutAccount().then(res => {
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.showToast({ title: '注销成功', icon: 'success' });

    const timer = setTimeout(() => {
      logoutModal.value = false
      router.push('/login');
      clearTimeout(timer)
    }, 1500)
    // 回到首页
  }).catch();
}

const logout = () => {
  Logout().then(res => {
    localStorage.removeItem('token');
    showToast('已退出');
    router.replace('/login');
  }).catch()
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  background: #F8F8F8;
}

.card {
  background-color: #fff;
  border-radius: 16px;
  margin: 25px;
  overflow: hidden;
  padding: 0 30px 0 25px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 108px;
  line-height: 1;

  .label {

    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 28px;
    color: #222222;
    line-height: 40px;

  }



  .arrow {
    width: 32px;
    /* 16px * 2 */
    height: 32px;
    /* 16px * 2 */
  }
}

.logout-btn {
  background-color: #fff;
  border-radius: 16px;
  text-align: center;
  padding: 20px;
  margin: 30px;
  margin-top: 80px;
  color: #222222;
  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 28px;
  color: #222222;
}

.tip-content {
  padding: 20px 0 52px 0;
}

.tip-img {
  width: 100%;
  display: flex;
  justify-content: center;
  /* 水平居中 */
  align-items: center;

  img {
    width: 120px;
    height: 120px;
  }
}

.tip-tit {
  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 32px;
  color: #1A1A1A;
  padding: 32px 0;
}

.tip-text {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 28px;
  color: #1A1A1A;
  text-align: center;
  font-style: normal;
}
</style>