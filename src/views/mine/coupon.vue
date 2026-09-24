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
            <img class="help-icon" src="@/assets/images/icon_explain@2x.png" />
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
            <span class="number small">{{ cardData.battery }}</span>
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
  padding: 25px;
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
  box-shadow: 0 16px 40px rgba(180, 200, 220, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  position: relative;
  background: url("@/assets/images/bg_way_green_big@2x.png") center / cover no-repeat;
  padding: 20px;
  margin-top: 25px;
}

/* 头部区域 */
.header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 25px;
  .special-tag {

    font-family: YouSheBiaoTiHei;
    font-weight: 700;
    font-size: 58px;
    color: #1A1A1A;
    height: 84px;
    width: 150px;
    background: #8DF182;
    position: absolute;
    top: -15px;
    text-align: center;
    display: block;
    font-style: oblique 1deg;
  }

  .title {
    font-family: PingFangSC, PingFang SC;
    font-weight: 600;
    font-size: 28px;
    color: #1A1A1A;
    padding-left: 160px;
  }

  .status-tag {
    color: #fff;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 21px;
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 24px;
    color: #FFFFFF;
    padding: 0 10px;
  }

  .help-box {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;

    cursor: pointer;

    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 24px;
    color: #666666;


    .help-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
  
    }
  }
}

/* 主要数值（100 分钟 / 120 电池） */
.main-numbers {
  display: flex;
  align-items: baseline;
  gap: 24px;
  margin-bottom: 20px;
  padding-left: 20px;


  .number-item {
    display: flex;
    align-items: baseline;
    gap: 12px;
   
    .number {
     font-family: Impact;
      font-size: 59px;
      color: #34D2A5;
    }
    .small {
      font-family: PingFangSC, PingFang SC;
      font-size: 28px;
      color: #34D2A5;
    }

    .unit {
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 28px;
      color: #1A1A1A;
    }
  }
}

/* 详情信息框 */
.info-box {
  background: rgba(255,255,255,0.4);
  border-radius: 24px;
  padding: 20px;

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 24px;
      color: #666666;
      flex-shrink: 0;
    }

    .value {
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 24px;
      color: #666666;
    }

    .vehicle-status {
      background: #07C160;
      border-radius: 21px;
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 20px;
      color: #FFFFFF;
      width: 72px;
      padding: 3px 5px;
      text-align: center;
      margin-left: 16px;
      // height: 36px;
    }
  }
}

/* 底部操作按钮 */
.action-btns {
  display: flex;
  justify-content: flex-end;

  .btn {
    border: none;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
    background: url("@/assets/images/btn@2x.png") center / cover no-repeat;
    width: 222px;
    height: 106px;

    font-family: PingFangSC, PingFang SC;
font-weight: 600;
font-size: 30px;
color: #1A1A1A;

    &:active {
      transform: scale(0.96);
      box-shadow: 0 6px 12px rgba(180, 220, 80, 0.2);
      /* 0 3px 6px * 2 */
    }
  }
}
</style>