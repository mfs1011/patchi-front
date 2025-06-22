import {createRouter, createWebHistory} from "vue-router";
import { routes } from "./routes.js";
import {useSidebarStore} from "@/stores/sidebar.js";

export const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    const store = useSidebarStore()
    store.startIsRouteLoading()
    next()
})

router.afterEach(() => {
    const store = useSidebarStore()
    setTimeout(store.endIsRouteLoading, 400)
})
export default router