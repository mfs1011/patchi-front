<script setup>
import Skeleton from "@/volt/Skeleton.vue";
import DataTable from "@/volt/DataTable.vue";
import Tab from "@/volt/Tab.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import Column from "primevue/column";
import NoData from "@/components/UI/NoData.vue";
import TabPanels from "@/volt/TabPanels.vue";
import Tabs from "@/volt/Tabs.vue";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {formatCurrency} from "@/helpers/numberFormat.js";

const { t } = useI18n()
const tabVal = ref('products')

const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])

defineProps({
    orderInvoiceProducts: {
        type: Array,
        default: []
    },
    orderInvoiceKits: {
        type: Array,
        default: []
    },
    isLoading: {
        type: Boolean,
        default: false
    }
})
</script>

<template>
    <Tabs v-model:value="tabVal" scrollable :showNavigators="false">
        <TabList>
            <Tab pt:root="font-medium dark:text-surface-0" v-for="tab of tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
        </TabList>
        <TabPanels pt:root="px-0 pb-0">
            <TabPanel
                class="h-full flex"
                v-if="tabVal === 'products'"
                value="products"
            >
                <DataTable
                    ref="dt"
                    :value="isLoading ? Array(10).fill({}) : orderInvoiceProducts"
                    scrollable
                    pt:footer="border-none dark:bg-surface-800"
                    pt:root="border border-surface-300 dark:border-surface-600/50"
                    pt:bodyRow="last:border-b-none"
                >
                    <Column field="id" :header="t('labels.id')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.id }}</p>
                        </template>
                    </Column>
                    <Column field="name" :header="t('labels.title')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.name }}</p>
                        </template>
                    </Column>
                    <Column field="code" :header="t('labels.code')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.code }}</p>
                        </template>
                    </Column>
                    <Column field="qr" :header="t('labels.qr')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.qr || '-' }}</p>
                        </template>
                    </Column>
                    <Column field="color" :header="t('labels.color')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.color.name || '-' }}</p>
                        </template>
                    </Column>
                    <Column field="qty" :header="t('labels.qty')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.qty) }}</p>
                        </template>
                    </Column>
                    <Column field="price" :header="t('labels.price')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.price) }}</p>
                        </template>
                    </Column>
                </DataTable>

                <NoData v-if="!orderInvoiceProducts?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                </NoData>
            </TabPanel>

            <TabPanel
                class="h-full flex"
                v-if="tabVal === 'kits'"
                value="kits"
            >
                <DataTable
                    ref="dt"
                    :value="isLoading ? Array(10).fill({}) : orderInvoiceKits"
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
                    <Column field="name" :header="t('labels.title')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.kit.name }}</p>
                        </template>
                    </Column>
                    <Column field="code" :header="t('labels.code')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.kit.code }}</p>
                        </template>
                    </Column>
                    <Column field="qr" :header="t('labels.qr')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.kit.qr || '-' }}</p>
                        </template>
                    </Column>
                    <Column field="qty" :header="t('labels.qty')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.qty) }}</p>
                        </template>
                    </Column>
                    <Column field="price" :header="t('labels.price')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.price) }}</p>
                        </template>
                    </Column>
                </DataTable>

                <NoData v-if="!orderInvoiceKits?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                </NoData>
            </TabPanel>
        </TabPanels>
    </Tabs>
</template>
