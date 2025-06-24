import MainLayout from "@/layouts/MainLayout.vue";
import BlankLayout from "@/layouts/BlankLayout.vue";
import blankLayout from "@/layouts/BlankLayout.vue";

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
                meta: { requiresAuth: true, roles: []},
                component: blankLayout,
                children: [
                    {
                        path: '',
                        name: 'administration',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Admin.vue')
                    },
                    {
                        path: 'users',
                        name: 'users',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Users.vue')
                    },
                    {
                        path: 'clients',
                        name: 'clients',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Clients.vue')
                    },
                    {
                        path: 'suppliers',
                        name: 'suppliers',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Suppliers.vue')
                    },
                    {
                        path: 'products',
                        name: 'products',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Products.vue')
                    },
                    {
                        path: 'warehouses',
                        name: 'warehouses',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Warehouses.vue')
                    },
                    {
                        path: 'shops',
                        name: 'shops',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Shops.vue')
                    },
                    {
                        path: 'categories',
                        name: 'categories',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Categories.vue')
                    },
                    {
                        path: 'currency_rates',
                        name: 'currency_rates',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/CurrencyRates.vue')
                    },
                ]
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
