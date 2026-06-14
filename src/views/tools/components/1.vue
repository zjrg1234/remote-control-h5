<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>高级摇杆：完美修复版</title>
    <style>
        body {
            margin: 0; padding: 0; height: 100vh;
            background-color: #eef2f6; overflow: hidden;
            touch-action: none; font-family: sans-serif;
        }

        /* --- 盒子容器 (底座) --- */
        .control-box {
            position: fixed; top: 50%; left: 50%;
            width: 100px; height: 240px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: space-between;
            padding: 20px 0; box-sizing: border-box; z-index: 100;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .control-box.dragging { transition: none; }

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
            /* 仅保留过渡属性，不设置默认 transform */
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                        background 0.3s ease, box-shadow 0.3s ease;
        }
        .dot:active { cursor: grabbing; }

        /* 待命模式视觉反馈：仅改变颜色和阴影，绝不使用 transform */
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

        // 盒子绝对位置
        let boxX = 0, boxY = 0;
        // 按下时的初始状态 (用于自由拖动)
        let startPointerX = 0, startPointerY = 0;
        let startBoxX = 0, startBoxY = 0;
        
        // 【核心修复】实时记录指针 Y 轴坐标，用于进入待命模式时的基准捕获
        let lastPointerY = 0;
        let readyStartPointerY = 0;

        // --- 1. 开始拖拽 ---
        function handleStart(e) {
            if(e.cancelable) e.preventDefault();
            isDragging = true;
            isReadyMode = false;
            clearTimeout(idleTimer);

            box.classList.add('dragging');
            dot.classList.remove('ready');
            dot.style.transition = 'none'; 
            resetArrows();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startPointerX = clientX; startPointerY = clientY;
            lastPointerY = clientY; // 初始化记录
            startBoxX = boxX; startBoxY = boxY;
            resetIdleTimer();
        }

        // --- 2. 拖拽移动中 ---
        function handleMove(e) {
            if (!isDragging) return;
            if(e.cancelable) e.preventDefault();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // 【核心修复】实时更新 lastPointerY
            lastPointerY = clientY;
            resetIdleTimer(); 

            if (!isReadyMode) {
                // 【模式 A：自由拖动】
                boxX = startBoxX + (clientX - startPointerX);
                boxY = startBoxY + (clientY - startPointerY);
                
                const maxX = window.innerWidth / 2 - 50;
                const maxY = window.innerHeight / 2 - 120;
                boxX = Math.max(-maxX, Math.min(maxX, boxX));
                boxY = Math.max(-maxY, Math.min(maxY, boxY));

                box.style.transform = `translate(calc(-50% + ${boxX}px), calc(-50% + ${boxY}px))`;
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

            box.classList.remove('dragging');
            dot.classList.remove('ready');
            resetArrows();

            dot.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease, box-shadow 0.3s ease';
            dot.style.transform = `translateY(0px) scale(1)`;

            boxX = 0; boxY = 0;
            box.style.transform = `translate(-50%, -50%)`;
        }

        // --- 核心辅助函数 ---
        function resetIdleTimer() {
            clearTimeout(idleTimer);
            if (!isReadyMode) {
                idleTimer = setTimeout(enterReadyMode, IDLE_DELAY);
            }
        }

        function enterReadyMode() {
            isReadyMode = true;
            // 【核心修复】在进入待命模式时，将当前手指的 Y 坐标锁定为新的滑动基准
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

        // 绑定事件
        dot.addEventListener('mousedown', handleStart);
        dot.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
    </script>
</body>
</html>