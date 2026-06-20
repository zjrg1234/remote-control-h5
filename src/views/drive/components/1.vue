<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>高级摇杆：绝对零偏移修复版</title>
    <style>
        body {
            margin: 0; padding: 0; height: 100vh;
            background-color: #eef2f6; overflow: hidden;
            touch-action: none; font-family: sans-serif;
        }

        /* --- 盒子容器 (底座) --- */
        .control-box {
            position: fixed; 
            top: 0; left: 0; /* 【核心修复】重置为左上角，完全由JS控制绝对位置 */
            width: 100px; height: 240px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: space-between;
            padding: 20px 0; box-sizing: border-box; z-index: 100;
            /* 移除 CSS 中的 transition，完全交由 JS 控制 */
            will-change: transform;
        }

        /* --- 箭头样式 --- */
        .arrow {
            width: 0; height: 0;
            border-left: 25px solid transparent; border-right: 25px solid transparent;
            opacity: 0.4; transition: all 0.2s ease; z-index: 1;
        }
        .arrow.up { border-bottom: 35px solid #ffb74d; }
        .arrow.down { border-top: 35px solid #ffb74d; }
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
            /* 默认不带 transition，防止按下时发生回弹动画 */
            will-change: transform;
        }
        .dot:active { cursor: grabbing; }

        /* 待命模式视觉反馈 */
        .dot.ready {
            background: radial-gradient(circle at 30% 30%, #fff, #ffcc80);
            box-shadow: 0 0 15px rgba(255, 167, 38, 0.6);
        }

        .hint {
            position: absolute; bottom: 20px; width: 100%;
            text-align: center; color: #999; font-size: 12px;
        }
    </style>
</head>
<body>

    <div class="control-box" id="box">
        <div class="arrow up" id="arrowUp"></div>
        <div class="dot" id="dot"></div>
        <div class="arrow down" id="arrowDown"></div>
    </div>

    <div class="hint">按住自由拖动位置<br>静止2秒后，上下拉动圆点触发指令</div>

    <script>
        const box = document.getElementById('box');
        const dot = document.getElementById('dot');
        const arrowUp = document.getElementById('arrowUp');
        const arrowDown = document.getElementById('arrowDown');

        // 配置参数
        const IDLE_DELAY = 2000;       // 静止 2s 进入待命
        const SWIPE_THRESHOLD = 20;    // 触发箭头高亮的阈值 (px)
        const MAX_DOT_DRAG = 40;       // 待命模式下，圆点最大可拉动距离 (px)

        // 状态变量
        let isDragging = false;
        let isReadyMode = false;
        let idleTimer = null;

        // 【核心修复】记录盒子当前的绝对坐标
        let currentBoxX = window.innerWidth / 2 - 50;  // 初始居中 (宽度的一半)
        let currentBoxY = window.innerHeight / 2 - 120; // 初始居中 (高度的一半)

        // 【核心修复】记录按下时，手指相对于盒子左上角的偏移量
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        // 待命模式下的基准点
        let lastPointerY = 0;
        let readyStartPointerY = 0;

        // 初始化位置
        updateBoxPosition(currentBoxX, currentBoxY);

        // --- 1. 开始拖拽 ---
        function handleStart(e) {
            if(e.cancelable) e.preventDefault();
            isDragging = true;
            isReadyMode = false;
            clearTimeout(idleTimer);

            // 【核心修复】立即禁用过渡，并强制浏览器重绘，彻底消除首帧偏移
            dot.style.transition = 'none';
            dot.classList.remove('ready');
            resetArrows();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // 【核心修复】计算并锁定偏移量
            dragOffsetX = clientX - currentBoxX;
            dragOffsetY = clientY - currentBoxY;

            // 立即应用一次位置，消除任何可能的渲染延迟
            updateBoxPosition(clientX - dragOffsetX, clientY - dragOffsetY);

            lastPointerY = clientY;
            resetIdleTimer();
        }

        // --- 2. 拖拽移动中 ---
        function handleMove(e) {
            if (!isDragging) return;
            if(e.cancelable) e.preventDefault();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            lastPointerY = clientY;
            resetIdleTimer(); 

            if (!isReadyMode) {
                // 【模式 A：自由拖动】
                let newX = clientX - dragOffsetX;
                let newY = clientY - dragOffsetY;

                // 边界限制 (防止拖出屏幕)
                const maxX = window.innerWidth - 100;  // 盒子宽度
                const maxY = window.innerHeight - 240; // 盒子高度

                newX = Math.max(0, Math.min(maxX, newX));
                newY = Math.max(0, Math.min(maxY, newY));

                // 更新全局坐标并应用
                currentBoxX = newX;
                currentBoxY = newY;
                updateBoxPosition(newX, newY);

            } else {
                // 【模式 B：待命模式 - 圆点弹性滑动】
                let deltaY = clientY - readyStartPointerY;

                // 橡皮筋阻尼效果
                const absDelta = Math.abs(deltaY);
                if (absDelta > MAX_DOT_DRAG) {
                    const excess = absDelta - MAX_DOT_DRAG;
                    const sign = deltaY > 0 ? 1 : -1;
                    deltaY = sign * (MAX_DOT_DRAG + excess * 0.2);
                }

                // 移动圆点 (组合 scale 效果)
                dot.style.transform = `translateY(${deltaY}px) scale(1.15)`;
                updateArrows(deltaY);
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
            dot.style.transform = `translateY(0px) scale(1)`;

            // 可选：松手后是否让盒子回到屏幕中心？
            // 如果不需要自动回中，注释掉下面三行即可保持最后的位置
            // currentBoxX = window.innerWidth / 2 - 50;
            // currentBoxY = window.innerHeight / 2 - 120;
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
            // 在进入待命模式时，将当前手指的 Y 坐标锁定为新的滑动基准
            readyStartPointerY = lastPointerY;
            
            dot.classList.add('ready');
            if (navigator.vibrate) navigator.vibrate(50);
        }

        function updateArrows(deltaY) {
            arrowUp.classList.remove('active');
            arrowDown.classList.remove('active');
            if (deltaY < -SWIPE_THRESHOLD) arrowUp.classList.add('active');
            else if (deltaY > SWIPE_THRESHOLD) arrowDown.classList.add('active');
        }

        function resetArrows() {
            arrowUp.classList.remove('active');
            arrowDown.classList.remove('active');
        }

        // 绑定事件 (支持鼠标和触摸)
        dot.addEventListener('mousedown', handleStart);
        dot.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
    </script>
</body>
</html>

这个是上下摇杆