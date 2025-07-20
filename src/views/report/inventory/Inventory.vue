<script setup>
import Section from "@/components/UI/Section.vue";
import {useI18n} from "vue-i18n";
import {computed, onMounted, ref} from "vue";
import {useInventoryStore} from "@/stores/inventory.js";
import {useRoute} from "vue-router";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import Button from "@/volt/Button.vue";
import NoData from "@/components/UI/NoData.vue";
import Column from "primevue/column";
import DataTable from "@/volt/DataTable.vue";
import PaginatorComponent from "@/components/PaginatorComponent.vue";

const { t } = useI18n();
const route = useRoute()
const isLoading = ref(true)
const inventoryProducts = ref([])
const inventoryKits = ref([])

const inventoryStore = useInventoryStore()

const home = ref({
    icon: 'pi pi-home',
    label: t('reports'),
    route: '/reports'
});

const items = computed(() => [{ label: t('cards.inventories'), route: { name: 'inventories'} }, { label: t('cards.inventory') }]);

onMounted(async () => {
    await inventoryStore.fetchInventory(route.params.id)
    inventoryProducts.value = inventoryStore.getInventory.inventoryProducts
    inventoryKits.value = inventoryStore.getInventory.inventoryKits
    isLoading.value = false

})
</script>

<template>
    <Breadcrumb :home="home" :model="items" class="rounded-md border border-surface-300 dark:border-surface-600/50">
        <template #item="{ item, props }">
            <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom class="group hidden lg:block">
                <a :href="href" v-bind="props.action" @click="navigate">
                    <span class="text-surface-700 dark:text-surface-0 group-hover:text-main dark:group-hover:text-green transition-all">{{ item.label}}</span>
                </a>
            </router-link>
            <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom class="group lg:hidden">
                <a :href="href" v-bind="props.action" @click="navigate">
                    <span class="text-surface-700 dark:text-surface-0 group-hover:text-main dark:group-hover:text-green transition-all">{{ item.route === '/administration' ? '..' : item.label}}</span>
                </a>
            </router-link>
            <a v-else :href="item.url" :target="item.target" v-bind="props.action">
                <span class="text-main dark:text-green font-semibold">{{ item.label }}</span>
            </a>
        </template>
        <template #separator>
            <span>/</span>
        </template>
    </Breadcrumb>

    <Section
        :section-name="t('sections.inventories.edit')"
        back-route-name="inventories"
        without-buttons
    >
        <template #sectionBody>
            <!-- FILTERS OF TABLE ITEMS -->

            <NoData v-if="!inventoryProducts.length && !isLoading" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <Card
                v-else
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        ref="data-table"
                        :value="isLoading ? Array(10).fill({}) : inventoryProducts"
                        :total-records="100"
                        :rows="100"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="location" :header="t('labels.product')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.locationQuantity.product.name }}</p>
                            </template>
                        </Column>
                        <Column field="location" :header="t('labels.color')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.locationQuantity.color ? data.locationQuantity.color.name : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="location" :header="t('labels.expiryDate')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.locationQuantity.expiryDate ? data.locationQuantity.expiryDate : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="location" :header="t('labels.income')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.incomeQty }}</p>
                            </template>
                        </Column>
                        <Column field="status" :header="t('labels.expense')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.expenseQty }}</p>
                            </template>
                        </Column>
                        <Column field="dateFrom" :header="t('cards.writeOffInvoices')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.writeOffQty }}</p>
                            </template>
                        </Column>
                        <Column field="dateTo" :header="t('labels.currentQty')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.currentQty }}</p>
                            </template>
                        </Column>
                        <Column field="responsible" :header="t('labels.factQty')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.factQty }}</p>
                            </template>
                        </Column>
                        <Column field="responsible" :header="t('labels.costPrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.costPrice }}</p>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
