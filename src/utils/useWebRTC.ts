// useWebRTC.ts
import { ref, onUnmounted } from 'vue';
import { WebRTCClient } from './webrtc'; // 引入你的类

export function useWebRTC(options = {}) {
  const client = new WebRTCClient(options);
  const localStream = ref<MediaStream | null>(null);
  const remoteStream = ref<MediaStream | null>(null);
  const connectionState = ref<string>('new');

  // 初始化并绑定状态
  const init = (videoElement?: HTMLVideoElement) => {
    client.init(videoElement);
    
    // 监听远端流并转为响应式
    client.pc!.ontrack = (event) => {
      remoteStream.value = event.streams[0];
    };

    // 监听连接状态
    client.pc!.onconnectionstatechange = () => {
      connectionState.value = client.pc!.connectionState;
    };
  };

  // 获取本地摄像头/麦克风
  const startMedia = async () => {
    try {
      localStream.value = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.value.getTracks().forEach(track => client.pc!.addTrack(track, localStream.value!));
    } catch (err) {
      console.error('获取媒体设备失败:', err);
    }
  };

  // 组件销毁时自动清理资源（关键！）
  onUnmounted(() => {
    localStream.value?.getTracks().forEach(track => track.stop());
    client.destroy();
  });

  return {
    client,
    localStream,
    remoteStream,
    connectionState,
    init,
    startMedia,
    startCall: () => client.startCall(),
    handleSignal: (signal: any) => client.handleSignal(signal)
  };
}