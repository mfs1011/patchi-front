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
    oldInventoryProducts: {
        type: Array,
        default: []
    },
    oldInventoryKits: {
        type: Array,
        default: []
    },
    newInventoryProducts: {
        type: Array,
        default: []
    },
    newInventoryKits: {
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
        <TabPanels pt:root="px-0 pb-0 h-full pt-0">
            <TabPanel
                v-if="tabVal === 'products'"
                value="products"
            >
                <div class="flex gap-2 sm:gap-4">
                    <!-- Old Products -->
                    <div class="w-full mt-4">
                        <DataTable
                            ref="dt"
                            :value="isLoading ? Array(10).fill({}) : oldInventoryProducts"
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
                            <Column field="factQty" :header="t('labels.factQty')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p>{{ formatCurrency(data.factQty) }}</p>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                    <div class="my-auto text-4xl text-surface-700">
                        <svg class="mt-4" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <g fill="none">
                                <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                                <path fill="currentColor" d="m15.06 5.283l5.657 5.657a1.5 1.5 0 0 1 0 2.12l-5.656 5.658a1.5 1.5 0 0 1-2.122-2.122l3.096-3.096H4.5a1.5 1.5 0 0 1 0-3h11.535L12.94 7.404a1.5 1.5 0 0 1 2.122-2.121Z" />
                            </g>
                        </svg>
                    </div>
                    <!-- New Products -->
                    <div class="w-full mt-4">
                        <DataTable
                            ref="dt"
                            :value="isLoading ? Array(10).fill({}) : newInventoryProducts"
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
                            <Column field="factQty" :header="t('labels.factQty')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p>{{ formatCurrency(data.factQty) }}</p>
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <NoData v-if="!newInventoryProducts?.length && !oldInventoryProducts?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                        <p class="text-xl font-normal">{{ t("noResults") }}</p>
                    </NoData>
                </div>
            </TabPanel>

            <TabPanel
                v-if="tabVal === 'kits'"
                value="kits"
            >
                <div class="flex gap-2 sm:gap-4">
                    <!-- Old Kits-->
                    <div v-if="oldInventoryKits.length" class="w-full mt-4">
                        <DataTable
                            ref="dt"
                            :value="isLoading ? Array(10).fill({}) : oldInventoryKits"
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
                            <Column field="factQty" :header="t('labels.factQty')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p>{{ formatCurrency(data.factQty) }}</p>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                    <div
                        v-if="oldInventoryKits.length && oldInventoryKits.length"
                        class="my-auto text-4xl text-surface-700"
                    >
                        <svg class="mt-4" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <g fill="none">
                                <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                                <path fill="currentColor" d="m15.06 5.283l5.657 5.657a1.5 1.5 0 0 1 0 2.12l-5.656 5.658a1.5 1.5 0 0 1-2.122-2.122l3.096-3.096H4.5a1.5 1.5 0 0 1 0-3h11.535L12.94 7.404a1.5 1.5 0 0 1 2.122-2.121Z" />
                            </g>
                        </svg>
                    </div>
                    <!-- New Kits-->
                    <div v-if="newInventoryKits.length" class="w-full mt-4">
                        <DataTable
                            ref="dt"
                            :value="isLoading ? Array(10).fill({}) : newInventoryKits"
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
                            <Column field="factQty" :header="t('labels.factQty')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p>{{ formatCurrency(data.factQty) }}</p>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>

                <NoData v-if="!newInventoryKits?.length && !oldInventoryKits?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full grow w-full">
                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                </NoData>
            </TabPanel>
        </TabPanels>
    </Tabs>
</template>
