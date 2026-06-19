<template>
    <div class="page">
        <NavBar title="预约申诉" />

        <div class="wrap-content">
            <!-- 申诉图片：使用 Vant Uploader 组件 -->
            <div class="form-item">
                <div class="label required">申诉图片</div>
                <van-uploader v-model="fileList" :max-count="1" :max-size="1 * 1024 * 1024" :after-read="afterRead"
                    @oversize="onOversize" />
                <div class="tip">支持 .png .jpg .jpeg，最大 1M，仅限一张</div>
            </div>

            <!-- 申诉原因：使用 Vant CheckboxGroup 替代手写标签 -->
            <!-- <div class="form-item">
        <div class="label required">申诉原因</div>
        <van-checkbox-group v-model="selectedReason" direction="horizontal">
          <van-checkbox
            v-for="item in reasonList"
            :key="item"
            :name="item"
            shape="square"
            icon-size="16px"
          >
            {{ item }}
          </van-checkbox>
        </van-checkbox-group>
      </div> -->

            <div class="form-item">
                <div class="label required">申诉原因</div>
                <div class="reason-tags">
                    <div v-for="item in reasonList" :key="item" class="tag-item"
                        :class="{ active: selectedReason === item }" @click="selectedReason = item">
                        {{ item }}
                    </div>
                </div>
            </div>

            <!-- 申诉内容输入：使用 Vant Field 组件 -->
            <div class="form-item">
                <van-field v-model="content" class="bg-field" rows="4" autosize type="textarea"
                    placeholder="请把您的申诉内容反馈给我们" maxlength="100" show-word-limit />
            </div>

            <div class="hint">
                提示：由于车辆或车主原因导致不能驾驶可以向平台发起申诉
            </div>
        </div>

        <!-- 提交按钮：使用 Vant Button -->
        <div class="submit-btn-wrap">
            <van-button type="primary" block round color="#ffc83d" text-color="#1a1a1a" @click="handleSubmit">
                确定
            </van-button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast, showLoadingToast, closeToast } from "vant";
import { AppealOrderNo } from "@/api/mine";
import NavBar from "@/components/CustomNavBar/index.vue";


const route = useRoute();
const router = useRouter();

// 表单数据
const fileList = ref([]);
const imageUrl = ref("");
const selectedReason = ref('')

const content = ref("");
const orderNo = ref("");

// 获取路由参数
onMounted(() => {
    orderNo.value = route.query.order_no || "";
});

// 申诉原因选项
const reasonList = ref([
    "无视频信号",
    "无法控制",
    "车辆故障",
    "画面黑屏",
    "软件闪退",
    "车辆翻车",
    "其他",
]);

// Vant Uploader: 超出大小限制
const onOversize = () => {
    showToast("图片大小不能超过 1M");
};

// Vant Uploader: 选择文件后的回调
const afterRead = async (file) => {
    // 设置上传中状态
    file.status = "uploading";
    file.message = "上传中...";

    try {
        // 使用原生 FormData + fetch 上传
        const formData = new FormData();
        formData.append("imageFile[]", file.file);

        const response = await fetch(`${import.meta.env.VITE_BASE_API}/api/upload/picture`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.code === 200) {
            file.status = "done";
            file.message = "";
            imageUrl.value = data.data.file[0];
            showToast("上传成功");
        } else {
            showToast("上传失败");
            throw new Error("上传失败");
        }
    } catch (err) {
        file.status = "failed";
        file.message = "上传失败";
        imageUrl.value = "";
        console.error("上传错误：", err);
    }
};

// 提交申诉
const handleSubmit = async () => {
    if (!imageUrl.value) {
        return showToast("请上传申诉图片");
    }


    if (!selectedReason.value) {
        showToast('请选择申诉原因')
        return
    }
    if (selectedReason.value === '其他' && !content.value) {
        showToast('请填写申诉原因')
        return
    }


    const submitData = {
        image: imageUrl.value,
        content: reason === "其他" ? content.value : reason,
        order_no: orderNo.value,
    };

    try {
        showLoadingToast({
            message: "提交中...",
            forbidClick: true,
            duration: 0, // 手动关闭
        });

        await AppealOrderNo(submitData);
        closeToast();

        showToast('提交成功');
        setTimeout(() => {
            if (window.history.length > 1) {
                router.back(); // 有上一页，正常返回
            } else {
                router.replace("/index"); // 没有上一页（比如直接访问的），兜底跳转到首页
            }
        }, 1500);
    } catch (err) {
        closeToast();
        showToast("提交失败");
    }
};
</script>

<style lang="scss" scoped>
.page {
    background: #f8f8f8;
    min-height: 100vh;
}

.wrap-content {
    background: #fff;
    padding: 15px;
    margin: 15px;
    border-radius: 12px;
}

.form-item {
    margin-bottom: 24px;
}

.bg-field {
    background: #F8F8F8;
    border-radius: 8px;
}

.label {
    font-size: 15px;
    color: #333;
    display: block;
    margin-bottom: 12px;
    font-weight: 500;
}

.required::before {
    content: "*";
    color: red;
    margin-right: 4px;
}

.tip {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
    display: block;
}

.hint {
    font-size: 12px;
    color: #999;
    line-height: 1.5;
}

.submit-btn-wrap {
    position: fixed;
    left: 20px;
    right: 20px;
    bottom: 40px;
}

.reason-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px; // 20 / 2
}

.tag-item {
    padding: 5px 8px; // 10 / 2, 16 / 2
    border: 1px solid #666; // 1rpx 通常转换为 1px
    border-radius: 4px; // 8 / 2
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 12px; // 24 / 2
    color: #666666;
}

.tag-item.active {
    background: #FFC838;
    border-color: #FFC838;
    border-radius: 6px; // 12 / 2
    color: #1A1A1A;
}
</style>
