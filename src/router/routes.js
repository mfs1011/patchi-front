import MainLayout from "@/layouts/MainLayout.vue";
import BlankLayout from "@/layouts/BlankLayout.vue";

const ifAuthorized = (to, from, next) => {
    if (localStorage.getItem('patchi_accessToken') !== null) {
        next()
    } else {
        next({ name: 'login' })
    }
}

const ifNotAuthorized = (to, from, next) => {
    if (localStorage.getItem('patchi_accessToken') === null) {
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
                        path: 'content',
                        name: 'warehouse-content',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseContent.vue')
                    },
                    {
                        path: 'warehouse-kits',
                        name: 'warehouse-kits',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/warehouse/WarehouseKits.vue')
                    },
                    {
                        path: 'income-invoices',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'warehouse-income-invoices',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/warehouse/incomeInvoice/WarehouseIncomeInvoices.vue'),
                            },
                            {
                                path: 'income-invoice/:id',
                                name: 'income-invoice',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/warehouse/incomeInvoice/WarehouseIncomeInvoice.vue'),
                            },
                            {
                                path: 'add',
                                name: 'add-income-invoices',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/warehouse/incomeInvoice/WarehouseIncomeInvoiceAdd.vue')
                            }
                        ]
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
                        path: 'content',
                        name: 'shop-content',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/shop/ShopContent.vue')
                    },
                    {
                        path: 'kits',
                        children: [
                            {
                                path: '',
                                name: 'kits',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/shop/kit/Kits.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-kit',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/shop/kit/KitsAdd.vue')
                            },
                            {
                                path: 'kit/:id',
                                name: 'kit',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/shop/kit/Kit.vue')
                            },
                        ]
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
                        path: 'corporate-clients',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'clients-b2b',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/clientsB2B/ClientsB2B.vue'),
                            },
                            {
                                path: 'add',
                                name: 'add-client-b2b',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/clientsB2B/ClientsB2BAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-client-b2b',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/clientsB2B/ClientsB2BEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'boutique-clients',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'clients-b2c',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/clientsB2C/ClientsB2C.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-client-b2c',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/clientsB2C/ClientsB2CAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-client-b2c',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/clientsB2C/ClientsB2CEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'suppliers',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'suppliers',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/supplier/Suppliers.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-suppliers',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/supplier/SuppliersAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-suppliers',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/supplier/SuppliersEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'products',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'products',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/product/Products.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-product',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/product/ProductsAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-product',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/product/ProductsEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'warehouses',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'warehouses',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/warehouse/Warehouses.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-warehouse',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/warehouse/WarehousesAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-warehouse',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/warehouse/WarehousesEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'shops',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'shops',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/shop/Shops.vue'),
                            },
                            {
                                path: 'add',
                                name: 'add-shop',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/shop/ShopsAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-shop',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/shop/ShopsEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'categories',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'categories',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/category/Categories.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-category',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/category/CategoriesAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-category',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/category/CategoriesEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'currency-rates',
                        name: 'currency-rates',
                        meta: { requiresAuth: true, roles: []},
                        component: () => import('@/views/admin/CurrencyRates.vue')
                    },
                    {
                        path: 'colors',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'colors',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/color/Colors.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-color',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/color/ColorsAdd.vue')
                            }
                        ]
                    },
                    {
                        path: 'kpi',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'kpi',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/kpi/KPI.vue')
                            },
                            {
                                path: 'add/:entity',
                                name: 'add-kpi',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/kpi/KPIAdd.vue')
                            },
                            {
                                path: 'edit/:entity/:id',
                                name: 'edit-kpi',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/kpi/KPIEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'payments',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'payments',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/payment/Payments.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-payment',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/payment/PaymentsAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-payment',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/payment/PaymentsEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'collections',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'collections',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/collection/Collections.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-collection',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/collection/CollectionsAdd.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-collection',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/collection/CollectionsEdit.vue')
                            },
                        ]
                    },
                    {
                        path: 'expiry-date-notification-day',
                        meta: { requiresAuth: true, roles: []},
                        children: [
                            {
                                path: '',
                                name: 'expiry-date-notification-day',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/expiryDateNotificationDay/ExpiryDateNotificationDay.vue')
                            },
                            {
                                path: 'edit/:id',
                                name: 'edit-expiry-date-notification-day',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/admin/expiryDateNotificationDay/ExpiryDateNotificationDayEdit.vue')
                            },
                        ]
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
                        path: 'inventories',
                        children: [
                            {
                                path: '',
                                name: 'inventories',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/report/inventory/Inventories.vue')
                            },
                            {
                                path: 'inventory/:id',
                                name: 'inventory',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/report/inventory/Inventory.vue')
                            },
                            {
                                path: 'add',
                                name: 'add-inventory',
                                meta: { requiresAuth: true, roles: []},
                                component: () => import('@/views/report/inventory/InventoriesAdd.vue')
                            },
                        ]
                    },
                    {
                        path: 'seller_kpi',
                        name: 'seller_kpi',
                        component: () => import('@/views/report/kpi/SellersKpi.vue')
                    },
                    {
                        path: 'abc',
                        name: 'abc',
                        component: () => import('@/views/report/abc/ABCAnalysis.vue')
                    },
                    {
                        path: 'residual',
                        name: 'residual',
                        component: () => import('@/views/report/residual/Residual.vue')
                    },
                    {
                        path: 'franchise_fee',
                        name: 'franchise_fee',
                        component: () => import('@/views/report/franchiseFee/FranchiseFee.vue')
                    },
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
