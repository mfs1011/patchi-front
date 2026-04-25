<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import SectionCards from "@/components/SectionCards.vue";
import {useUserStore} from "@/stores/user.js";

const { t } = useI18n();
const userStore = useUserStore();

const cards = computed(() => {
    const baseCards = [
        { id: 1, name: t('cards.orderInvoices'), image: 'Order.png', routeName: 'warehouse-order-invoices' },
        { id: 2, name: t('cards.warehouseContent'), image: 'WarehouseQuantity.png', routeName: 'warehouse-content' },
        { id: 3, name: t('cards.incomeInvoices'), image: 'IncomeInvoice.png', routeName: 'warehouse-income-invoices' },
        { id: 4, name: t('cards.transferInvoices'), image: 'TransferInvoice.png', routeName: 'warehouse-transfer-invoices' },
        { id: 5, name: t('cards.returnInvoices'), image: 'Return.png', routeName: 'warehouse-return-invoices' },
        { id: 6, name: t('cards.writeOffInvoices'), image: 'WriteOff.png', routeName: 'warehouse-write-off-invoices' },
    ];

    const roleRestrictions = {
        ROLE_PARTNER: [
            'warehouse-order-invoices',
            'warehouse-transfer-invoices',
            'warehouse-return-invoices',
            'warehouse-write-off-invoices',
        ],

        ROLE_WAREHOUSE_MANAGER: [
            'warehouse-write-off-invoices',
            'warehouse-income-invoices',
        ],
    };

    const restrictedRoutes = roleRestrictions[userStore.getAboutMe.role.name] ?? [];

    return baseCards.filter(
        card => !restrictedRoutes.includes(card.routeName)
    );
});

</script>

<template>
    <div class="min-h-full flex flex-col">
        <SectionCards :cards />
    </div>
</template>
