import MainLayout from "@/layouts/MainLayout.vue";
import BlankLayout from "@/layouts/BlankLayout.vue";
import {defineAsyncComponent} from "vue";

const ifAuthorized = (to, from, next) => {
    if (localStorage.getItem('accessToken') !== null) {
        next()
    } else {
        next({ name: 'login' })
    }
}

const ifNotAuthorized = (to, from, next) => {
    if (localStorage.getItem('accessToken') === null) {
        next()
    } else {
        next({ name: 'home' })
    }
}

export const routes = [
    {
        path: '/',
        component: MainLayout,
        beforeEnter: ifAuthorized,
        children: [
            {
                path: '',
                name: 'home',
                meta: { requiresAuth: true, roles: []},
                component: () => import('@/views/Home.vue')
            },
            {
                path: '/warehouse',
                name: 'warehouse',
                meta: { requiresAuth: true, roles: []},
                component: () => import('@/views/Warehouse.vue')
            },
            {
                path: '/administration',
                name: 'administration',
                meta: { requiresAuth: true, roles: []},
                component: () => import('@/views/Admin.vue')
            },
            {
                path: '/reports',
                name: 'reports',
                meta: { requiresAuth: true, roles: []},
                component: () => import('@/views/Reports.vue')
            },
            {
                path: '/logs',
                name: 'logs',
                meta: { requiresAuth: true, roles: []},
                component: () => import('@/views/Logs.vue')
            },
        ]
    },
    {
        path: '/login',
        component: BlankLayout,
        beforeEnter: ifNotAuthorized,
        children: [
            {
                path: '',
                name: 'login',
                meta: { requiresAuth: true, roles: []},
                component:  () => import('@/views/Auth.vue')
            }
        ]
    }
]
