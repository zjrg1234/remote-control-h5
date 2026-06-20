<template>
  <van-popup v-model:show="visible" :close-on-click-overlay="false" position="right" teleport="body" round
    class="custom-popup-right" :style="{ width: '60%', height: '100%' }">
    <div class="cont">
      <div class="left">
        <div class="group" v-if="selectedIndex == 0 && type == '1'" >
          <div class="group-item">
            <p class="tit">视频清晰度</p>
            <div class="flex">
              <span v-for="(item, index) in qualityList" :key="index" class="btn-quality"
                :class="{ active: currentQuality === item.value }" @click="handleSelect(item.value)">
                {{ item.label }}
              </span>
            </div>
          </div>

          <div class="group-item">
            <p class="tit">操作设置</p>
            <div class="flex">
              <div v-for="(mode, index) in steeringModes" :key="index" class="option-card"
                :class="{ 'is-active': selectedMode === mode.id }" @click="handleSetSelect(mode.id)">
                <!-- 右上角的黄色对勾 (仅当选中时显示) -->
                <div v-if="selectedMode === mode.id" class="check-mark">
                  <img src="@/assets/images/icon_selected@2x.png" alt="">
                </div>

                <!-- 布局区域：根据配置交换左右顺序 -->
                <div class="content-layout" :class="{ 'reverse-layout': mode.isReverse }">
                  <!-- 左侧/第一组图标 -->
                  <div class="icon-group">
                    <div class="icon-row vertical">
                      <IconArrowUp />
                      <IconArrowDown />
                    </div>
                    <span class="label">前进/后退</span>
                  </div>

                  <!-- 右侧/第二组图标 -->
                  <div class="icon-group">
                    <div class="icon-row horizontal">
                      <IconArrowLeft />
                      <IconArrowRight />
                    </div>
                    <span class="label">左转/右转</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="group-item pr">
            <div class="flex fj">
              <span class="tit">方向反向操作</span>
              <van-switch v-model="dir1Oper" @change="handleOper(1,$event)" size="15px" active-color="#f5c542" inactive-color="#dcdee0" />
            </div>

            <div class="flex fj">
              <span class="tit">进退反向操作</span>
              <van-switch v-model="dir2Oper" @change="handleOper(2, $event)" size="15px" active-color="#f5c542" inactive-color="#dcdee0" />
            </div>
          </div>
        </div>


        <div class="group" v-if="selectedIndex == 0 && type == '2'">
          <div class="group-item">
            <p class="tit">视频清晰度</p>
            <div class="flex">
              <span v-for="(item, index) in qualityList" :key="index" class="btn-quality"
                :class="{ active: currentQuality === item.value }" @click="handleSelect(item.value)">
                {{ item.label }}
              </span>
            </div>
          </div>

          <div class="group-item">
            <p class="tit">操作设置</p>
            <div class="flex">
              <div v-for="(mode, index) in steeringModes" :key="index" class="option-card"
                :class="{ 'is-active': selectedMode === mode.id }" @click="handleSetSelect(mode.id)">
                  <img v-if="selectedMode === mode.id && index == 0" src="@/assets/images/icon_ev_dir1_selected@2x.png" alt="">
                  <img v-if="selectedMode !== mode.id && index == 0" src="@/assets/images/icon_ev_dir1@2x.png" alt="">
                   <img v-if="selectedMode === mode.id && index == 1" src="@/assets/images/icon_ev_dir2_selected@2x.png" alt="">
                  <img v-if="selectedMode !== mode.id && index == 1" src="@/assets/images/icon_ev_dir2@2x.png" alt="">
                  

              
              </div>
            </div>
          </div>

          <div class="group-item pr">
            <div class="flex fj">
              <span class="tit">进退反向操作</span>
              <van-switch v-model="dir1Oper" @change="handleOper(3, $event)" size="15px" active-color="#f5c542" inactive-color="#dcdee0" />
            </div>

            <div class="flex fj">
              <span class="tit">旋转反向操作</span>
              <van-switch v-model="dir2Oper" @change="handleOper(4, $event)" size="15px" active-color="#f5c542" inactive-color="#dcdee0" />
            </div>
          </div>
        </div>

        <div class="group" v-if="selectedIndex == 1">
          <div class="group-item">
            <p class="tit">方向中位微调</p>
            <div class="section">
              <!-- 减少按钮 -->
              <div class="reduce" @click="handleReduce(1)">
                <img src="@/assets/images/icon_reduce@2x.webp" alt="" />
              </div>

              <!-- 滑块区域（占据主要空间） -->
              <div class="slider-wrapper">
                <div class="slider-label">
                  <div class="num" :style="{ left: dirMiddle + '%' }">{{ (500 + (dirMiddle - 1) * 45.45).toFixed(0) }}
                  </div>
                </div>
                <van-slider v-model="dirMiddle" :min="1" :max="100" active-color="#f5c542">
                  <template #button>
                    <div class="custom-sider-img">
                      <img src="@/assets/images/icon_sider@2x.webp" alt="滑块" />
                    </div>
                  </template>
                </van-slider>
                <div class="slider-label-bottom">
                  <div class="num-text num-left"> 500 </div>
                  <div class="num-text num-right"> 5000 </div>
                </div>
              </div>

              <!-- 增加按钮 -->
              <div class="add" @click="handleAdd(1)">
                <img src="@/assets/images/icon_add@2x.webp" alt="" />
              </div>

              <!-- 保存按钮 -->
              <div class="btn" @click="save(1)">保存</div>
            </div>
          </div>

          <div class="group-item">
            <p class="tit">方向力度微调</p>
            <div class="section">
              <!-- 减少按钮 -->
              <div class="reduce" @click="handleReduce(2)">
                <img src="@/assets/images/icon_reduce@2x.webp" alt="" />
              </div>

              <!-- 滑块区域（占据主要空间） -->
              <div class="slider-wrapper">
                <div class="slider-label">
                  <div class="num" :style="{ left: dirTurn + '%' }">{{ dirTurn }}</div>
                </div>
                <van-slider v-model="dirTurn" :min="1" :max="100" active-color="#f5c542">
                  <template #button>
                    <div class="custom-sider-img">
                      <img src="@/assets/images/icon_sider@2x.webp" alt="" />
                    </div>
                  </template>
                </van-slider>
                <div class="slider-label-bottom">
                  <div class="num-text num-left"> 1 </div>
                  <div class="num-text num-right"> 100 </div>
                </div>
              </div>

              <!-- 增加按钮 -->
              <div class="add" @click="handleAdd(2)">
                <img src="@/assets/images/icon_add@2x.webp" alt="" />
              </div>

              <!-- 保存按钮 -->
              <div class="btn" @click="save(2)">保存</div>
            </div>
          </div>

          <div class="group-item">
            <p class="tit">油门力度微调</p>
            <div class="section">
              <!-- 减少按钮 -->
              <div class="reduce" @click="handleReduce(3)">
                <img src="@/assets/images/icon_reduce@2x.webp" alt="" />
              </div>

              <!-- 滑块区域（占据主要空间） -->
              <div class="slider-wrapper">
                <div class="slider-label">
                  <div class="num" :style="{ left: throttle + '%' }">{{ throttle }}</div>
                </div>
                <van-slider v-model="throttle" :min="1" :max="50" active-color="#f5c542">
                  <template #button>
                    <div class="custom-sider-img">
                      <img src="@/assets/images/icon_sider@2x.webp" alt="" />
                    </div>
                  </template>
                </van-slider>
                <div class="slider-label-bottom">
                  <div class="num-text num-left"> 1 </div>
                  <div class="num-text num-right"> 50 </div>
                </div>
              </div>

              <!-- 增加按钮 -->
              <div class="add" @click="handleAdd(3)">
                <img src="@/assets/images/icon_add@2x.webp" alt="" />
              </div>

              <!-- 保存按钮 -->
              <div class="btn" @click="save(3)">保存</div>
            </div>
          </div>
        </div>





      </div>
      <div class="right">
        <div class="settings-bar">
          <div class="text-area">设置</div>
          <div class="close-btn" @click="close">
            <img src="@/assets/images/icon_close@2x.webp" alt="" />
          </div>
        </div>
        <div class="setting-group" v-for="(item, index) in setGroup" :key="index">
          <div class="setting-item" :class="{ active: selectedIndex == item.key }" @click="handleItem(index)">
            {{ item.name }}
          </div>
          <div class="gradient-line" v-if="selectedIndex == item.key"></div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed, ref } from "vue";
