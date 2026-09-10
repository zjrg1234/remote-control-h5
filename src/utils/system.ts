/**
 * H5 端导航栏高度工具
 * 说明：H5 没有状态栏、胶囊按钮、自定义标题按钮概念，
 *       因此 statusBarHeight 固定为 0，TitleBar 默认 40。
 */

export interface SystemInfo {
  statusBarHeight?: number;
  [key: string]: unknown;
}

export const SYSTEM_INFO: SystemInfo = {
  statusBarHeight: 0,
};

console.log(SYSTEM_INFO);

export const getStatusBarHeight = (): number => {
  return SYSTEM_INFO.statusBarHeight ?? 0;
};

export const getTitleBarHeight = (): number => {
  return 40;
};

export const getNavBarHeight = (): number => {
  return getStatusBarHeight() + getTitleBarHeight();
};

export const getLeftIconLeft = (): number => {
  return 0;
};

/* ---------------- throttle / debounce ---------------- */

export type AnyFunction = (...args: any[]) => any;

/**
 * 防抖函数 (Debounce)
 * @param func 需要执行的函数
 * @param delay 延迟时间(ms)，默认 300ms
 */
export function debounce<T extends AnyFunction>(
  func: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * 节流函数 (Throttle)
 * @param func 需要执行的函数
 * @param interval 间隔时间(ms)，默认 500ms
 */
export function throttle<T extends AnyFunction>(
  func: T,
  interval = 500
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      func(...args);
    }
  };
}