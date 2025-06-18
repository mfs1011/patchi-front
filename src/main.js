import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "@/router/index.js";
import { createPinia } from "pinia";
import i18n from "@/locales/i18n.js";

createApp(App)
    .use(router)
    .use(i18n)
    .use(createPinia())
    .mount('#app')
