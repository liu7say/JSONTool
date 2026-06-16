// 在 Vue 项目中，main.js 是构建整个应用的起点
// 我们在这里初始化 Vue 实例、Pinia 状态管理、i18n，并挂载应用
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './styles/main.scss';
import App from './App.vue';
import { i18n } from './i18n';

// 创建应用实例并挂载到 DOM
createApp(App).use(createPinia()).use(i18n).mount('#app');
