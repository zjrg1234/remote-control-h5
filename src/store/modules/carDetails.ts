import { defineStore } from "pinia";
import router from "@/router"; // 1. 直接导入路由实例，避免在 actions 中动态 import 带来的性能开销

// 2. 定义 State 接口，规范数据类型
export interface CarDetailsState {
  id: string;
 
  direction_dynamics: Record<string, any>; //方向力度
  accelerator_dynamics: Record<string, any>; // /油门力度
  direction_center: Record<string, any>; //方向中位
  accelerator_center: Record<string, any>; //油门中位
  ch1: Record<string, any>;
  close_value: Record<string, any>;
  center_value: Record<string, any>;

  vehicle_type: string;

  reverse_left_right: number; //方向 - 反向操作是否开启 0否1是
  reverse_up_down: number; //进退 - 反向操作是否开启 0否1是
  reverse_rotation: number; // 旋转 - 反向操作是否开启 0否1是
  change_ui_control: number; //是否修改控制UI状态 0否1是
}

export const useUserStore = defineStore("carDetails", {
  state: (): CarDetailsState => ({
    id: "",
    direction_dynamics: {}, //方向力度
    accelerator_dynamics: {}, // /油门力度
    direction_center: {}, //方向中位
    accelerator_center: {}, //油门中位
    ch1: {},
    close_value: {},
    center_value: {},
    vehicle_type: "1",
    reverse_left_right: 0, //方向 - 反向操作是否开启 0否1是
    reverse_up_down: 0, //进退 - 反向操作是否开启 0否1是
    reverse_rotation: 0, // 旋转 - 反向操作是否开启 0否1是
    change_ui_control: 0,
  }),

  // 3. 开启持久化配置
  persist: {
    key: "user-store",
    storage: localStorage,
    paths: ["token", "id", "userInfo", "areaId"], // 仅持久化必要字段
  },

  getters: {
    // 4. 使用 getters 替代普通的 get 方法，支持响应式追踪
    getId: (state) => state.id,
  },

  actions: {
    // 登录保存信息
    setDirection_dynamics(data: Record<string, any>) {
      this.userInfo = data;
      this.id = data.id || "";
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
