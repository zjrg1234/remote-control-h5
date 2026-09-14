// utils/notice.ts

const NOTICE_KEY = '__notice_session_flag__';
const SESSION_ID_KEY = '__uni_session_id__';

interface NoticeFlag {
  sessionId: string;
  timestamp: number;
}

/**
 * 获取当前会话标识
 * 使用 sessionStorage 保证在同一标签页会话中保持不变
 */
function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch (e) {
    // 如果 sessionStorage 不可用（如隐私模式），退化为内存变量
    const self = getSessionId as typeof getSessionId & { _memorySid?: string };
    if (!self._memorySid) {
      self._memorySid = Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    return self._memorySid;
  }
}

/**
 * 判断是否需要请求公告
 * @param isLoggedIn 是否已登录
 * @returns 是否需要请求
 */
export function shouldFetchNotice(isLoggedIn: boolean): boolean {
  if (!isLoggedIn) return false;

  try {
    const storedStr = localStorage.getItem(NOTICE_KEY);
    if (storedStr) {
      const stored: NoticeFlag = JSON.parse(storedStr);
      // 只有 sessionId 匹配才视为“本次会话已获取”
      if (stored && stored.sessionId === getSessionId()) {
        return false;
      }
    }
  } catch (e) {
    // storage 读取或解析异常，允许重试
  }

  // 标记为已获取（请求前标记，防并发）
  try {
    const flag: NoticeFlag = {
      sessionId: getSessionId(),
      timestamp: Date.now(),
    };
    localStorage.setItem(NOTICE_KEY, JSON.stringify(flag));
  } catch (e) {
    // 写入失败也允许请求，不阻塞
  }

  return true;
}

/**
 * 重置公告标记（退出登录时调用）
 */
export function resetNoticeFlag(): void {
  try {
    localStorage.removeItem(NOTICE_KEY);
  } catch (e) {
    // 忽略
  }
}