import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './styles/main.scss';
import App from './App.vue';

createApp(App).use(createPinia()).mount('#app');
