import Axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosResponse,
  type AxiosRequestConfig
} from "axios";
import { ContentTypeEnum, ResultEnum } from "@/enums/requestEnum";
import NProgress from "../progress";
import { showFailToast } from "vant";
import "vant/es/toast/style";

// 默认 axios 实例请求配置
const configDefault = {
  headers: {
    "Content-Type": ContentTypeEnum.FORM_URLENCODED
  },
  timeout: 0,
  baseURL: import.meta.env.VITE_BASE_API,
  data: {}
};

class Http {
  private axiosInstance: AxiosInstance;
  private axiosConfigDefault: AxiosRequestConfig;

  constructor(config: AxiosRequestConfig) {
    this.axiosConfigDefault = config;
    this.axiosInstance = Axios.create(config);
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  // 请求拦截
  private httpInterceptorsRequest(): void {
    this.axiosInstance.interceptors.request.use(
      config => {
        NProgress.start();
        return config;
      },
      (error: AxiosError) => {
        NProgress.done();
        showFailToast(error.message);
        return Promise.reject(error);
      }
    );
  }

  // 响应拦截
  private httpInterceptorsResponse(): void {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        NProgress.done();
        const { code, msg } = response.data;
        
        if (code != undefined) {
          return response.data;
        } else {
          showFailToast(msg || "请求失败");
          return Promise.reject(response.data);
        }
      },
      (error: AxiosError) => {
        NProgress.done();
        let message = "";
        const status = error.response?.status;
        switch (status) {
          case 400:
            message = "请求错误";
            break;
          case 401:
            message = "未授权，请登录";
            break;
          case 403:
            message = "拒绝访问";
            break;
          case 404:
            message = `请求地址出错: ${error.response?.config?.url}`;
            break;
          case 408:
            message = "请求超时";
            break;
          case 500:
            message = "服务器内部错误";
            break;
          case 502:
            message = "网关错误";
            break;
          case 503:
            message = "服务不可用";
            break;
          case 504:
            message = "网关超时";
            break;
          default:
            message = "网络连接故障";
        }

        showFailToast(message);
        return Promise.reject(error);
      }
    );
  }

  // 通用请求方法
  public request<T>(config: AxiosRequestConfig): Promise<T> {
    const finalConfig = { ...this.axiosConfigDefault, ...config };
    return this.axiosInstance.request(finalConfig) as unknown as Promise<T>;
  }

  // GET 请求
  public get<T>(
    url: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: "GET", url, params });
  }

  // POST 请求
  public post<T>(
    url: string,
    data?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: "POST", url, data });
  }

  // PUT 请求
  public put<T>(
    url: string,
    data?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: "PUT", url, data });
  }

  // DELETE 请求
  public delete<T>(
    url: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: "DELETE", url, params });
  }

  // 上传文件
  public upload<T>(
    url: string,
    data: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    return this.request<T>({
      ...config,
      method: "POST",
      url,
      data: formData,
      headers: {
        "Content-Type": ContentTypeEnum.FORM_DATA,
        ...config?.headers
      }
    });
  }
}

const http = new Http(configDefault);

// export const { get, post, put, delete: del, upload, request } = http;

export const get = http.get.bind(http);
export const post = http.post.bind(http);
export const put = http.put.bind(http);
export const del = http.delete.bind(http); // 注意：delete 是保留字，导出时命名为 del
export const upload = http.upload.bind(http);
export const request = http.request.bind(http);

export default http;