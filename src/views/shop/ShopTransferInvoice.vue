<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
    <Section
        :add-button-name="t('buttons.newTransferInvoice')"
        :section-name="t('cards.transferInvoices')"
        back-route-name="shop"
    >
        <template #sectionBody>
            <p>Body yoziladi</p>
        </template>
    </Section>
</template>