import { arrowUp, arrowDown, arrowLeft, arrowRight } from "../img.js";
const props = defineProps({
  show: { type: Boolean, default: false },
  type: { type: String, default: '1' },
});

const setGroup = ref([
  { name: "通用设置", key: 0 },
  { name: "车辆微调", key: 1 }
]);
const selectedIndex = ref(1);

const emit = defineEmits(["update:show", "action"]);

const visible = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val),
});

const close = () => {
  visible.value = false;
};
const handleItem = (index) => {
  selectedIndex.value = index;
};

const qualityList = [
  { label: "超清", value: "1" }, // 默认选中项
  { label: "高清", value: "2" },
  { label: "标清", value: "3" },
];

const currentQuality = ref("1");

// 3. 处理点击事件
const handleSelect = (value) => {
  currentQuality.value = value;
};

const selectedMode = ref("mode1");

// 定义两种模式的配置数据
const steeringModes = [
  { id: "mode1", isReverse: false }, // 正常布局
  { id: "mode2", isReverse: true }, // 反转布局
];

// 点击切换逻辑
const handleSetSelect = (id) => {
  selectedMode.value = id;
};


const iconConfig = {
  width: "12px",
  height: "12px",
  style: "object-fit: contain;",
};

const IconArrowUp = () => h("img", { src: arrowUp, ...iconConfig });
const IconArrowDown = () => h("img", { src: arrowDown, ...iconConfig });
const IconArrowLeft = () => h("img", { src: arrowLeft, ...iconConfig });
const IconArrowRight = () => h("img", { src: arrowRight, ...iconConfig });

