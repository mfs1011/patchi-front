<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import SectionCards from "@/components/SectionCards.vue";
import {useUserStore} from "@/stores/user.js";

const { t } = useI18n();
const userStore = useUserStore();

const cards = computed(() => {
    const baseCards = [
        { id: 1, name: t('cards.inventory'), image: 'SalesReport.png', routeName: 'inventories' },
        { id: 2, name: t('cards.sellerKpi'), image: 'SalesTraffic.png', routeName: 'seller_kpi' },
        { id: 3, name: t('cards.abc'), image: 'TopProducts.png', routeName: 'abc' },
        { id: 4, name: t('cards.residualByDate'), image: 'WarehouseQuantity.png', routeName: 'residual' },
        { id: 5, name: t('labels.sales'), image: 'Order.png', routeName: 'franchise_fee' },
    ];

    const roleRestrictions = {
        ROLE_PARTNER: [
            'inventories',
            'seller_kpi',
            'residual'
        ],
    };

    const restrictedRoutes = roleRestrictions[userStore.getAboutMeFromToken.role] ?? [];

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
