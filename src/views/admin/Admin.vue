<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import SectionCards from "@/components/SectionCards.vue";

const { t } = useI18n();

const cards = computed(() => [
    { id: 1, name: t('cards.users'), image: 'Users.png', routeName: 'users' },
    { id: 2, name: t('cards.sellers'), image: 'Sellers.png', routeName: 'sellers' },
    { id: 3, name: t('cards.clientsB2B'), image: 'Customer_b2b.png', routeName: 'clients-b2b' },
    { id: 4, name: t('cards.clientsB2C'), image: 'Customer_b2c.png', routeName: 'clients-b2c' },
    { id: 5, name: t('cards.suppliers'), image: 'Suppliers.png', routeName: 'suppliers' },
    { id: 6, name: t('cards.products'), image: 'Products.png', routeName: 'products' },
    { id: 7, name: t('cards.warehouses'), image: 'Warehouses.png', routeName: 'warehouses' },
    { id: 8, name: t('cards.shops'), image: 'Market.png', routeName: 'shops' },
    { id: 9, name: t('cards.categories'), image: 'Category.png', routeName: 'categories' },
    { id: 10, name: t('cards.currencyRates'), image: 'UsdRate.png', routeName: 'currency-rates' },
    { id: 11, name: t('cards.colors'), image: 'Colors.png', routeName: 'colors' },
    { id: 12, name: t('cards.kpi'), image: 'KPI.png', routeName: 'kpi' },
    { id: 13, name: t('cards.payments'), image: 'Payment.png', routeName: 'payments' },
    { id: 14, name: t('cards.collection'), image: 'Gift.png', routeName: 'collections' },
    { id: 15, name: t('cards.expiryDateNotificationDay'), image: 'Expiry.png', routeName: 'expiry-date-notification-day' },
])

</script>

<template>
    <div class="min-h-full flex flex-col">
        <SectionCards :cards />
    </div>
</template>
