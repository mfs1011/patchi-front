<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";

const { t } = useI18n();
</script>

<template>
    <Section
        :section-name="t('cards.inventory')"
        back-route-name="reports"
        without-add-button
    >
        <template #sectionBody>
            <p>Body yoziladi</p>
        </template>
    </Section>
</template>
