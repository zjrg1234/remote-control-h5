/** WebRTC 客户端配置选项 */
export interface WebRTCClientOptions {
  /** ICE 服务器配置 (STUN/TURN) */
  iceServers?: RTCIceServer[];
  /** 是否只接收音视频流 (单向播放) */
  recvOnly?: boolean;
}

export class WebRTCClient {
  public pc: RTCPeerConnection | null = null;
  public options: WebRTCClientOptions;
  public videoElement: HTMLVideoElement | null = null;

  // 信令交互回调
  public onSignal: ((signal: any) => void) | null = null;

  constructor(options: WebRTCClientOptions = {}) {
    this.options = options;
  }

  /**
   * 初始化 PeerConnection 并绑定视频标签
   */
  public init(videoElement?: HTMLVideoElement): void {
    if (this.pc) return;

    this.videoElement = videoElement || null;

    // 创建 RTCPeerConnection
    this.pc = new RTCPeerConnection({
      iceServers: this.options.iceServers || [
        { urls: 'xbbzf.zksjyk.cn:8899' } // 默认使用公共 STUN 服务器
      ]
    });

    // 监听远端媒体流
    this.pc.ontrack = (event: RTCTrackEvent) => {
      console.log('[WebRTC] 收到远端媒体流');
      if (this.videoElement && event.streams && event.streams[0]) {
        this.videoElement.srcObject = event.streams[0];
      }
    };

    // 监听 ICE 候选者，通过信令发送给对端
    this.pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        this.sendSignal({ 
          type: 'candidate', 
          candidate: event.candidate 
        });
      }
    };

    // 监听连接状态变化
    this.pc.onconnectionstatechange = () => {
      console.log('[WebRTC] 连接状态:', this.pc?.connectionState);
    };
  }

  /**
   * 发起连接 (发送 Offer)
   */
  public async startCall(): Promise<void> {
    if (!this.pc) throw new Error('请先调用 init() 初始化');

    try {
      // 如果是单向拉流，添加只接收的 Transceiver
      if (this.options.recvOnly) {
        this.pc.addTransceiver('video', { direction: 'recvonly' });
        this.pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 将 Offer 发送给信令服务器
      this.sendSignal({ 
        type: 'offer', 
        sdp: this.pc.localDescription 
      });
    } catch (err) {
      console.error('[WebRTC] 发起连接失败:', err);
    }
  }

  /**
   * 处理从信令服务器收到的消息
   */
  public async handleSignal(signal: any): Promise<void> {
    if (!this.pc) return;

    switch (signal.type) {
      case 'offer':
        await this.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.sendSignal({ type: 'answer', sdp: this.pc.localDescription });
        break;

      case 'answer':
        await this.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        break;

      case 'candidate':
        if (signal.candidate) {
          await this.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
        break;
    }
  }

  /**
   * 销毁连接并释放资源
   */
  public destroy(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.onSignal = null;
    console.log('[WebRTC] 连接已销毁');
  }

  /**
   * 内部发送信令方法
   */
  private sendSignal(signal: any): void {
    this.onSignal?.(signal);
  }
}