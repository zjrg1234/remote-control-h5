<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>高级摇杆：零延迟修复版</title>
    <style>
        body {
            margin: 0; padding: 0; height: 100vh; width: 100vw;
            background-color: #eef2f6; overflow: hidden;
            touch-action: none; font-family: sans-serif;
            /* 模拟背景图以便看清半透明效果 */
            background-image: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }

        /* --- 盒子容器 (底座) --- */
        .control-box {
            position: fixed;
            top: 0; left: 0; /* 关键：重置为左上角，完全由JS控制位置 */
            width: 240px; height: 100px; /* 宽大于高，适应左右布局 */
            display: flex; flex-direction: row; /* 横向排列 */
            align-items: center; justify-content: space-between;
            padding: 0 20px; box-sizing: border-box; z-index: 100;
            /* 移除 transition，完全由 JS 控制以实现零延迟 */
            will-change: transform;
        }

        /* --- 箭头样式 --- */
        .arrow {
            width: 0; height: 0;
            border-top: 25px solid transparent; border-bottom: 25px solid transparent;
            opacity: 0.4; transition: all 0.2s ease;
        }
        .arrow.left { border-right: 35px solid #ffb74d; }
        .arrow.right { border-left: 35px solid #ffb74d; }

        .arrow.active {
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(255, 167, 38, 0.8));
            transform: scale(1.15);
        }

        /* --- 中心圆点 (摇杆头) --- */
        .dot {
            width: 50px; height: 50px;
            background: radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0);
            border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            cursor: grab; position: relative; z-index: 2;
            /* 仅保留过渡属性用于回弹，移动时会被JS覆盖 */
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                        background 0.3s ease, box-shadow 0.3s ease;
        }
        .dot:active { cursor: grabbing; }

        /* 待命模式视觉反馈 */
        .dot.ready {
            background: radial-gradient(circle at 30% 30%, #fff, #ffcc80);
            box-shadow: 0 0 15px rgba(255, 167, 38, 0.6);
        }

        .hint {
            position: absolute; bottom: 20px; width: 100%;
            text-align: center; color: #666; font-size: 14px; pointer-events: none;
        }
    </style>
</head>
<body>

    <div class="control-box" id="box">
        <div class="arrow left" id="arrowLeft"></div>
        <div class="dot" id="dot"></div>
        <div class="arrow right" id="arrowRight"></div>
    </div>

    <div class="hint">按住自由拖动位置<br>静止2秒后，左右拉动圆点触发指令</div>

    <script>
        const box = document.getElementById('box');
        const dot = document.getElementById('dot');
        const arrowLeft = document.getElementById('arrowLeft');
        const arrowRight = document.getElementById('arrowRight');

        // 配置参数
        const IDLE_DELAY = 500;       // 静止 2s 进入待命
        const SWIPE_THRESHOLD = 20;    // 触发箭头高亮的阈值 (px)
        const MAX_DOT_DRAG = 40;       // 待命模式下，圆点最大可拉动距离 (px)

        // 状态变量
        let isDragging = false;
        let isReadyMode = false;
        let idleTimer = null;

        // 核心坐标变量
        let currentBoxX = window.innerWidth / 2 - 120; // 初始居中 (宽度的一半)
        let currentBoxY = window.innerHeight / 2 - 50; // 初始居中 (高度的一半)

        // 【核心修复】记录按下时，手指相对于盒子左上角的偏移量
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        // 待命模式下的基准点
        let readyStartPointerX = 0;

        // 初始化位置
        updateBoxPosition(currentBoxX, currentBoxY);

        // --- 1. 开始拖拽 ---
        function handleStart(e) {
            if(e.cancelable) e.preventDefault();
            isDragging = true;
            isReadyMode = false;
            clearTimeout(idleTimer);

            // 立即禁用过渡，防止回弹动画干扰
            dot.style.transition = 'none';
            dot.classList.remove('ready');
            resetArrows();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // 【核心修复】计算偏移量 = 手指坐标 - 盒子当前坐标
            // 这样无论点在哪里，盒子都会瞬间跳到手指下对应的相对位置
            dragOffsetX = clientX - currentBoxX;
            dragOffsetY = clientY - currentBoxY;

            // 立即应用一次位置，消除首帧延迟
            updateBoxPosition(clientX - dragOffsetX, clientY - dragOffsetY);

            resetIdleTimer();
        }

        // --- 2. 拖拽移动中 ---
        function handleMove(e) {
            if (!isDragging) return;
            if(e.cancelable) e.preventDefault();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            resetIdleTimer();

            if (!isReadyMode) {
                // 【模式 A：自由拖动 - 整个盒子跟随手指】
                let newX = clientX - dragOffsetX;
                let newY = clientY - dragOffsetY;

                // 边界限制 (防止拖出屏幕)
                const maxX = window.innerWidth - 240; // 盒子宽度
                const maxY = window.innerHeight - 100; // 盒子高度

                newX = Math.max(0, Math.min(maxX, newX));
                newY = Math.max(0, Math.min(maxY, newY));

                // 更新全局坐标并应用
                currentBoxX = newX;
                currentBoxY = newY;
                updateBoxPosition(newX, newY);

            } else {
                // 【模式 B：待命模式 - 盒子不动，仅圆点左右滑动】
                let deltaX = clientX - readyStartPointerX;

                // 橡皮筋阻尼效果
                const absDelta = Math.abs(deltaX);
                if (absDelta > MAX_DOT_DRAG) {
                    const excess = absDelta - MAX_DOT_DRAG;
                    const sign = deltaX > 0 ? 1 : -1;
                    deltaX = sign * (MAX_DOT_DRAG + excess * 0.2);
                }

                // 移动圆点 (组合 scale 效果)
                dot.style.transform = `translateX(${deltaX}px) scale(1.15)`;
                updateArrows(deltaX);
            }
        }

        // --- 3. 结束拖拽 ---
        function handleEnd() {
            if (!isDragging) return;
            isDragging = false;
            isReadyMode = false;
            clearTimeout(idleTimer);

            dot.classList.remove('ready');
            resetArrows();

            // 恢复过渡动画，让圆点平滑归位
            dot.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease, box-shadow 0.3s ease';
            dot.style.transform = `translateX(0px) scale(1)`;

            // 可选：松手后是否让盒子回到屏幕中心？
            // 如果不需要自动回中，注释掉下面两行即可保持最后的位置
            // currentBoxX = window.innerWidth / 2 - 120;
            // currentBoxY = window.innerHeight / 2 - 50;
            // updateBoxPosition(currentBoxX, currentBoxY);
        }

        // --- 核心辅助函数 ---
        function updateBoxPosition(x, y) {
            // 直接使用 translate3d 开启硬件加速，且不使用 calc
            box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }

        function resetIdleTimer() {
            clearTimeout(idleTimer);
            if (!isReadyMode) {
                idleTimer = setTimeout(enterReadyMode, IDLE_DELAY);
            }
        }

        function enterReadyMode() {
            isReadyMode = true;
            // 锁定当前的 X 坐标作为基准
            // 注意：这里需要获取当前实时的触摸位置，或者简单地认为就是盒子中心+圆点半径
            // 为了简单稳健，我们取盒子当前位置 + 盒子一半宽度 (即圆点中心)
            readyStartPointerX = currentBoxX + 120; // 120是盒子宽度的一半

            dot.classList.add('ready');
            if (navigator.vibrate) navigator.vibrate(50);
        }

        function updateArrows(deltaX) {
            arrowLeft.classList.remove('active');
            arrowRight.classList.remove('active');
            if (deltaX < -SWIPE_THRESHOLD) arrowLeft.classList.add('active');
            else if (deltaX > SWIPE_THRESHOLD) arrowRight.classList.add('active');
        }

        function resetArrows() {
            arrowLeft.classList.remove('active');
            arrowRight.classList.remove('active');
        }

        // 绑定事件 (支持鼠标和触摸)
        dot.addEventListener('mousedown', handleStart);
        dot.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);




        /**
 * 模拟遥控车通道控制逻辑
 * 对应 Swift: handleTwoDirectionControlChannel
 */
