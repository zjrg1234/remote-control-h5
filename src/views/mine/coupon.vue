<template>
  <div>

    <CustomNavBar title="我的卡券"></CustomNavBar>
    <div class="card-wrapper">

      <!-- 主卡片 -->
      <div class="card">
        <!-- 头部 -->
        <div class="header">
          <span class="special-tag">特惠</span>
          <span class="title">{{ cardData.title }}</span>
          <span class="status-tag">{{ cardData.status }}</span>
          <div class="help-box">
            <span class="help-icon">?</span>
            <span>权益说明</span>
          </div>
        </div>

        <!-- 主要数值 -->
        <div class="main-numbers">
          <div class="number-item">
            <span class="number">{{ cardData.minutes }}</span>
            <span class="unit">分钟</span>
          </div>
          <div class="number-item">
            <span class="number">{{ cardData.battery }}</span>
            <span class="unit">电池</span>
          </div>
        </div>

        <!-- 详情信息框 -->
        <div class="info-box">
          <div class="info-row">
            <span class="label">场地：</span>
            <span class="value">{{ cardData.venue }}</span>
          </div>
          <div class="info-row">
            <span class="label">车辆：</span>
            <span class="value">{{ cardData.vehicle }}</span>
            <span class="vehicle-status">{{ cardData.vehicleStatus }}</span>
          </div>
          <div class="info-row">
            <span class="label">购买时间：</span>
            <span class="value">{{ cardData.buyTime }}</span>
          </div>
          <div class="info-row">
            <span class="label">过期时间：</span>
            <span class="value">{{ cardData.expireTime }}</span>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="action-btns">
          <button class="btn refund-btn" @click="handleRefund">退卡</button>
          <button class="btn book-btn" @click="handleBook">预约驾驶</button>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { reactive } from 'vue';

// 模拟卡片数据（实际开发中可以从接口获取或通过 Props 传入）
const cardData = reactive({
  title: '累计驾驶时间卡',
  status: '未使用',
  minutes: 100,
  battery: 120,
  venue: 'RC原始地带',
  vehicle: '天涯任我独行',
  vehicleStatus: '空闲',
  buyTime: '2026-08-20 16:34:45',
  expireTime: '2026-10-20 16:39:45',
});

// 退卡逻辑
const handleRefund = () => {
  console.log('点击退卡');
  // TODO: 添加退卡业务逻辑
};

// 预约驾驶逻辑
const handleBook = () => {
  console.log('点击预约驾驶');
  // TODO: 添加预约业务逻辑
};
</script>

<style lang="scss" scoped>
/* 外层容器 */
.card-wrapper {
  padding: 20px;
  background-color: #f7f8fa;
  /* 模拟页面背景，方便查看卡片效果 */
  min-height: 100vh;
  box-sizing: border-box;
}

/* 主卡片 */
.card {
  /* 左上角偏绿，右下角偏蓝紫的渐变背景 */
  background: linear-gradient(135deg, #f2fce6 0%, #e2eafc 100%);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 20px rgba(180, 200, 220, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 头部区域 */
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  .special-tag {
    background-color: #c9f15f;
    color: #111;
    font-size: 22px;
    font-weight: 900;
    padding: 4px 12px;
    border-radius: 6px;
    letter-spacing: 1px;
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.1);
    transform: scale(1.05);
    /* 视觉上稍微放大一点，突出“特惠” */
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #222;
  }

  .status-tag {
    background-color: #a0a4a8;
    color: #fff;
    font-size: 13px;
    padding: 4px 12px;
    border-radius: 20px;
  }

  .help-box {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: #666;
    cursor: pointer;

    .help-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: 1px solid #999;
      border-radius: 50%;
      font-size: 12px;
      color: #999;
      line-height: 1;
    }
  }
}

/* 主要数值（100 分钟 / 120 电池） */
.main-numbers {
  display: flex;
  align-items: baseline;
  gap: 30px;
  margin-bottom: 24px;

  .number-item {
    display: flex;
    align-items: baseline;
    gap: 6px;

    .number {
      font-size: 48px;
      font-weight: 900;
      color: #5cbf4b;
      /* 亮绿色 */
      line-height: 1;
      letter-spacing: -1px;
    }

    .unit {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }
  }
}

/* 详情信息框 */
.info-box {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      width: 90px;
      /* 固定标签宽度，保证对齐 */
      font-size: 15px;
      color: #888;
      flex-shrink: 0;
    }

    .value {
      font-size: 15px;
      color: #333;
      font-weight: 500;
    }

    .vehicle-status {
      background-color: #6fd44b;
      color: #fff;
      font-size: 13px;
      padding: 2px 8px;
      border-radius: 6px;
      margin-left: 8px;
    }
  }
}

/* 底部操作按钮 */
.action-btns {
  display: flex;
  justify-content: flex-end;
  gap: 16px;

  .btn {
    border: none;
    border-radius: 40px;
    padding: 0 36px;
    height: 48px;
    font-size: 18px;
    font-weight: 700;
    color: #111;
    cursor: pointer;
    /* 按钮的黄绿渐变 */
    background: linear-gradient(90deg, #d3f18a 0%, #edf7a7 100%);
    /* 绿色发光阴影 */
    box-shadow: 0 6px 12px rgba(180, 220, 80, 0.3);
    transition: transform 0.1s ease, box-shadow 0.1s ease;

    &:active {
      transform: scale(0.96);
      box-shadow: 0 3px 6px rgba(180, 220, 80, 0.2);
    }
  }
}
</style>