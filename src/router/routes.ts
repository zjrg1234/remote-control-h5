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
          noAuth: true,

          hiddenNavBar: false,
        },
      },
      {
        path: "tools",
        name: "Tools",
        component: () => import("@/views/tools/index.vue"),
        meta: {
          title: "工具",

          noAuth: true,
        },
      },
      {
        path: "mine",
        name: "Mine",
        component: () => import("@/views/mine/index.vue"),
        meta: {
          title: "我的",
          noCache: true,
          noAuth: true,
          hiddenNavBar: false,
        },
      },
      {
        path: "login",
        name: "Login",
        component: () => import("@/views/login/login.vue"),
        meta: {
          title: "登录",
          noCache: true,

          noAuth: true,
        },
      },
      {
        path: "forgetPwd",
        name: "ForgetPwd",
        component: () => import("@/views/login/forgetPwd.vue"),
        meta: {
          title: "忘记密码",
          noCache: true,
          noAuth: true,
        },
      },
      {
        path: "loginCode",
        name: "LoginCode",
        component: () => import("@/views/login/loginCode.vue"),
        meta: {
          title: "验证码登录",
          noCache: true,
          noAuth: true,
        },
      },{
        path: "register",
        name: "Register",
        component: () => import("@/views/register/index.vue"),
        meta: {
          title: "注册",
          noCache: true,
          noAuth: true,
        },
      },
      {
        path: "changeArea",
        name: "ChangeArea",
        component: () => import("@/views/mine/changeArea.vue"),
        meta: {
          title: "变更专区",
          noCache: true,
          noAuth: true,
        },
      },
    ],
  },
];

export default routes;
