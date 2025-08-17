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
    refs: {
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
                v-if="tabVal === 'products'"
                value="products"
            >
                <NoData
                    v-if="!refs.selectedAddedProducts?.value?.length &&
                    !refs.selectedRemovedProducts?.value?.length &&
                    !refs.selectedNewChangedProducts?.value?.length &&
                    !refs.selectedOldChangedProducts?.value?.length &&
                    !isLoading"
                    class="text-surface-400 mx-auto my-auto h-full"
                >
                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                </NoData>

                <DataTable
                    v-if="isLoading || refs.selectedAddedProducts?.value?.length > 0"
                    ref="dt"
                    :value="isLoading ? Array(10).fill({}) : refs.selectedAddedProducts.value"
                    scrollable
                    pt:footer="border-none dark:bg-surface-800"
                    pt:root="border border-surface-300 dark:border-surface-600/50"
                    pt:bodyRow="last:border-b-none"
                >
                    <p class="text-lg font-medium text-teal-500">
                        {{ t(`labels.created`) }}
                    </p>

                    <Column field="id" :header="t('labels.id')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.id }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="name" :header="t('labels.title')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantity?.product.name }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="name" :header="t('labels.title')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.name }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="code" :header="t('labels.code')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantity?.product.code }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="code" :header="t('labels.code')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.code }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="color" :header="t('labels.color')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantity?.color ? data.locationQuantity.color.name : '-' }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="color" :header="t('labels.color')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.color ? data.color.name : '-' }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="category" :header="t('labels.category')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.category.name }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="type" :header="t('labels.type')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.category.categoryType.name }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="expiryDate" :header="t('labels.expiryDate')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantity?.expiryDate ? getFormattedDate(data.locationQuantity.expiryDate) : '-' }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="expiryDate" :header="t('labels.expiryDate')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.expiryDate ? getFormattedDate(data.expiryDate) : '-' }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="initial" :header="t('labels.initial')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.initialQty) }} {{ t(`labels.${data.locationQuantity?.product?.category?.unit?.name}`) }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="amount" :header="t('labels.amount')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.qty) }} {{ t(`labels.${data.product?.category?.unit?.name}`) }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="income" :header="t('labels.income')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.incomeQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="expense" :header="t('labels.expense')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.expenseQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="writeOffInvoices" :header="t('cards.writeOffInvoices')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.writeOffQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="currentQty" :header="t('labels.currentQty')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.currentQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="price" :header="t('labels.price')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="price" :header="t('labels.price')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.price) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="transportationFee" :header="t('labels.transportationFee')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.transportationFee) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="customsFee" :header="t('labels.customsFee')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.customsFee) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="costPrice" :header="t('labels.costPrice')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="currentPrice" :header="t('labels.currentPrice')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice * data.currentQty) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="forTheKit" :header="t('labels.forTheKit')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.kitProductQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="totalFact" :header="t('labels.totalFact')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.factQty + data.kitProductQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}</p>
                        </template>
                    </Column>
                </DataTable>

                <DataTable
                    class="mt-4"
                    v-if="isLoading || refs.selectedRemovedProducts?.value?.length > 0"
                    ref="dt"
                    :value="isLoading ? Array(10).fill({}) : refs.selectedRemovedProducts.value"
                    scrollable
                    pt:footer="border-none dark:bg-surface-800"
                    pt:root="border border-surface-300 dark:border-surface-600/50"
                    pt:bodyRow="last:border-b-none"
                >
                    <p class="text-lg font-medium text-red-500">
                        {{ t(`labels.deleted`) }}
                    </p>

                    <Column field="id" :header="t('labels.id')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.id }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="name" :header="t('labels.title')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.name }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="code" :header="t('labels.code')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.code }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="color" :header="t('labels.color')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.color ? data.color.name : '-' }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="category" :header="t('labels.category')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.category.name }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="type" :header="t('labels.type')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.product.category.categoryType.name }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="expiryDate" :header="t('labels.expiryDate')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.expiryDate ? getFormattedDate(data.expiryDate) : '-' }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="amount" :header="t('labels.amount')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.qty) }} {{ t(`labels.${data.product?.category?.unit?.name}`) }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="price" :header="t('labels.price')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.price) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="transportationFee" :header="t('labels.transportationFee')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.transportationFee) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="customsFee" :header="t('labels.customsFee')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.customsFee) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'IncomeInvoice'" field="costPrice" :header="t('labels.costPrice')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                        </template>
                    </Column>
                </DataTable>

                <div class="flex gap-2 sm:gap-4">
                    <!-- Old Products -->
                    <div class="w-full mt-4">
                        <DataTable
                            v-if="isLoading || refs.selectedOldChangedProducts?.value?.length > 0"
                            ref="dt"
                            :value="isLoading ? Array(10).fill({}) : refs.selectedOldChangedProducts.value"
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
                            <Column v-if="entityType === 'Inventory'" field="factQty" :header="t('labels.factQty')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p>{{ formatCurrency(data.factQty) }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="product" :header="t('labels.product')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.product">{{ data.product.name }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="color" :header="t('labels.color')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.color">{{ data.color.name }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="expiryDate" :header="t('labels.expiryDate')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.expiryDate">{{ getFormattedDate(data.expiryDate) }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="amount" :header="t('labels.amount')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.qty">{{ formatCurrency(data.qty) }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="price" :header="t('labels.price')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.price">{{ formatCurrency(data.price) }}$</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="transportationFee" :header="t('labels.transportationFee')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.transportationFee">{{ formatCurrency(data.transportationFee) }}$</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="customsFee" :header="t('labels.customsFee')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.customsFee">{{ formatCurrency(data.customsFee) }}$</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="costPrice" :header="t('labels.costPrice')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.costPrice">{{ formatCurrency(data.costPrice) }}$</p>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                    <div
                        v-if="refs.selectedOldChangedProducts?.value?.length && refs.selectedNewChangedProducts?.value?.length"
                        class="my-auto text-4xl text-surface-700"
                    >
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
                            v-if="isLoading || refs.selectedNewChangedProducts?.value?.length > 0"
                            ref="dt"
                            :value="isLoading ? Array(10).fill({}) : refs.selectedNewChangedProducts.value"
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
                            <Column v-if="entityType === 'Inventory'" field="factQty" :header="t('labels.factQty')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p>{{ formatCurrency(data.factQty) }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="product" :header="t('labels.product')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.product">{{ data.product.name }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="color" :header="t('labels.color')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.color">{{ data.color.name }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="expiryDate" :header="t('labels.expiryDate')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.expiryDate">{{ getFormattedDate(data.expiryDate) }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="amount" :header="t('labels.amount')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.qty">{{ formatCurrency(data.qty) }}</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="price" :header="t('labels.price')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.price">{{ formatCurrency(data.price) }}$</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="transportationFee" :header="t('labels.transportationFee')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.transportationFee">{{ formatCurrency(data.transportationFee) }}$</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="customsFee" :header="t('labels.customsFee')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.customsFee">{{ formatCurrency(data.customsFee) }}$</p>
                                </template>
                            </Column>
                            <Column v-if="entityType === 'IncomeInvoice'" field="costPrice" :header="t('labels.costPrice')">
                                <template #body="{ data }">
                                    <Skeleton height="2rem" v-if="isLoading"/>
                                    <p v-if="data.costPrice">{{ formatCurrency(data.costPrice) }}$</p>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </TabPanel>

            <TabPanel
                class="h-full"
                v-if="tabVal === 'kits'"
                value="kits"
            >
                <NoData
                    v-if="!refs.selectedAddedKits?.value?.length &&
                    !refs.selectedRemovedKits?.value?.length &&
                    !refs.selectedNewChangedKits?.value?.length &&
                    !refs.selectedOldChangedKits?.value?.length &&
                    !isLoading"
                    class="text-surface-400 mx-auto my-auto h-full"
                >
                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                </NoData>

                <DataTable
                    v-if="isLoading || refs.selectedAddedKits?.value?.length > 0"
                    ref="dt"
                    :value="isLoading ? Array(10).fill({}) : refs.selectedAddedKits.value"
                    scrollable
                    pt:footer="border-none dark:bg-surface-800"
                    pt:root="border border-surface-300 dark:border-surface-600/50"
                >
                    <p class="text-lg font-medium text-teal-500">
                        {{ t(`labels.created`) }}
                    </p>

                    <Column v-if="entityType === 'Inventory'" field="id" :header="t('labels.id')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.id }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="name" :header="t('labels.title')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantityKit?.kit.name }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="code" :header="t('labels.code')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantityKit?.kit.code }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="expiryDate" :header="t('labels.expiryDate')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ data.locationQuantityKit?.expiryDate ? getFormattedDate(data.locationQuantityKit?.expiryDate) : '-' }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="income" :header="t('labels.initial')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.initialQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="income" :header="t('labels.income')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.incomeQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="expense" :header="t('labels.expense')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.expenseQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="writeOffInvoices" :header="t('cards.writeOffInvoices')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.writeOffQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="currentQty" :header="t('labels.currentQty')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.currentQty) }} {{ t('labels.pcs') }}</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="price" :header="t('labels.price')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                        </template>
                    </Column>
                    <Column v-if="entityType === 'Inventory'" field="currentPrice" :header="t('labels.currentPrice')">
                        <template #body="{ data }">
                            <Skeleton height="2rem" v-if="isLoading"/>
                            <p v-else>{{ formatCurrency(data.costPrice * data.currentQty) }}$</p>
                        </template>
                    </Column>
                </DataTable>

                <DataTable
                    v-if="isLoading || refs.selectedRemovedKits?.value?.length > 0"
                    ref="dt"
                    :value="isLoading ? Array(10).fill({}) : refs.selectedRemovedKits?.value"
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

                <div class="flex gap-2 sm:gap-4">
                    <!-- Old Kits-->
                    <div class="w-full mt-4">
                        <DataTable
                            v-if="refs.selectedOldChangedKits?.value?.length"
                            ref="dt"
                            :value="isLoading ? Array(10).fill({}) : refs.selectedOldChangedKits.value"
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
                        v-if="refs.selectedOldChangedKits?.value?.length && refs.selectedNewChangedKits?.value?.length"
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
                    <div class="w-full mt-4">
                        <DataTable
                            v-if="refs.selectedNewChangedKits?.value?.length"
                            ref="dt"
                            :value="isLoading ? Array(10).fill({}) : refs.selectedNewChangedKits.value.length"
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
            </TabPanel>
        </TabPanels>
    </Tabs>
</template>
