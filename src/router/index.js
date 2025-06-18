import {createRouter, createWebHistory} from "vue-router";
import { routes } from "./routes.js";

export const router = createRouter({
    history: createWebHistory(),
    routes
})

// router.beforeEach((to, from, next) => {
//     NProgress.start()
// })
//
// router.afterEach((to, from, next) => {
//     NProgress.done()
// })

export default router