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
import {formatCurrency, getFormattedDate} from "@/helpers/numberFormat.js";

const { t } = useI18n()
const tabVal = ref('products')

const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])

defineProps({
    isLoading: {
        type: Boolean,
        default: false
    },
    added: {
        type: Object,
        required: true
    },
    entityType: {
        type: String,
        required: true
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
                class="h-full"
                v-if="tabVal === 'products'"
                value="products"
            >
                <DataTable
                    ref="dt"
                    :value="isLoading ? Array(10).fill({}) : added.selectedAddedProducts.value"
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
                            <p v-else>{{ data.locationQuantity?.product.name }}</p>
                        </template>
                    </Column>
                    <Column field="code" :header="t('labels.code')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantity?.product.code }}</p>
                        </template>
                    </Column>
                    <Column field="color" :header="t('labels.color')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantity?.color ? data.locationQuantity.color.name : '-' }}</p>
                        </template>
                    </Column>
                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantity?.expiryDate ? getFormattedDate(data.locationQuantity.expiryDate) : '-' }}</p>
                        </template>
                    </Column>
                    <Column field="initial" :header="t('labels.initial')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.initialQty) }} {{ t(`labels.${data.locationQuantity?.product?.category?.unit?.name}`) }}</p>
                        </template>
                    </Column>
                    <Column field="income" :header="t('labels.income')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.incomeQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column field="expense" :header="t('labels.expense')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.expenseQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column field="writeOffInvoices" :header="t('cards.writeOffInvoices')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.writeOffQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column field="currentQty" :header="t('labels.currentQty')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.currentQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column field="price" :header="t('labels.price')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                        </template>
                    </Column>
                    <Column field="currentPrice" :header="t('labels.currentPrice')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice * data.currentQty) }}$</p>
                        </template>
                    </Column>
                    <Column field="forTheKit" :header="t('labels.forTheKit')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.kitProductQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column field="totalFact" :header="t('labels.totalFact')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.factQty + data.kitProductQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                </DataTable>

                <NoData v-if="!added.selectedAddedProducts.value?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                </NoData>
            </TabPanel>

            <TabPanel
                class="h-full"
                v-if="tabVal === 'kits'"
                value="kits"
            >
                <DataTable
                    ref="dt"
                    :value="isLoading ? Array(10).fill({}) : added.selectedAddedKits.value"
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
                            <p v-else>{{ data.locationQuantityKit?.kit.name }}</p>
                        </template>
                    </Column>
                    <Column field="code" :header="t('labels.code')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantityKit?.kit.code }}</p>
                        </template>
                    </Column>
                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantityKit?.expiryDate ? getFormattedDate(data.locationQuantityKit?.expiryDate) : '-' }}</p>
                        </template>
                    </Column>
                    <Column field="income" :header="t('labels.initial')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.initialQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column field="income" :header="t('labels.income')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.incomeQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column field="expense" :header="t('labels.expense')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.expenseQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column field="writeOffInvoices" :header="t('cards.writeOffInvoices')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.writeOffQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column field="currentQty" :header="t('labels.currentQty')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.currentQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column field="price" :header="t('labels.price')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                        </template>
                    </Column>
                    <Column field="currentPrice" :header="t('labels.currentPrice')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice * data.currentQty) }}$</p>
                        </template>
                    </Column>
                </DataTable>

                <NoData v-if="!added.selectedAddedKits.value?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                </NoData>
            </TabPanel>
        </TabPanels>
    </Tabs>
</template>
