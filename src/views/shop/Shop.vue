<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import SectionCards from "@/components/SectionCards.vue";

const { t } = useI18n();

const cards = computed(() => [
    { id: 1, name: t('cards.productsInStock'), image: 'WarehouseQuantity.png', routeName: 'shop-products-in-stock' },
    { id: 3, name: t('cards.transferInvoices'), image: 'TransferInvoice.png', routeName: 'shop-transfer-invoices' },
    { id: 4, name: t('cards.orders'), image: 'Order.png', routeName: 'shop-orders' },
    { id: 5, name: t('cards.returnInvoices'), image: 'Return.png', routeName: 'shop-return-invoices' },
    { id: 6, name: t('cards.writeOffInvoices'), image: 'WriteOff.png', routeName: 'shop-write-off-invoices' },
])

</script>

<template>
    <div class="min-h-full flex flex-col">
        <SectionCards :cards />
    </div>
</template>
