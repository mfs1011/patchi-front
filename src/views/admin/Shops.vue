<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";

const { t } = useI18n();
</script>

<template>
    <Section
        :add-button-name="t('buttons.newShop')"
        :section-name="t('cards.shops')"
        back-route-name="administration"
    >
        <template #sectionBody>
            <p>Body yoziladi</p>
        </template>
    </Section>
</template>
