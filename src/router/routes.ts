import Layout from "@/layout/index.vue";
import type { RouteRecordRaw } from "vue-router";
import Home from "@/views/index/index.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "root",
    component: Layout,
    redirect: { name: "Home" },
    children: [
      {
        path: "index",
        name: "Home",
        component: Home,
        meta: {
          title: "首页",
          noAuth: true
        }
      },
      {
        path: "tools",
        name: "Tools",
        component: () => import("@/views/tools/index.vue"),
        meta: {
          title: "工具",
          hiddenNavBar: true,
          noAuth: true
        }
      },
      {
        path: "mine",
        name: "Mine",
        component: () => import("@/views/mine/index.vue"),
        meta: {
          title: "我的",
          noCache: true,
          noAuth: true
        }
      },
      {
        path: "login",
        name: "Login",
        component: () => import("@/views/login/login.vue"),
        meta: {
          title: "登录",
          noCache: true,
          noAuth: true
        }
      }
    ]
  }
];

export default routes;
