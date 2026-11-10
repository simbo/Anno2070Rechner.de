import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';

import App from './app.vue';
import { detectImageFormat } from './lib/image-format';
import { createAppRouter } from './router';

import './styles/styles.css';
import './styles/transitions.css';

const router = createAppRouter(createWebHistory());
const app = createApp(App);
app.use(createPinia());
app.use(router);
// The image format is known before the first background is shown, so only one version loads.
void Promise.all([router.isReady(), detectImageFormat()]).then(() => app.mount('#app'));
