// stores/user.js
import { defineStore } from 'pinia'


export const useUserStore = defineStore('user', {
  // 1. 状态定义（无需手动从 storage 读取，插件会自动恢复）
  state: () => ({
    token: '',
    id: '',
    userInfo: {},
    areaId: ''
  }),

  // 2. 开启持久化配置
  persist: {
    key: 'user-store', // 自定义本地存储的 key
    storage: localStorage, // 默认存到 localStorage，也可改为 sessionStorage
    paths: ['token', 'id', 'userInfo', 'areaId'] // 指定需要持久化的字段，避免存储冗余
  },

  actions: {
    // 登录保存信息
    setUser(data) {
      this.userInfo = data
      this.id = data.id
      // 注意：这里无需再手动调用 setStorageSync，插件会自动处理
    },
    
    setToken(token) {
      this.token = token
    },
    
    setAreaId(areaId) {
      this.areaId = areaId
    },
    
    setId(id) {
      this.id = id
    },

    // 退出登录
    logout() {
      // 1. 重置状态
      this.$reset() 
      
      // 2. 清除本地存储（如果项目中还有其他非 Pinia 管理的缓存）
      localStorage.clear() 
      
      // 3. Vue 3 路由跳转（替代 uni.reLaunch）
      // 假设您使用的是 vue-router
      import('@/router').then(router => {
        router.default.push('/login') 
      })
    },

    // 获取登录 ID
    getLoginId() {
      return this.id
    },

    // 获取用户信息
    getUserInfo() {
      return this.userInfo
    }
  }
})