import MainLayout from "@/layouts/MainLayout.vue";
import BlankLayout from "@/layouts/BlankLayout.vue";

export const routes = [
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '',
                name: 'home',
                meta: { requiresAuth: true, roles: []},
                component: () => import('@/views/Home.vue')
            },
            {
                path: '/about',
                name: 'about',
                meta: { requiresAuth: true, roles: []},
                component: () => import('@/views/About.vue')
            },
        ]
    },
    {
        path: '/admin',
        component: BlankLayout,
        children: [
            {
                path: 'dashboard',
                name: 'dashboard',
                meta: { requiresAuth: true, roles: []},
                component:  () => import('@/views/Admin.vue')
            }
        ]
    }
]
