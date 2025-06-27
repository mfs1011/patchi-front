<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import SectionCards from "@/components/SectionCards.vue";

const { t } = useI18n();

const cards = computed(() => [
    { id: 1, name: t('cards.salesReports'), image: 'SalesReport.png', routeName: 'sales-report' },
])

</script>

<template>
    <div class="min-h-full flex flex-col">
        <SectionCards :cards />
    </div>
</template>
