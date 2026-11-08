import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';

import App from './app.vue';
import { createAppRouter } from './router';

import './styles/styles.css';
import './styles/transitions.css';

const router = createAppRouter(createWebHistory());
const app = createApp(App);
app.use(createPinia());
app.use(router);
void router.isReady().then(() => app.mount('#app'));
