<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import SectionCards from "@/components/SectionCards.vue";

const { t } = useI18n();

const cards = computed(() => [
    { id: 1, name: t('cards.shopContent'), image: 'WarehouseQuantity.png', routeName: 'shop-content' },
    { id: 2, name: t('cards.kits'), image: 'Kits.png', routeName: 'kits' },
    { id: 3, name: t('cards.transferInvoices'), image: 'TransferInvoice.png', routeName: 'shop-transfer-invoices' },
    { id: 4, name: t('cards.orderInvoices'), image: 'Order.png', routeName: 'shop-order-invoices' },
    { id: 5, name: t('cards.returnInvoices'), image: 'Return.png', routeName: 'shop-return-invoices' },
])

</script>

<template>
    <div class="min-h-full flex flex-col">
        <SectionCards :cards />
    </div>
</template>