import { h } from "vue";

const dir1Oper = ref(false);
const dir2Oper = ref(false);
const dirMiddle = ref(1);
const dirTurn = ref(1)
const throttle = ref(1)
const valueMap = {
  1: dirMiddle,
  2: dirTurn,
  3: throttle
};

// 2. 统一的加减处理函数
const handleValueChange = (type, step) => {
  const target = valueMap[type];
  if (!target) return; // 如果 type 不匹配，直接返回

  // 计算新值
  const newValue = target.value + step;

  // 3. 边界保护（假设范围是 0 ~ 100，请根据实际业务修改）
  target.value = Math.max(0, Math.min(100, newValue));
};

// 4. 调用时只需传入 type 和 步长（1 为加，-1 为减）
const handleAdd = (type) => handleValueChange(type, 1);
const handleReduce = (type) => handleValueChange(type, -1);

// 操作不同的类型
const handleOper = (type, val) => {
  console.log(type, val)
}


</script>

<style lang="scss" scoped>
.cont {
  display: flex;
  display: flex;
  width: 100%;
}

.left {
  width: 80%;
  /* 可以添加背景色或内边距方便查看效果 */
  background-color: #f0f0f0;

  box-sizing: border-box;

  border-right: 1px solid #fff;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0rpx 0rpx 0rpx 0rpx rgba(255, 255, 255, 0.3);
}

.right {
  width: 20%;
  height: 100vh;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.8);

  .settings-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #ffffff;
    padding: 4px;
    width: 100%;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(255, 255, 255, 0.4);

    .text-area {
      flex: 1;
      text-align: center;
      font-family: PingFangSC, PingFang SC;
      font-weight: 500;
      font-size: 7px;
      letter-spacing: 2;
      color: #ffffff;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn img {
      display: block;
      width: 12px;
      height: 12px;
    }
  }

  .setting-group {
    border-bottom: 1px solid #87878766;
    padding-bottom: 2px;

    .setting-item {
      font-family: PingFangSC, PingFang SC;
      font-weight: 500;
      font-size: 7px;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1;
      text-align: center;
      font-style: normal;
      padding: 5px 0;
    }

    .active {
      color: #ffc838;
    }

    .gradient-line {
      height: 1px;
      /* 线条的高度/粗细 */
      width: 100%;
      /* 线条长度 */

      /* 关键代码：创建线性渐变 */
      background: linear-gradient(to right,
          /* 方向：从左到右 */
          transparent,
          /* 起点：完全透明 */
          rgba(245, 197, 66, 0.8) 20%,
          /* 20%处开始显色 */
          #f5c542 50%,
          /* 中间：颜色最深 (#f5c542 是取样的金黄色) */
          rgba(245, 197, 66, 0.8) 80%,
          /* 80%处开始变淡 */
          transparent
          /* 终点：完全透明 */
        );

      margin: 0 auto;
      /* 居中显示 */
    }
  }
}

