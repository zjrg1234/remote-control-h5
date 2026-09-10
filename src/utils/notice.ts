// utils/notice.ts

const NOTICE_KEY = '__notice_session_flag__';
const SESSION_ID_KEY = '__uni_session_id__';

/** 存储的公告标记结构 */
interface NoticeRecord {
  sessionId: string;
  timestamp: number;
}

/** 生成一次会话的唯一标识 */
function genSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * 生成当前会话标识。
 * H5 端通过 sessionStorage 持久化到当前标签页，
 * 关闭标签页或新开标签页时会话标识变化。
 */
function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sid) {
    sid = genSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sid);
  }
  return sid;
}

/**
 * 是否需要拉取公告。
 * 同一会话内已拉取过则返回 false，否则标记后返回 true（请求前标记，防并发）。
 */
export function shouldFetchNotice(isLoggedIn: boolean): boolean {
  if (!isLoggedIn) return false;

  try {
    const raw = localStorage.getItem(NOTICE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as NoticeRecord;
      // 只有 sessionId 匹配才视为"本次会话已获取"
      if (stored.sessionId === getSessionId()) {
        return false;
      }
    }
  } catch (e) {
    // 读取/解析异常，允许重试
  }

  // 标记为已获取（请求前标记，防并发）
  const record: NoticeRecord = {
    sessionId: getSessionId(),
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(NOTICE_KEY, JSON.stringify(record));
  } catch (e) {
    // 写入异常不阻断流程
  }

  return true;
}

/** 退出登录时调用 */
export function resetNoticeFlag(): void {
  try {
    localStorage.removeItem(NOTICE_KEY);
  } catch (e) {
    // ignore
  }
}