class CarControlHandler {
  constructor() {
    // 模拟状态变量
    this.channelS1 = 1500; // 方向通道 (默认中位)
    this.channelS2 = 1500; // 油门通道 (默认中位)
    this.isOpenConstantSpeedFalg = false; // 定速巡航开关状态
  }

  /**
   * 处理双摇杆控制通道值
   * @param {boolean} isUpDown - true: 处理油门(左摇杆), false: 处理方向(右摇杆)
   * @param {string} positionType - 操作类型: 'endType'(结束), 'upType'/'leftType'(上/左), 'downType'/'rightType'(下/右)
   * @param {number} ratioValue - 摇杆偏移比例 (0.0 ~ 1.0)
   * @param {Object} config - 配置参数对象 (模拟 Swift 中的 ViewModel 数据)
   */
  handleTwoDirectionControlChannel(isUpDown, positionType, ratioValue, config) {
    // 1. 获取基础配置 (最大值、中位值、最小值)
    // 对应 Swift: getCenterTrimmingVMViewModel(index: ...)
    const throttleConfig = config.throttle || { max: 2000, center: 1500, min: 1000, dynamics: 1.0, dynamicsMax: 1.0 };
    const steeringConfig = config.steering || { max: 2000, center: 1500, min: 1000, dynamics: 1.0, dynamicsMax: 1.0 };
    
    let maxValue = 0.0;
    let centerValue = 0.0;
    let minValue = 0.0;
    let rateValue = 0.0; // 力度比例

    if (isUpDown) {
      // ================= 处理油门 (左摇杆) =================
      // 对应 Swift: leftControlView 逻辑
      
      // 模拟定速巡航关闭逻辑
      if (this.isOpenConstantSpeedFalg) {
        this.isOpenConstantSpeedFalg = false;
        this.channelS2 = centerValue; // 假设关闭时回到中位
        console.log("定速巡航已关闭");
      }

      maxValue = throttleConfig.max;
      centerValue = throttleConfig.center;
      minValue = throttleConfig.min;
      
      // 计算油门力度比例
      rateValue = throttleConfig.dynamics / throttleConfig.dynamicsMax;

      if (positionType === 'endType') {
        // 摇杆回中
        this.channelS2 = Math.floor(centerValue);
      } else {
        // 计算油门输出值
        // 注意：Swift 代码中有 reverseUpDownState 逻辑，这里通过 positionType 区分
        if (positionType === 'upType') {
          // 推油门 (正向)
          // 公式: center + (max - center) * 力度 * 比例
          this.channelS2 = Math.floor(centerValue + (maxValue - centerValue) * rateValue * ratioValue);
          
          // 边界限制
          if (this.channelS2 < centerValue) this.channelS2 = centerValue;
          if (this.channelS2 > maxValue) this.channelS2 = maxValue;
          
        } else {
          // 拉刹车/倒车 (反向)
          // 公式: center - (center - min) * 力度 * 比例
          this.channelS2 = Math.floor(centerValue - (centerValue - minValue) * rateValue * ratioValue);
          
          // 边界限制
          if (this.channelS2 < minValue) this.channelS2 = minValue;
          if (this.channelS2 > centerValue) this.channelS2 = centerValue;
        }
      }

    } else {
      // ================= 处理方向 (右摇杆) =================
      // 对应 Swift: rightTwoControlView 逻辑
      
      maxValue = steeringConfig.max;
      centerValue = steeringConfig.center;
      minValue = steeringConfig.min;
      
      // 计算方向力度比例
      rateValue = steeringConfig.dynamics / steeringConfig.dynamicsMax;

      if (positionType === 'endType') {
        // 摇杆回中
        this.channelS1 = Math.floor(centerValue);
      } else {
        // 计算方向输出值
        if (positionType === 'leftType') {
          // 向左打方向
          this.channelS1 = Math.floor(centerValue + (maxValue - centerValue) * rateValue * ratioValue);
          
          // 边界限制
          if (this.channelS1 < centerValue) this.channelS1 = centerValue;
          if (this.channelS1 > maxValue) this.channelS1 = maxValue;
          
        } else {
          // 向右打方向
          this.channelS1 = Math.floor(centerValue - (centerValue - minValue) * rateValue * ratioValue);
          
          // 边界限制
          if (this.channelS1 < minValue) this.channelS1 = minValue;
          if (this.channelS1 > centerValue) this.channelS1 = centerValue;
        }
      }
      
      // 全局安全限制 (对应 Swift 代码末尾的硬编码限制)
      if (this.channelS1 < 1) this.channelS1 = 1;
      if (this.channelS1 > 2000) this.channelS1 = 2000;
    }

    // 返回当前计算出的通道值，用于发送蓝牙/WiFi 指令
    return {
      throttle: this.channelS2,
      steering: this.channelS1
    };
  }
}

// --- 使用示例 ---

const controller = new CarControlHandler();

// 模拟配置数据 (通常从服务器或本地存储获取)
const carConfig = {
  throttle: { max: 2000, center: 1500, min: 1000, dynamics: 1.0, dynamicsMax: 1.0 },
  steering: { max: 2000, center: 1500, min: 1000, dynamics: 1.0, dynamicsMax: 1.0 }
};

// 1. 模拟推油门到 50% (ratioValue = 0.5)
console.log("推油门 50%:", controller.handleTwoDirectionControlChannel(true, 'upType', 0.5, carConfig));
// 预期输出: throttle 约 1750

// 2. 模拟回中
console.log("摇杆回中:", controller.handleTwoDirectionControlChannel(true, 'endType', 0, carConfig));
// 预期输出: throttle 1500

// 3. 模拟向左打方向到 100%
console.log("向左打死:", controller.handleTwoDirectionControlChannel(false, 'leftType', 1.0, carConfig));
// 预期输出: steering 2000
    </script>
</body>
</html>



