import { defineStore } from "pinia";
import router from "@/router"; // 1. 直接导入路由实例，避免在 actions 中动态 import 带来的性能开销

// 2. 定义 State 接口，规范数据类型
export interface UserState {
  token: string;
  id: string;
  userInfo: Record<string, any>; // 避免使用空对象 {}，使用 Record 更严谨
  areaId: string;
  balance: any;
  energy: any;
  headShot: string;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: "",
    id: "",
    userInfo: {},
    areaId: "",
    balance: "",
    energy: "",
    headShot: "",
  }),

  // 3. 开启持久化配置
  persist: {
    key: "user-store",
    storage: localStorage,
    pick: [
      "token",
      "id",
      "userInfo",
      "areaId",
      "balance",
      "energy",
      "headShot",
    ], // 仅持久化必要字段
  },

  getters: {
    // 4. 使用 getters 替代普通的 get 方法，支持响应式追踪
    getLoginId: (state) => state.id,
    getToken: (state) => state.token,
  },

  actions: {
    // 登录保存信息
    setUser(data: Record<string, any>) {
      this.userInfo = data;
      this.id = data.id || "";

      this.userInfo = data;
      this.id = data.id;
      localStorage.setItem("id", data.id);
      this.headShot = data.head_shot;
      this.balance = data.wallet.balance || 0;
      this.energy = data.wallet.energy || 0;
      if (data.id == 38) {
        this.balance = 0;
        this.energy = 0;
        data.username = "";
        data.show_id = "";
      }

      localStorage.setItem("userInfo", JSON.stringify(data));
      localStorage.setItem("headShot", this.headShot);
      localStorage.setItem("balance", this.balance);
      localStorage.setItem("energy", this.energy);
    },

    setToken(token: string) {
      this.token = token;
    },

    setAreaId(areaId: string) {
      this.areaId = areaId;
    },

    setId(id: string) {
      this.id = id;
    },

    getUserInfo() {
      return this.userInfo;
    },

    // 退出登录
    logout() {
      // 1. 重置 Pinia 状态（注意：$reset 仅在 Option Store 中可用）
      this.$reset();

      // 2. 清除本地存储（兜底清理）
      localStorage.clear();

      // 3. 路由跳转优化：防止在登录页重复触发导致死循环或报错
      if (router.currentRoute.value.path !== "/login") {
        router.replace("/login"); // 使用 replace 而不是 push，避免用户点击浏览器后退按钮又回到已注销的页面
      }
    },
  },
});
