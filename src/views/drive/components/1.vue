<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>360度虚拟摇杆 (带上下左右箭头)</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background-color: #1a1a1a;
            height: 100vh;
            overflow: hidden;
            font-family: sans-serif;
            color: white;
        }

        /* 摇杆根容器：改为正方形以适应十字布局 */
        .control-box {
            position: fixed;
            left: 0;
            bottom: 0;
            width: 140px;
            height: 140px;
            display: grid;
            /* 三行三列网格布局，完美居中箭头和圆点 */
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: 1fr 1fr 1fr;
            place-items: center;
            z-index: 100;
            will-change: transform;
            user-select: none;
            touch-action: none;
        }

        /* 轨迹背景圈 */
        .track-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px dashed rgba(255, 255, 255, 0.2);
            pointer-events: none;
            z-index: 0;
        }

        /* 箭头通用样式 */
        .arrow {
            width: 24px;
            height: 24px;
            opacity: 0.6;
            transition: all 0.2s ease;
            z-index: 1;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .arrow.active {
            opacity: 1;
            filter: drop-shadow(0 0 4px rgba(255, 167, 38, 0.8));
            transform: scale(1.2);
        }

        /* 箭头位置分配 */
        .arrow.up { grid-column: 2; grid-row: 1; }
        .arrow.down { grid-column: 2; grid-row: 3; }
        .arrow.left { grid-column: 1; grid-row: 2; }
        .arrow.right { grid-column: 3; grid-row: 2; }

        /* 摇杆圆点：居中 */
        .dot {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: #ff8c00;
            cursor: grab;
            position: relative;
            z-index: 2;
            will-change: transform;
            grid-column: 2;
            grid-row: 2;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }

        .dot:active { cursor: grabbing; }

        .dot.ready {
            box-shadow: 0 0 10px rgba(255, 167, 38, 0.8);
        }

        /* 调试信息 */
        #debug {
            position: fixed;
            top: 20px;
            left: 20px;
            font-family: monospace;
            opacity: 0.8;
        }
    </style>
</head>
<body>

    <div id="debug">状态: 空闲</div>

    <!-- 摇杆结构 -->
    <div class="control-box" id="boxRef">
        <div class="track-bg"></div>
        <div class="arrow up" id="upArrow">▲</div>
        <div class="arrow left" id="leftArrow">◀</div>
        <div class="dot" id="dotRef"></div>
        <div class="arrow right" id="rightArrow">▶</div>
        <div class="arrow down" id="downArrow">▼</div>
    </div>

