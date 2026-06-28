import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized
} from "vue-router";
import routes from "./routes";
import { useCachedViewStoreHook } from "@/store/modules/cachedView";
// import NProgress from "@/utils/progress";
import setPageTitle from "@/utils/set-page-title";

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export interface toRouteType extends RouteLocationNormalized {
  meta: {
    title?: string;
    noCache?: boolean;
    noAuth?: boolean; // 新增白名单标识类型
  };
}

// 假设你有一个获取登录状态的方法，请根据实际情况替换
const isLoggedIn = () => !!localStorage.getItem('token'); 

router.beforeEach((to: toRouteType, from, next) => {
  // NProgress.start();
  
  // 1. 设置页面 title
  setPageTitle(to.meta.title);
  
  // 2. 白名单直接放行
  if (to.meta.noAuth) {
    return next();
  }
  
  // 3. 非白名单路由进行鉴权校验
  if (!isLoggedIn()) {
    // 未登录，跳转登录页并记录当前访问路径，方便登录后跳回
    return next(`/login`);
  }
  
  // 4. 已登录，处理路由缓存并放行
  useCachedViewStoreHook().addCachedView(to);
  next();
});

router.afterEach(() => {
  // NProgress.done();
});

export default router;