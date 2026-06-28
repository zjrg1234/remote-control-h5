/**
 * WebSocket 客户端配置选项接口
 */
interface WebSocketClientOptions {
  maxReconnectCount?: number;
  reconnectInterval?: number;
  heartBeatInterval?: number;
}

class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isManualClose: boolean = false;
  private reconnectTimer: number | null = null;
  private heartBeatTimer: number | null = null;
  private reconnectCount: number = 0;

  // 心跳存活状态标志
  private isAlive: boolean = false;

  private maxReconnectCount: number;
  private reconnectInterval: number;
  private heartBeatInterval: number;

  private messageQueue: (string | object)[] = [];

  private onMessageCallback: ((data: string) => void) | null = null;
  private onOpenCallback: ((event: Event) => void) | null = null;
  private onCloseCallback: ((event: CloseEvent) => void) | null = null;
  private onErrorCallback: ((event: Event) => void) | null = null;

  constructor(url: string, options?: WebSocketClientOptions) {
    this.url = WebSocketClient.formatUrl(url);
    this.maxReconnectCount = options?.maxReconnectCount ?? 10;
    this.reconnectInterval = options?.reconnectInterval ?? 3000;
    this.heartBeatInterval = options?.heartBeatInterval ?? 30000;
  }

  /**
   * 静态方法：格式化 URL，避免实例化即可调用
   */
  static formatUrl(url: string): string {
    if (!url) return url;
    const hasPort = /:\d+(?=[/\s]|$)/.test(url);
    if (hasPort) {
      return url;
    }
    if (url.startsWith("wss://")) {
      return `wss://${url.replace("wss://", "")}`;
    } else if (url.startsWith("ws://")) {
      return `ws://${url.replace("ws://", "")}`;
    }
    // 默认情况：补全 ws 协议并拼接端口
    return `ws://${url}`;
  }

  public connect(): void {
    if (this.isConnected) {
      console.log("[WebSocket] 已连接，无需重复连接");
      return;
    }

    console.log(`[WebSocket] 正在连接: ${this.url}`);
    this.isManualClose = false;
    this.isAlive = true;

    try {
      this.ws = new WebSocket(this.url);
      this._bindEvents();
    } catch (err) {
      console.error("[WebSocket] 连接请求异常:", err);
      this._handleError(err as Event);
    }
  }

  private _bindEvents(): void {
    if (!this.ws) return;

    this.ws.onopen = (event: Event) => {
      console.log("[WebSocket] 连接已打开", event);
      this.isConnected = true;
      this.reconnectCount = 0;
      this.isAlive = true;

      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      this._startHeartBeat();
      this._flushMessageQueue();
      this.onOpenCallback?.(event);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      console.log("[WebSocket] 收到消息:", event.data);

      // 收到任何消息都视为连接存活
      this.isAlive = true;

      this.onMessageCallback?.(event.data);
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log("[WebSocket] 连接已关闭", event);
      this.isConnected = false;
      this._stopHeartBeat();
      this.onCloseCallback?.(event);

      if (!this.isManualClose) {
        this._reconnect();
      }
    };

    this.ws.onerror = (event: Event) => {
      console.error("[WebSocket] 连接错误:", event);
      this._handleError(event);
    };
  }

  public send(data: string | object): void {
    // 连接未建立或 WebSocket 未就绪时，消息加入队列
    if (
      !this.isConnected ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.warn("[WebSocket] 连接未建立，消息已加入队列");
      this.messageQueue.push(data);
      return;
    }

    const message = typeof data === "object" ? JSON.stringify(data) : data;

    try {
      this.ws.send(message);
      console.log("[WebSocket] 消息发送成功:", message);
    } catch (err) {
      console.error("[WebSocket] 消息发送失败:", err);
      this.messageQueue.unshift(data);
    }
  }

  /**
   * 内部直接发送方法，绕过队列拦截，防止刷新队列时死循环
   */
  private _rawSend(data: string | object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === "object" ? JSON.stringify(data) : data;
      try {
        this.ws.send(message);
      } catch (err) {
        console.error("[WebSocket] 队列消息发送失败:", err);
      }
    }
  }

  private _flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(
      `[WebSocket] 正在发送队列中的 ${this.messageQueue.length} 条消息`,
    );
    const queueCopy = [...this.messageQueue];
    this.messageQueue = [];
    queueCopy.forEach((data) => this._rawSend(data));
  }

  private _startHeartBeat(): void {
    this._stopHeartBeat();

    this.heartBeatTimer = window.setInterval(() => {
      // 如果上一次心跳没有收到响应，主动断开连接触发重连
      if (!this.isAlive) {
        console.warn("[WebSocket] 心跳超时，主动断开连接");
        this.ws?.close();
        return;
      }

      // 标记为未存活，等待 onmessage 将其置为 true
      this.isAlive = false;
      this._rawSend({ type: "ping", timestamp: Date.now() });
    }, this.heartBeatInterval);

    console.log("[WebSocket] 心跳已启动");
  }

  private _stopHeartBeat(): void {
    if (this.heartBeatTimer !== null) {
      window.clearInterval(this.heartBeatTimer);
      this.heartBeatTimer = null;
      console.log("[WebSocket] 心跳已停止");
    }
  }

  private _reconnect(): void {
    if (this.reconnectCount >= this.maxReconnectCount) {
      console.error(
        `[WebSocket] 重连次数已达上限 (${this.maxReconnectCount})，停止重连`,
      );
      return;
    }

    this.reconnectCount++;
    const delay = this.reconnectInterval * this.reconnectCount;

    console.log(
      `[WebSocket] 第 ${this.reconnectCount} 次重连，${delay}ms 后尝试...`,
    );

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private _handleError(err: Event | unknown): void {
    this.onErrorCallback?.(err as Event);
    this.isConnected = false;
    this._stopHeartBeat();
    // 不在此处调用 _reconnect()，由 onclose 统一处理重连，避免双重触发
  }

  public close(): void {
    this.isManualClose = true;
    this._stopHeartBeat();

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log("[WebSocket] 连接已手动关闭");
    }
  }

  public onMessage(callback: (data: string) => void): void {
    this.onMessageCallback = callback;
  }

  public onOpen(callback: (event: Event) => void): void {
    this.onOpenCallback = callback;
  }

  public onClose(callback: (event: CloseEvent) => void): void {
    this.onCloseCallback = callback;
  }

  public onError(callback: (event: Event) => void): void {
    this.onErrorCallback = callback;
  }
}

// 修复单例模式：支持 URL 变更时重建实例
let wsInstance: WebSocketClient | null = null;
let currentWsUrl: string | null = null;

export function getWebSocket(
  url: string,
  options?: WebSocketClientOptions,
): WebSocketClient {
  // 使用静态方法获取格式化后的 URL，无需创建临时实例
  const formattedUrl = WebSocketClient.formatUrl(url);

  if (wsInstance && currentWsUrl === formattedUrl) {
    return wsInstance;
  }

  // URL 发生变化或首次创建，销毁旧实例
  if (wsInstance) {
    console.warn("[WebSocket] URL 发生变更，正在销毁旧实例...");
    wsInstance.close();
  }

  currentWsUrl = formattedUrl;
  wsInstance = new WebSocketClient(url, options);
  return wsInstance;
}

export default WebSocketClient;