.left {
  padding: 5px;

  .group-item {
    margin-bottom: 2px;

    .tit {
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 7px;
      color: #ffffff;
    }
  }

  .flex {
    display: flex;
    gap: 12px;
    padding-top: 5px;
  }

  .fj {
    justify-content: space-between;
  }

  .pr {
    padding-right: 15px;
  }

  .btn-quality {
    background: transparent;
    border: 1px solid #f5c542;
    color: #f5c542;
    padding: 1px 5px;
    border-radius: 2px;
    font-size: 7px;
    cursor: pointer;
    transition: all 0.3s ease;
    outline: none;
  }

  .btn-quality.active {
    background-color: #f5c542;
    color: #000000;
    font-weight: bold;
    border-color: #f5c542;
  }

  .option-card {
    position: relative;
    width: 65px;
    height: 36px;
    border: 0.25px solid rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    background-color: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .option-card:hover {
    border-color: rgba(255, 255, 255, 0.6);
  }

  .option-card.is-active {
    border: 0.5px solid #f5c542;
    background-color: rgba(245, 197, 66, 0.05);
  }

  .check-mark {
    position: absolute;
    top: -0.25px;
    right: -0.25px;
    width: 10px; // 修改：稍微增大宽度，避免挤压
    height: 10px; // 修改：稍微增大高度
    // border: none;
    // border-style: solid;
    // border-width: 0 7.5px 7.5px 0;
    // border-color: transparent #f5c542 transparent transparent;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    overflow: hidden;
  }

  .check-mark img {
    position: absolute;
    top: 0; // 修改：修正顶部偏移，贴边显示
    right: 0; // 修改：修正右侧偏移，贴边显示
    width: 8px;
    height: 8px;
    transform: rotate(0deg);
    display: block;
  }

  .content-layout {
    display: flex;
    width: 100%;
    height: 100%;
    padding: 2.5px;
    box-sizing: border-box;
  }

  .reverse-layout {
    flex-direction: row-reverse;
  }

  .icon-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .icon-row {
    display: flex;
    gap: 2px;
    margin-bottom: 1px;
    height: 18px;

    img {
      width: 10px;
      width: 10px;
    }
  }

  .icon-row.vertical {
    flex-direction: column;
  }

  .icon-row.horizontal {
    flex-direction: row;
  }

  .label {
    font-size: 6px;
    color: #ccc;
    margin-top: 2px;
  }

  .is-active .label {
    color: #fff;
  }
}

.section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 40px;

}

.num {
  position: absolute;
  top: 5px;
  transform: translateX(-50%);
  /* 关键：让标签的中心点对齐 left 值，实现完美居中 */
  color: #fff;
  font-size: 6px;
  white-space: nowrap;
  /* 防止数字换行 */
  pointer-events: none;
  /* 防止标签拦截鼠标的拖拽事件 */
}

.slider-label {
  position: relative;
  height: 15px;
}

.slider-label-bottom {

  display: flex;
  justify-content: space-between;
  margin-top: 2px;

  .num-text {
    color: #fff;
    font-size: 6px;

  }

  .num-left {
    margin-left: -4px;
  }

  .num-right {
    margin-right: -4px;
  }
}

.reduce,
.add,
.btn {
  flex-shrink: 0;

}

.btn {

  border-radius: 2px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 6px;
  color: #1A1A1A;
  padding: 2px 4px;
  background: #FFC838;

}

.reduce img,
.add img {
  width: 12px;
  height: 12px;
  display: block;
}

// :deep(.van-slider__bar) {
//   min-width: 5px !important;
// }
</style>

<style>
.custom-popup-right {
  border-radius: 0px !important;
}

.custom-sider-img {
  width: 10px;
  height: 10px;
}
</style>
