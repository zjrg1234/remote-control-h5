<template>
    <div class="page">
        <NavBar title="个人简介" />
        <!-- 用户信息区域 -->
        <div class="header">
            <div class="user-info">
                <div class="avatar-image">
                    <!-- 上传组件绑定ref，插槽只放头像 -->
                    <van-uploader ref="uploaderRef" :after-read="onFileChange" accept="image/*" :preview-size="50"
                        :max-size="500 * 1024" @oversize="showToast({ message: '图片不能超过500KB', type: 'fail' })">
                        <van-image round width="50px" height="50px" fit="cover" :src="userInfo.head_shot" />
                    </van-uploader>
                    <!-- 编辑箭头独立在外，点击唤起上传弹窗 -->
                    <img class="arrow-edit" src="@/assets/images/mine/icon_edit@2x.png" alt="编辑头像"
                        @click="triggerUpload" />
                </div>

            </div>
        </div>

        <div class="list-container">
            <!-- 第一行：昵称 -->
            <div class="list-item">
                <span class="label">昵称</span>
                <span class="content">{{ userInfo.username }}</span>
                <!-- <img src="@/assets/images/arrow_right.png" alt="" class="arrow" /> -->
                <i @click="editUsername"
                    class="van-badge__wrapper van-icon van-icon-arrow van-cell__right-icon"><!----><!----><!----></i>
            </div>

            <!-- 第二行：ID (通常 ID 不可点击，所以没有箭头，也可以加个分割线) -->
            <div class="list-item no-arrow">
                <span class="label">ID</span>
                <span class="content">{{ userInfo.show_id }}</span>
            </div>
        </div>

        <!-- 密码输入弹窗 -->
        <van-popup v-model:show="visible" position="center" round>
            <div class="modal-content">
                <h3>修改昵称</h3>
                <van-field v-model="username" placeholder="请输入,限定8个字" maxlength="8" />
                <div class="modal-footer">
                    <button class="confirm-btn common-btn" @click="handleConfirm">确认</button>
                </div>
            </div>
        </van-popup>

    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { showToast } from "vant";
import { useUserStore } from "@/store/modules/user";
import { ChangeHeadImg, ChangeName } from "@/api/mine";
import NavBar from "@/components/CustomNavBar/index.vue";
import { GetUserInfo } from "@/api/index";

const visible = ref(false)

const userStore = useUserStore();
// 上传组件ref，用于手动唤起文件选择
const uploaderRef = ref(null);

const userInfo = computed(() => userStore.getUserInfo());

const username = ref()

const editUsername = () => {
    visible.value = true
}

const handleConfirm = () => {
    ChangeName({
        name: username.value,
    }).then(res => {
        if (res.code == 200) {
            showToast({ message: "修改成功", type: "success" });
            GetUserInfo().then(res => {
            userStore.setUser({ ...res.data });

            }).catch()

            visible.value = false

        } else {
            showToast({ message: "修改失败", type: "fail" });
        }
    }).catch
}


// 点击编辑箭头唤起上传弹窗
const triggerUpload = () => {

    uploaderRef.value?.chooseFile();
};

// 图片选中后上传处理
const onFileChange = async (fileDetail) => {
    console.log(1)
    const file = fileDetail.file;
    // 本地预览临时图
    const previewUrl = URL.createObjectURL(file);
    userStore.setUser({ ...userInfo.value, head_shot: previewUrl });

    try {
        const formData = new FormData();
        formData.append("imageFile[]", file);

        const res = await fetch(`${import.meta.env.VITE_BASE_API}/api/upload/picture`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();

        if (data.code === 200) {
            const newUrl = data.data.file[0];
            // 调用接口更新用户头像
            await ChangeHeadImg({ head_shot: newUrl });
            userStore.setUser({ ...userInfo.value, head_shot: newUrl });
            showToast({ message: "上传成功", type: "success" });
        } else {
            showToast({ message: "上传失败", type: "fail" });
        }
    } catch (err) {
        console.error("上传失败：", err);
        showToast({ message: "上传失败", type: "fail" });
    }
};
</script>

<style lang="scss" scoped>
.page {
    background: #fff;
    min-height: 100vh;
}

.wrap-content {
    background: #fff;
    padding: 15px;
    margin: 15px;
    border-radius: 12px;
}

/* 用户信息 */
.header {
    position: relative;
    z-index: 1;
    padding: 25px 15px 0;
    display: flex;
    justify-content: center;
    border-top: 1px solid #EAEAEA ;
}

.user-info {
    display: flex;
    align-items: center;
}

.avatar-image {
    position: relative;
    margin-right: 10px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    // 让上传容器铺满整个头像区域，点击任意位置都能唤起文件框
    :deep(.van-uploader__wrapper) {
        width: 100%;
        height: 100%;
    }

    // 确保内部图片居中铺满
    :deep(.van-image) {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :deep(.van-image__img) {
        object-fit: cover;
        width: 100%;
        height: 100%;
    }

    .arrow-edit {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        display: block;
        border-radius: 50%;
        background-color: #fff;
        z-index: 2;
        pointer-events: auto;
    }
}


.list-container {
    margin-top: 30px;
    background-color: #fff;

    .list-item {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 15px;
        position: relative;
        // margin-bottom: 25px;



        .label {
            width: 50px;
            /* 固定宽度保证对齐 */
            color: #969799;
            font-size: 14px;
            height: 50px;
        }

        .content {
            flex: 1;
            /* 占据剩余空间 */
            color: #323233;
            font-size: 14px;
            text-align: left;
            // 防止长数字换行
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: 10px;
            height: 50px;

        }

        .van-icon {

            display: block;
            height: 50px;
            top: 3px;

        }
    }
}


.confirm-btn {
    margin-top: 20px;
    border-radius: 24px;
    height: 48px;
    font-size: 16px;
    font-weight: bold;
    background-color: #fbbd08;
    border: none;
    color: #333;
    width: 100%;
}

/* 弹窗通用样式 */
.modal-content {
    padding: 20px;
    width: 80vw;
    max-width: 300px;
    text-align: center;
}

.modal-content h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 18px;
}

.cont {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
    text-align: left;
}

.modal-footer {
    margin-top: 15px;
}
</style>