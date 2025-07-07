<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import SectionCards from "@/components/SectionCards.vue";

const { t } = useI18n();

const cards = computed(() => [
    { id: 1, name: t('cards.productsInWarehouse'), image: 'WarehouseQuantity.png', routeName: 'warehouse-products-in-stock' },
    { id: 1, name: t('cards.kitsInWarehouse'), image: 'Kits.png', routeName: 'warehouse-kits' },
    { id: 2, name: t('cards.incomeInvoices'), image: 'IncomeInvoice.png', routeName: 'warehouse-income-invoices' },
    { id: 3, name: t('cards.transferInvoices'), image: 'TransferInvoice.png', routeName: 'warehouse-transfer-invoices' },
    { id: 4, name: t('cards.orders'), image: 'Order.png', routeName: 'warehouse-orders' },
    { id: 5, name: t('cards.returnInvoices'), image: 'Return.png', routeName: 'warehouse-return-invoices' },
    { id: 6, name: t('cards.writeOffInvoices'), image: 'WriteOff.png', routeName: 'warehouse-write-off-invoices' },
])

</script>

<template>
    <div class="min-h-full flex flex-col">
        <SectionCards :cards />
    </div>
</template>
