<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import SectionCards from "@/components/SectionCards.vue";
import {useUserStore} from "@/stores/user.js";

const { t } = useI18n();
const userStore = useUserStore();

const cards = computed(() => {
    const baseCards = [
        { id: 1, name: t('cards.orderInvoices'), image: 'Order.png', routeName: 'shop-order-invoices' },
        { id: 2, name: t('cards.shopContent'), image: 'WarehouseQuantity.png', routeName: 'shop-content' },
        { id: 3, name: t('cards.kits'), image: 'Kits.png', routeName: 'kits' },
        { id: 4, name: t('cards.transferInvoices'), image: 'TransferInvoice.png', routeName: 'shop-transfer-invoices' },
        { id: 5, name: t('cards.returnInvoices'), image: 'Return.png', routeName: 'shop-return-invoices' },
    ];

    const roleRestrictions = {
        ROLE_PARTNER: [
            'shop-transfer-invoices',
            'shop-return-invoices',
        ],
        ROLE_COMPOSITION_CREATOR: [
            'shop-order-invoices',
            'shop-content',
            'shop-transfer-invoices',
            'shop-return-invoices'
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
