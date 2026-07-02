import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { useUserStore } from '@/store/modules/user';
import { useLoadingStore } from '@/store/modules/loading';

import router from "@/router";
// 1. 定义后端统一响应数据类型（根据实际后端接口调整）
interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 2. 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 0,
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
  },
});

// 3. 接口白名单：无需登录
const whiteList = ["/api/login/loginIn"];

// 4. 请求拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig & { loading?: boolean }) => {
    const userStore = useUserStore();
    const token = userStore.token;

    // 白名单判断
    const isWhite = whiteList.some((item) => config.url?.includes(item));
    if (!isWhite && !token) {
      routerOpera();
      return Promise.reject(new Error("未登录"));
    }

    console.log(config.headers)
    // 注入 Token
    if (token) {
      config.headers = {
        Authorization: `${token}`,
        ...config.headers,
      };
    }

    // 显示 loading（通过自定义配置控制）
    if (config.loading) {
      // 这里可以替换为你项目中使用的 UI 库的 Loading 方法
      // 例如: ElLoading.service({ text: '加载中...', lock: true })
      useLoadingStore().setLoading(true)
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 5. 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const config = response.config as any;
    if (config.loading) {
      // 这里可以替换为你项目中关闭 Loading 的方法
      // 例如: ElLoading.service().close()
      useLoadingStore().setLoading(false)
    }

    const res = response.data;
    if (res.code === 401) {
      // 处理登录过期
      // Message.error('登录已过期，请重新登录')
      const userStore = useUserStore();
      userStore.logout();
      return Promise.reject(new Error(res.msg));
    } else {
      // 直接返回业务数据
      return res as any;
    }
  },
  (error) => {
    // 网络异常或超时处理
    const config = error.config as any;
    if (!config?.loading) {
      // 关闭 Loading
    }
    
    useLoadingStore().setLoading(false)

    // Message.error('网络异常，请稍后重试')
    return Promise.reject(error);
  },
);

// 6. 获取全局公共参数
const getParam = (): Record<string, any> => {
  const userStore = useUserStore();
  return {
    uid: userStore.id,
    token: userStore.token,
  };
};

const routerOpera = () => {
  router.push("/login");
};

// 7. 导出快捷请求方法，支持泛型传递
export const get = <T = any>(
  url: string,
  data: Record<string, any> = {},
  opts: AxiosRequestConfig & { loading?: boolean } = {},
) =>
  service.get<T, ApiResponse<T>>(url, {
    params: { ...data, ...getParam() },
    ...opts,
  });

export const post = <T = any>(
  url: string,
  data: Record<string, any> = {},
  opts: AxiosRequestConfig & { loading?: boolean } = {},
) => service.post<T, ApiResponse<T>>(url, { ...data, ...getParam() }, opts);

export const put = <T = any>(
  url: string,
  data: Record<string, any> = {},
  opts: AxiosRequestConfig & { loading?: boolean } = {},
) => service.put<T, ApiResponse<T>>(url, { ...data, ...getParam() }, opts);

export const del = <T = any>(
  url: string,
  data: Record<string, any> = {},
  opts: AxiosRequestConfig & { loading?: boolean } = {},
) =>
  service.delete<T, ApiResponse<T>>(url, {
    params: { ...data, ...getParam() },
    ...opts,
  });
