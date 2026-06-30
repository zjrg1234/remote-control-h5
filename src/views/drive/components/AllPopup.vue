<!-- MyPopup.vue -->
<template>
  <van-popup
    v-model:show="visible"
    :close-on-click-overlay="false"
    teleport="body"
    round
    class="custom-popup-round"
  >
    <!-- 场景1：黑屏提示 -->
    <template v-if="type === 'tip'">
      <div class="tip-content">
        <p class="time">倒计时{{ count }}s</p>
        <p class="tit">是否黑屏？</p>
        <div class="text">
          <p>开始驾驶前如遇黑屏或者车辆故障上报不扣费，开始驾驶后开始计费。</p>
          <p>如果一切正常，请点击“开始驾驶”</p>
        </div>
      </div>
      <div class="footer">
        <span class="btn left mr" @click.stop="handleAction('repair')"
          >上报故障</span
        >
        <span class="btn right" @click.stop="handleAction('driving')"
          >开始驾驶</span
        >
      </div>
    </template>

    <!-- 场景2：退出驾驶 -->
    <template v-else-if="type === 'logout'">
      <div class="tip-content">
        <p class="tit">退出驾驶</p>
        <div class="text ct">
          <p>未用完的电池将放到余额里</p>
        </div>
      </div>
      <div class="footer fc">
        <div class="flex">
          <span class="btn left" @click.stop="cancel">取消</span>
          <span class="btn left" @click.stop="handleAction('report')"
            >上报故障</span
          >
        </div>
        <div class="flex mt">
          <span class="btn right" @click.stop="handleAction('logout')"
            >退出驾驶</span
          >
        </div>
      </div>
    </template>

    <!-- 场景3：维修 -->
    <template v-else-if="type === 'repair'">
      <div class="tip-content repair">
        <p class="tit">设备报修</p>
        <div v-if="isShow" class="reason">
          <span
            v-for="(item, index) in list"
            :key="index"
            @click="selectReason(index, item)"
            :class="['reason-item', { active: selectedIndex === index }]"
            >{{ item }}</span
          >
        </div>
        <div class="ttarea">
          <van-cell-group inset>
            <van-field
              v-model="message"
              rows="2"
              autosize
              label=""
              type="textarea"
              maxlength="20"
              placeholder="请输入故障原因，最多20字（选填）"
              show-word-limit
            />
          </van-cell-group>
        </div>
        <p class="warn-tip">
          温馨提示：上报车辆故障后，车辆将冻结，你将退退出驾驶。若遇到黑屏或者画面卡顿，请重新刷新页面
        </p>
      </div>
      <div class="footer">
        <div class="flex">
          <span class="btn left" @click.stop="cancel">取消</span>
          <span class="btn right" @click.stop="report">上报</span>
        </div>
      </div>
    </template>

    <template v-if="type === 'countTip'">
      <div class="tip-content">
        <p class="time">倒计时{{ count }}s</p>
        <p class="tit">您的驾驶时间即将结束</p>
        <div class="text">
          <p>即将结束本次驾驶，欢迎您下次再来！</p>
        </div>
      </div>
      <div class="footer">
        <div class="flex mt">
          <span class="btn right" @click.stop="handleAction('logout')"
            >退出驾驶</span
          >
        </div>
      </div>
    </template>
  </van-popup>
</template>

<script setup>
import { computed, onMounted, ref, onUnmounted } from "vue";
import { showToast } from "vant";
import { useRouter } from "vue-router";
import { CarReport } from "@/api/index";

const router = useRouter();

const props = defineProps({
  show: { type: Boolean, default: false },
  orderNo: { type: String, default: "" },
  vehicleId: { type: String, default: "" },
});

const type = ref("tip");
const isShow = ref(false);
const count = ref(15);
const message = ref("");
const text = ref();

let countdownTimer = null;

const list = ref([
  "车辆翻车",
  "画面卡顿",
  "无视频信号",
  "车辆无法控制",
  "画面黑屏",
  "电量低",
  "其他",
]);
const selectedIndex = ref(0);
const selectReason = (index, item) => {
  selectedIndex.value = index;
  text.value = item;
};

onMounted(() => {
  clearCountdown();
  // 2. 修复 const 不能重新赋值的 bug
  countdownTimer = setInterval(() => {
    count.value -= 1;
    console.log(12);
    if (count.value == 0) {
      count.value = 0;
      clearInterval(countdownTimer);
      countdownTimer = null;
      visible.value = false;
      handleAction("driving");
    }
  }, 1000);
  text.value = "车辆翻车";
});

const clearCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

// 组件销毁时务必清理定时器
onUnmounted(() => {
  clearCountdown();
});

const emit = defineEmits(["update:show", "action"]);

// 实现 v-model:show 双向绑定
const visible = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val),
});

// 统一处理按钮点击，向父组件抛出动作类型
const handleAction = (actionType) => {
  // 维修上报都是一起的
  if (actionType == "repair" || actionType == "report") {
    type.value = "repair";
    countdownTimer && clearInterval(countdownTimer);
    return;
  }

  emit("action", actionType);
};

const cancel = () => {
  visible.value = false;
  selectedIndex.value = 0;
};

const report = () => {
  let msg = "";
  //  isShow 显示原因
  if (!isShow.value) {
    if (!message.value) {
      showToast("请输入内容");
      return;
    } else {
      msg = message.value;
    }
  } else {
    if (text.value == "其他") {
      if (!message.value) {
        showToast("请输入内容");
        return;
      } else {
        msg = message.value;
      }
    } else {
      msg = text.value;
    }
  }

  CarReport({
    order_no: props.orderNo,
    id: props.vehicleId,
    text: msg,
  })
    .then((res) => {
      if (res.code == 200) {
        showToast("上报成功");
      } else {
        showToast(res.msg);
      }
    })
    .catch();
};

const setType = (val, flag) => {
  type.value = val;
  isShow.value = !!flag;
  message.value = ""; // 重置输入框
  selectedIndex.value = 0;
  text.value = list.value[0]; // 重置默认选项

  // 即将结束倒计时
  if (val === "countTip") {
    count.value = 5;
    countdownTimer = setInterval(() => {
      count.value -= 1;
      if (count.value == 0) {
        count.value = 0;
        clearInterval(countdownTimer);
        countdownTimer = null;
        visible.value = false;
        handleAction("logout");
      }
    }, 1000);
  }
};

defineExpose({
  setType,
});
</script>

<style lang="scss" scoped>
.tip-content {
  text-align: center;
  width: 140px;
  font-family: PingFangSC, PingFang SC;
  padding: 10px;

  .time {
    font-size: 10px;
    color: #333;
  }

  .tit {
    font-size: 10px;
    font-weight: bold;
    color: #333;
    width: 100%;
    text-align: center;
  }

  .text {
    font-size: 7px;
    color: #666;
    text-align: left;
  }

  .ct {
    text-align: center;
  }
}

.footer {
  display: flex;
  padding: 10px;
  padding-top: 0;
  justify-content: space-between;
}

.fc {
  flex-direction: column;
}

.flex {
  display: flex;
  width: 100%;
  gap: 5px;
}

.btn {
  display: block;
  flex: 1;
  transition: opacity 0.2s;
  text-align: center;
  border-radius: 2px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 9px;
  color: #222222;
  padding: 1px 4px;
  cursor: pointer;
}

.left {
  background: #f0f0f0;
}

.right {
  background: #ffc838;
}

.mt {
  margin-top: 5px;
}

.mr {
  margin-right: 5px;
}

.repair {
  width: 220px;
}

.reason {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  /* 使用 gap 替代 margin，布局更整洁 */
  padding: 3px 0;
}

.reason-item {
  padding: 1px 2px;
  border-radius: 2px;
  /* 胶囊形状，适合标签选择 */
  color: #666666;
  font-size: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
  /* 添加过渡动画，使状态切换更平滑 */
  user-select: none;
  /* 防止双击时文字被选中 */
  border: 0.5px solid #666666;
  margin-top: 2px;
  margin-right: 7px;
}

.reason-item:active {
  opacity: 0.8;
}

/* 选中状态的高亮样式 */
.reason-item.active {
  border: 0.5px solid #ffc838;
  background-color: #ffc838;
  color: #1a1a1a;
}

.warn-tip {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 5px;
  color: #999999;
  padding-top: 5px;
  text-align: left;
}

.ttarea {
  :deep(.van-field__control) {
    color: #222;
    line-height: 1;
    font-size: 10px;
    height: 28px !important;

    &::placeholder {
      font-size: 8px;
      color: #999999;
    }
  }

  :deep(.van-field) {
    background: #f2f2f2;
    padding: 8px;
  }

  :deep(.van-field__word-limit) {
    font-size: 8px;
    margin-top: 0;
    line-height: 1;
  }

  :deep(.van-cell-group--inset) {
    border-radius: 3px;
    margin: 0;
  }
}
</style>

<style>
.custom-popup-round {
  border-radius: 6px !important;
}
</style>
