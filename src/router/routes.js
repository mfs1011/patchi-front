import MainLayout from "@/layouts/MainLayout.vue";
import BlankLayout from "@/layouts/BlankLayout.vue";

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
                component: () => import('@/views/Home.vue'),
            },
            {
                path: '/warehouse',
                meta: { requiresAuth: true, roles: []},
                component: BlankLayout,
                children: [
                    {
                        path: '',
                        name: 'warehouse',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/Warehouse.vue')
                    },
                    {
                        path: 'products-in-stock',
                        name: 'warehouse-products-in-stock',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseProductsInStock.vue')
                    },
                    {
                        path: 'warehouse-kits',
                        name: 'warehouse-kits',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseKits.vue')
                    },
                    {
                        path: 'income-invoices',
                        name: 'warehouse-income-invoices',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseIncomeInvoice.vue')
                    },
                    {
                        path: 'transfer-invoices',
                        name: 'warehouse-transfer-invoices',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseTransferInvoice.vue')
                    },
                    {
                        path: 'orders',
                        name: 'warehouse-orders',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseOrders.vue')
                    },
                    {
                        path: 'return-invoices',
                        name: 'warehouse-return-invoices',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseReturnInvoice.vue')
                    },
                    {
                        path: 'write-off-invoices',
                        name: 'warehouse-write-off-invoices',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseWriteOffInvoice.vue')
                    },
                ]
            },
            {
                path: '/shop',
                meta: { requiresAuth: true, roles: []},
                component: BlankLayout,
                children: [
                    {
                        path: '',
                        name: 'shop',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/shop/Shop.vue')
                    },
                    {
                        path: 'products-in-stock',
                        name: 'shop-products-in-stock',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/shop/ShopProductsInStock.vue')
                    },
                    {
                        path: 'shop-kits',
                        name: 'shop-kits',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/shop/ShopKits.vue')
                    },
                    {
                        path: 'transfer-invoices',
                        name: 'shop-transfer-invoices',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/shop/ShopTransferInvoice.vue')
                    },
                    {
                        path: 'orders',
                        name: 'shop-orders',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/shop/ShopOrders.vue')
                    },
                    {
                        path: 'return-invoices',
                        name: 'shop-return-invoices',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/shop/ShopReturnInvoice.vue')
                    },
                    {
                        path: 'write-off-invoices',
                        name: 'shop-write-off-invoices',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/shop/ShopWriteOffInvoice.vue')
                    },
                ]
            },
            {
                path: '/administration',
                meta: { requiresAuth: true, roles: []},
                component: BlankLayout,
                children: [
                    {
                        path: '',
                        name: 'administration',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Admin.vue')
                    },
                    {
                        path: 'users',
                        meta: { requiresAuth: true, roles: []},
                        component: BlankLayout,
                        children: [
                            {
                                path: '',
                                name: 'users',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/user/Users.vue'),
                            },
                            {
                                path: 'add',
                                name: 'add-user',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/user/UserAdd.vue'),
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-user',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/user/UserEdit.vue'),
                            }
                        ]
                    },
                    {
                        path: 'sellers',
                        meta: { requiresAuth: true, roles: []},
                        component: BlankLayout,
                        children: [
                            {
                                path: '',
                                name: 'sellers',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/seller/Sellers.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-seller',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/seller/SellerAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-seller',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/seller/SellerEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'clients-b2b',
                        name: 'clients-b2b',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/ClientsB2B.vue')
                    },
                    {
                        path: 'clients-b2c',
                        name: 'clients-b2c',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/ClientsB2C.vue')
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
                        path: 'currency-rates',
                        name: 'currency-rates',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/CurrencyRates.vue')
                    },
                    {
                        path: 'colors',
                        name: 'colors',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Colors.vue')
                    },
                    {
                        path: 'kpi',
                        name: 'kpi',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/KPI.vue')
                    },
                    {
                        path: 'payment-type',
                        name: 'payment-type',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/PaymentType.vue')
                    },
                    {
                        path: 'collections',
                        name: 'collections',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/Collections.vue')
                    },
                ]
            },
            {
                path: '/reports',
                meta: { requiresAuth: true, roles: []},
                component: BlankLayout,
                children: [
                    {
                        path: '',
                        name: 'reports',
                        component: () => import('@/views/report/Reports.vue')
                    },
                    {
                        path: 'sales-report',
                        name: 'sales-report',
                        component: () => import('@/views/report/SalesReport.vue')
                    }
                ]
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
