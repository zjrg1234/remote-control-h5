<template>
  <div class="page">
    <NavBar title="设置"></NavBar>


    <!-- 顶部操作组 -->
    <div class="card">
      <div class="item" @click="handleModifyPassword">
        <span class="label">修改密码</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div>
      <div class="item" @click="handleModifyPhone">
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


      <!-- <div class="item" @click="handleDeleteAccount">
        <span class="label">注销账号</span>
        <img class="arrow" src="@/assets/images/common/icon_arrows_gray@2x.png" mode="aspectFill" />
      </div> -->
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import NavBar from "@/components/CustomNavBar/index.vue";
import { Logout } from "@/api/mine";
import TipModal from "@/components/TipModal/index.vue";


const router = useRouter();
const logoutVisible = ref(false)

const logoutType = ref(1)
// 事件处理函数
const handleModifyPassword = () => {
  router.push('/modifyPwd');
};

const handleModifyPhone = () => {
  router.push('/modifyPhone');
};

// const handleOpenPrivacy = () => {
//   router.push('/privacy');
// };

// const handleOpenInfoList = () => {
//   router.push('/infoSheet');
// };

// const handleOpenSDKList = () => {
//   router.push('/sdkSheet');
// };

// // 注销账号
// const handleDeleteAccount = () => {
//   logoutType.value = 1
//   logoutVisible.value = true
// }

// 退出登录
const handleLogout = () => {
  logoutType.value = 2
  logoutVisible.value = true
};
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
  border-radius: 8px;
  margin: 15px;
  overflow: hidden;

}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 16px;
    color: #222222;
  }

  // .value {
  //   font-size: 30px;
  //   color: #999;
  // }

  .arrow {
    width: 16px;
    height: 16px;
  }
}

.logout-btn {
  background-color: #fff;
  border-radius: 8px;
  text-align: center;
  padding: 10px;
  margin: 15px;
  margin-top: 40px;

  font-family: PingFangSC, PingFang SC;
  font-weight: 500;
  font-size: 18px;
  color: #222222;
}
</style>