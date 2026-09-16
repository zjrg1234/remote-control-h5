// src/composables/useInactivityAlarm.js
import { ref, onUnmounted } from 'vue';

/**
 * 无操作报警组合式函数（H5 专用）
 * @param {number} timeout - 无操作超时时间，单位毫秒，默认3分钟
 * @param {Function} onAlarm - 超时后触发的回调函数
 * @returns {Object} - 返回控制函数
 */
export function useInactivityAlarm(timeout = 180000, onAlarm) {
  const inactivityTimer = ref(null);
  const isListening = ref(false);

  // 记录上次活动时间，避免高频事件频繁重建定时器
  let lastActivity = Date.now();

  const clearTimer = () => {
    if (inactivityTimer.value) {
      clearTimeout(inactivityTimer.value);
      inactivityTimer.value = null;
    }
  };

  const resetTimer = () => {
    clearTimer();
    lastActivity = Date.now();
    inactivityTimer.value = setTimeout(() => {
      inactivityTimer.value = null;
      if (typeof onAlarm === 'function') {
        onAlarm();
      }
    }, timeout);
  };

  // 高频事件优化：只有距上次活动超过 1s 才真正重置
  const handleActivity = () => {
    const now = Date.now();
    if (now - lastActivity < 1000) return;
    resetTimer();
  };

  const events = [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'click',
    'wheel',
  ];

  const startListening = () => {
    if (isListening.value) return;
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, {
        passive: true,
        capture: true,
      });
    });
    isListening.value = true;
    resetTimer();
  };

  const stopListening = () => {
    if (!isListening.value) return;
    events.forEach((event) => {
      window.removeEventListener(event, handleActivity, { capture: true });
    });
    clearTimer();
    isListening.value = false;
  };

  // 手动触发报警（用于测试或特定场景）
  const triggerAlarm = () => {
    clearTimer();
    if (typeof onAlarm === 'function') {
      onAlarm();
    }
  };

  onUnmounted(() => {
    stopListening();
  });

  return {
    resetTimer,
    startListening,
    stopListening,
    triggerAlarm,
    isListening,
  };
}