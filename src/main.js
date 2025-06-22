import { createApp } from 'vue'
import './style.css'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from "@/router/index.js";
import { createPinia } from "pinia";
import i18n from "@/locales/i18n.js";
import PrimeVue from 'primevue/config';
import {useDarkModeStore} from "@/stores/darkMode.js";

createApp(App)
    .use(PrimeVue, {
        unstyled: true
    })
    .use(createPinia())
    .use(router)
    .use(i18n)
    .mount('#app')

const darkModeStore = useDarkModeStore()
darkModeStore.init()
