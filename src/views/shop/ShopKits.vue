<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
    <Section
        :add-button-name="t('buttons.newCollection')"
        :section-name="t('cards.kits')"
        back-route-name="warehouse"
    >
        <template #sectionBody>
            <p>Body yoziladi</p>
        </template>
    </Section>
</template>
