<script setup>
import Section from "@/components/UI/Section.vue";
import {useI18n} from "vue-i18n";
import {onMounted, ref} from "vue";
import {useInventoryStore} from "@/stores/inventory.js";
import {useRoute} from "vue-router";

const { t } = useI18n();
const route = useRoute()
const isLoading = ref(true)

const inventoryStore = useInventoryStore()

onMounted(async () => {
    await inventoryStore.fetchInventory(route.params.id)
    isLoading.value = true

})
</script>

<template>
    <Section
        :section-name="t('sections.inventories.edit')"
        back-route-name="inventories"
        without-buttons
    >
        <template #sectionBody>
            <p>Ikkita tugma bo'ladi. Products va kits. Qaysini bossa o'shani listini ko'rsatadi.Default products list.</p>

            <p v-if="isLoading">{{ inventoryStore.getInventory.inventoryProducts }}</p>
        </template>
    </Section>
</template>