<script>
    // --- 配置参数 ---
    const IDLE_DELAY = 500;      // 进入待命模式的延迟时间(ms)
    const MAX_RADIUS = 65;       // 圆点滑动的最大半径(px)
    const SWIPE_THRESHOLD = 20;  // 触发箭头的阈值

    // --- DOM 引用 ---
    const boxRef = document.getElementById('boxRef');
    const dotRef = document.getElementById('dotRef');
    const upArrow = document.getElementById('upArrow');
    const downArrow = document.getElementById('downArrow');
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    const debug = document.getElementById('debug');

    // --- 内部非响应式状态 ---
    let isDragging = false;
    let isReadyMode = false;
    
    let idleTimer = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;

    let currentBoxX = 0;
    let currentBoxY = 0;
    let currentDotX = 0;
    let currentDotY = 0;

    let dragBaseX = 0;
    let dragBaseY = 0;
    let readyBaseX = 0;
    let readyBaseY = 0;

    let animationFrameId = null;
    let pendingMoveEvent = null;

    // --- 初始化位置逻辑 ---
    const backLeftInit = () => {
        currentBoxX = 50;
        currentBoxY = window.innerHeight / 2 - 70;
        updateBoxDom();
    };

    const updateBoxDom = () => {
        boxRef.style.transform = `translate3d(${currentBoxX}px, ${currentBoxY}px, 0)`;
    };

    // --- 核心方法 ---
    const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        if (!isReadyMode) {
            idleTimer = setTimeout(enterReadyMode, IDLE_DELAY);
        }
    };

    const enterReadyMode = () => {
        isReadyMode = true;
        readyBaseX = lastPointerX;
        readyBaseY = lastPointerY;
        dotRef.classList.add('ready');
        debug.innerText = "状态: 待命模式 (360度滑动)";
        if (navigator.vibrate) navigator.vibrate(50);
    };

    // 更新四个方向的箭头状态
    const updateArrows = (dx, dy) => {
        upArrow.classList.toggle('active', dy < -SWIPE_THRESHOLD);
        downArrow.classList.toggle('active', dy > SWIPE_THRESHOLD);
        leftArrow.classList.toggle('active', dx < -SWIPE_THRESHOLD);
        rightArrow.classList.toggle('active', dx > SWIPE_THRESHOLD);
    };

    const resetArrows = () => {
        upArrow.classList.remove('active');
        downArrow.classList.remove('active');
        leftArrow.classList.remove('active');
        rightArrow.classList.remove('active');
        dotRef.classList.remove('ready');
        debug.innerText = "状态: 空闲";
    };

    // 【性能核心】：RAF 循环处理 DOM 更新
    const processMove = () => {
        if (!pendingMoveEvent || !isDragging) {
            animationFrameId = requestAnimationFrame(processMove);
            return;
        }

        const e = pendingMoveEvent;
        pendingMoveEvent = null;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        lastPointerX = clientX;
        lastPointerY = clientY;
        resetIdleTimer();

        if (!isReadyMode) {
            // --- 模式 A：自由拖动整个容器 ---
            let deltaX = clientX - dragOffsetX - dragBaseX;
            let deltaY = clientY - dragOffsetY - dragBaseY;

            // 限制容器移动范围
            deltaX = Math.max(-50, Math.min(100, deltaX));
            deltaY = Math.max(-100, Math.min(50, deltaY));

            currentBoxX = dragBaseX + deltaX;
            currentBoxY = dragBaseY + deltaY;
            updateBoxDom();

        } else {
            // --- 模式 B：待命模式 - 360度圆点滑动 ---
            let dx = clientX - readyBaseX;
            let dy = clientY - readyBaseY;

            // 【核心算法】：计算距离并限制在圆内
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > MAX_RADIUS) {
                // 超出半径，利用三角函数将坐标投影到圆周上
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * MAX_RADIUS;
                dy = Math.sin(angle) * MAX_RADIUS;
            }

            currentDotX = dx;
            currentDotY = dy;

            // 拖拽时移除过渡动画，保证跟手
            dotRef.style.transition = 'none';
            dotRef.style.transform = `translate3d(${currentDotX}px, ${currentDotY}px, 0) scale(1)`;

            // 更新四个方向箭头
            updateArrows(dx, dy);
        }

        animationFrameId = requestAnimationFrame(processMove);
    };

    // --- 事件处理 ---
    const handleStart = (e) => {
        e.preventDefault();
        isDragging = true;
        isReadyMode = false;
        clearTimeout(idleTimer);
        resetArrows();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        dragBaseX = currentBoxX;
        dragBaseY = currentBoxY;
        dragOffsetX = clientX - currentBoxX;
        dragOffsetY = clientY - currentBoxY;

        lastPointerX = clientX;
        lastPointerY = clientY;
        resetIdleTimer();

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("touchmove", handleMove, { passive: false });
        window.addEventListener("mouseup", handleEnd);
        window.addEventListener("touchend", handleEnd);

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(processMove);
        }
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        pendingMoveEvent = e;
    };

    const handleEnd = () => {
        if (!isDragging) return;

        isDragging = false;
        isReadyMode = false;
        clearTimeout(idleTimer);

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        pendingMoveEvent = null;

        // 圆点回弹复位 (恢复过渡动画)
        currentDotX = 0;
        currentDotY = 0;
        dotRef.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease';
        dotRef.style.transform = `translate3d(0px, 0px, 0) scale(1)`;

        resetArrows();
        backLeftInit(); // 容器回到初始位置

        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchend", handleEnd);
    };

    // 绑定圆点按下事件
    dotRef.addEventListener('mousedown', handleStart);
    dotRef.addEventListener('touchstart', handleStart, { passive: false });

    // 初始化
    backLeftInit();
</script>
</body>
</html>