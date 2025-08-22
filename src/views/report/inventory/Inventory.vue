<script setup>
import Section from "@/components/UI/Section.vue";
import {useI18n} from "vue-i18n";
import {computed, onMounted, ref} from "vue";
import {useInventoryStore} from "@/stores/inventory.js";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import NoData from "@/components/UI/NoData.vue";
import Column from "primevue/column";
import ColumnGroup from 'primevue/columngroup';
import Row from "primevue/row"
import DataTable from "@/volt/DataTable.vue";
import {formatCurrency, getFormattedDate, getFormattedDateWithTime} from "@/helpers/numberFormat.js";
import Button from "@/volt/Button.vue";
import Tab from "@/volt/Tab.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import TabPanels from "@/volt/TabPanels.vue";
import Tabs from "@/volt/Tabs.vue";
import InputNumber from "@/volt/InputNumber.vue";
import Dialog from "@/volt/Dialog.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {STATUSES} from "@/helpers/constants.js";
import {useToast} from "primevue/usetoast";

const { t } = useI18n();
const toast = useToast();
const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const isLoadingEdit = ref(false)
const inventoryProducts = ref([])
const inventoryKits = ref([])
const tabVal = ref('products')
const showLeaveDialog = ref(false)
const isConfirmLoading = ref(false)
const pendingNavigation = ref(false)
const isSaved = ref(false)

const inventoryStore = useInventoryStore()

const home = ref({
    icon: 'pi pi-home',
    label: t('reports'),
    route: '/reports'
});

const dt = ref();
const exportCSV = () => {
    dt.value.exportCSV();
};

const items = computed(() => [{ label: t('cards.inventories'), route: { name: 'inventories'} }, { label: t('cards.inventory') }]);
const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])

const changedInventoryProducts = computed(() =>
    inventoryProducts.value
        .filter(p => inventoryStore.getInventory.inventoryProducts.find(x => x.id === p.id)?.factQty !== p.factQty)
        .map(p => ({
            inventoryProduct: p['@id'],
            factQty: p.factQty
        }))
);

const changedInventoryKits = computed(() =>
    inventoryKits.value
        .filter(p => inventoryStore.getInventory.inventoryKits.find(x => x.id === p.id)?.factQty !== p.factQty)
        .map(p => ({
            inventoryKit: p['@id'],
            factQty: p.factQty
        }))
);

const totalProductCurrentPrice = computed(() => inventoryProducts.value.reduce((total, current) => total + (current.costPrice * current.currentQty), 0))
const totalProductFactPrice = computed(() => inventoryProducts.value.reduce((total, current) => total + (current.costPrice * current.factQty), 0))
const totalKitCurrentPrice = computed(() => inventoryKits.value.reduce((total, current) => total + (current.costPrice * current.currentQty), 0))
const totalKitFactPrice = computed(() => inventoryKits.value.reduce((total, current) => total + (current.costPrice * current.factQty), 0))

const totalNegativeDifference = computed(() => {
    return inventoryProducts.value.reduce((sum, current) => {
        const factSum = current.costPrice * current.factQty
        if (factSum <= 0) return sum

        const diff = factSum - (current.costPrice * current.currentQty)
        return diff < 0 ? sum + diff : sum
    }, 0)
})

const totalPositiveDifference = computed(() => {
    return inventoryProducts.value.reduce((sum, current) => {
        const factSum = current.costPrice * current.factQty
        if (factSum <= 0) return sum

        const diff = factSum - (current.costPrice * current.currentQty)
        return diff > 0 ? sum + diff : sum
    }, 0)
})

const totalProductDifferencePrice = computed(() => {
    return totalNegativeDifference.value + totalPositiveDifference.value
})

const totalKitNegativeDifference = computed(() => {
    return inventoryKits.value.reduce((sum, current) => {
        const factSum = current.costPrice * current.factQty
        if (factSum <= 0) return sum

        const diff = factSum - (current.costPrice * current.currentQty)
        return diff < 0 ? sum + diff : sum
    }, 0)
})

const totalKitPositiveDifference = computed(() => {
    return inventoryKits.value.reduce((sum, current) => {
        const factSum = current.costPrice * current.factQty
        if (factSum <= 0) return sum

        const diff = factSum - (current.costPrice * current.currentQty)
        return diff > 0 ? sum + diff : sum
    }, 0)
})

const totalKitDifferencePrice = computed(() => {
    return totalKitNegativeDifference.value + totalKitPositiveDifference.value
})

const rowClassProducts = (row) => {
    return !(row?.factQty !== inventoryStore.getInventory?.inventoryProducts.find(x => x.id === row?.id)?.factQty)
        ? ''
        : 'bg-surface-100/50 dark:bg-surface-900/50!';
};
const rowClassKits = (row) => {
    return !(row?.factQty !== inventoryStore.getInventory?.inventoryKits.find(x => x.id === row?.id)?.factQty)
        ? ''
        : 'bg-surface-100/50 dark:bg-surface-900/50!';
};

onMounted(async () => {
    await inventoryStore.fetchInventory(route.params.id)
    inventoryProducts.value = JSON.parse(JSON.stringify(inventoryStore.getInventory.inventoryProducts))
    inventoryKits.value = JSON.parse(JSON.stringify(inventoryStore.getInventory.inventoryKits))
    isLoading.value = false
})

onBeforeRouteLeave((to, from, next) => {
    if ((changedInventoryProducts.value.length || changedInventoryKits.value.length) && !isSaved.value) {
        showLeaveDialog.value = true
        pendingNavigation.value = next
    } else {
        next()
    }
})

const confirmLeave = () => {
    showLeaveDialog.value = false
    if (pendingNavigation.value) {
        pendingNavigation.value()
    }
}

const pushChanges = async () => {
    try {
        isLoadingEdit.value = true
        const payload = {};

        if (changedInventoryProducts.value.length) {
            payload.inventoryProducts = changedInventoryProducts.value
        }

        if (changedInventoryKits.value.length) {
            payload.inventoryKits = changedInventoryKits.value
        }

        await inventoryStore.putInventory(payload, route.params.id)

        toast.add({ severity: 'success', summary: t('toast.edited', { name: t('data.nominativeCapitalize') }), life: 3000 })
        isSaved.value = true
        router.back()
    } catch (err) {
        console.log(err)
    } finally {
        isLoadingEdit.value = false
    }
}
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
        :section-name="t('cards.inventory')"
        back-route-name="inventories"
        without-buttons
    >
        <template #sectionBody>
            <Card
                pt:root="grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="h-full grow flex flex-col p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
<!--                <template #header>-->
<!--                    <div class="pt-5 px-5">-->
<!--                        <Button-->
<!--                            @click="exportCSV"-->
<!--                            icon="pi pi-file-excel"-->
<!--                            pt:root="bg-teal-500 dark:bg-teal-500 enabled:hover:bg-teal-400 dark:enabled:hover:bg-teal-400 border-teal-500 dark:border-teal-500 enabled:hover:border-teal-400 dark:enabled:hover:border-teal-400 focus-visible:outline-teal-500 dark:focus-visible:outline-teal-500"-->
<!--                            size="small"-->
<!--                            label="Export"-->
<!--                        />-->
<!--                    </div>-->
<!--                </template>-->
                <template #content>
                    <Skeleton height="2rem" v-if="isLoading"/>
                    <div class="row g-2" v-else>
                        <div class="col-12 col-md-6 col-lg-3">
                            <span>{{ t('labels.id') }}: {{ inventoryStore.getInventory.id }}</span>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <span>{{ t('labels.locations') }}: {{ inventoryStore.getInventory.location.name }}</span>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <span>{{ t('labels.dateFrom') }}: {{ getFormattedDateWithTime(inventoryStore.getInventory.dateFrom) }}</span>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <span>{{ t('labels.dateTo') }}: {{ getFormattedDateWithTime(inventoryStore.getInventory.dateTo) }}</span>
                        </div>
                    </div>

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
                                <NoData v-if="!inventoryProducts?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-if="isLoading || inventoryProducts?.length > 0"
                                    :rowClass="rowClassProducts"
                                    ref="dt"
                                    :value="isLoading ? Array(10).fill({}) : inventoryProducts"
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
                                    <Column field="name" :header="t('labels.name')">
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
                                    <Column field="factQty" :header="t('labels.factQty')">
                                        <template #body="{ data, index }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else-if="inventoryStore.getInventory.status !== STATUSES.WAITING">{{ formatCurrency(data.factQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                                            <InputNumber
                                                v-else
                                                fluid
                                                :suffix="` ${t(`labels.${data.locationQuantity.product.category.unit.name}`)}`"
                                                v-model.number="inventoryProducts[index].factQty"
                                                :placeholder="t('placeholders.qty')"
                                                class="min-w-26!"
                                                :min="0"
                                                :minFractionDigits="1"
                                                :maxFractionDigits="2"
                                            />
                                        </template>
                                    </Column>
                                    <Column field="costPrice" :header="t('labels.costPrice')">
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
                                    <Column field="factPrice" :header="t('labels.factPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(data.costPrice * data.factQty) }}$</p>
                                        </template>
                                    </Column>
                                    <Column field="difference" :header="t('labels.difference')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <div v-else>
                                                <p
                                                    v-if="data.factQty"
                                                    :class="{
                                                    'text-green-600': (data.costPrice * data.factQty) - (data.costPrice * data.currentQty) >= 0,
                                                    'text-red-600': (data.costPrice * data.factQty) - (data.costPrice * data.currentQty) < 0
                                                }"
                                                >
                                                    {{ formatCurrency((data.costPrice * data.factQty) - (data.costPrice * data.currentQty)) }}$
                                                </p>
                                                <p v-else>-</p>
                                            </div>
                                        </template>
                                    </Column>
                                    <Column field="differenceUnit" :header="t('labels.differenceUnit')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <div v-else>
                                                <p
                                                    v-if="data.factQty"
                                                    :class="{
                                                    'text-green-600': data.factQty - data.currentQty >= 0,
                                                    'text-red-600': data.factQty - data.currentQty < 0
                                                }"
                                                >
                                                    {{ formatCurrency(data.factQty - data.currentQty) }} {{ t(`labels.${data.locationQuantity?.product.category.unit.name}`) }}
                                                </p>
                                                <p v-else>-</p>
                                            </div>
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

                                    <ColumnGroup type="footer">
                                        <Row>
                                            <Column :colspan="12" footerStyle="text-align:right">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold">{{ t('labels.totals') }}:</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(totalProductCurrentPrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(totalProductFactPrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(totalProductDifferencePrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold text-red-600">{{ formatCurrency(totalNegativeDifference) }}$</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold text-green-600">{{ formatCurrency(totalPositiveDifference) }}$</p>
                                                </template>
                                            </Column>
                                        </Row>
                                    </ColumnGroup>

                                    <template v-if="changedInventoryProducts.length || changedInventoryKits.length" #footer>
                                        <div>
                                            <Button
                                                class="px-2! sm:px-5! whitespace-nowrap"
                                                icon="pi pi-save"
                                                :label="t('buttons.saveAndExit')"
                                                @click="pushChanges"
                                                :loading="isLoadingEdit"
                                                :disabled="isLoadingEdit"
                                            />
                                        </div>
                                    </template>
                                </DataTable>
                            </TabPanel>

                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'kits'"
                                value="kits"
                            >
                                <NoData v-if="!inventoryKits?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-if="isLoading || inventoryKits?.length > 0"
                                    :rowClass="rowClassKits"
                                    ref="dt"
                                    :value="isLoading ? Array(10).fill({}) : inventoryKits"
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
                                    <Column field="name" :header="t('labels.name')">
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
                                    <Column field="factQty" :header="t('labels.factQty')">
                                        <template #body="{ data, index }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else-if="inventoryStore.getInventory.status !== STATUSES.WAITING">{{ formatCurrency(data.factQty) }} {{ t(`labels.pcs`) }}</p>
                                            <InputNumber
                                                v-else
                                                fluid
                                                :suffix="` ${t('labels.pcs')}`"
                                                v-model.number="inventoryKits[index].factQty"
                                                :placeholder="t('placeholders.kpiPercent')"
                                                class="min-w-26!"
                                                :min="0"
                                                :minFractionDigits="1"
                                                :maxFractionDigits="2"
                                            />
                                        </template>
                                    </Column>
                                    <Column field="costPrice" :header="t('labels.costPrice')">
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
                                    <Column field="factPrice" :header="t('labels.factPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(data.costPrice * data.factQty) }}$</p>
                                        </template>
                                    </Column>
                                    <Column field="difference" :header="t('labels.difference')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <div v-else>
                                                <p
                                                    v-if="data.factQty"
                                                    :class="{
                                                    'text-green-600': (data.costPrice * data.factQty) - (data.costPrice * data.currentQty) >= 0,
                                                    'text-red-600': (data.costPrice * data.factQty) - (data.costPrice * data.currentQty) < 0
                                                }"
                                                >
                                                    {{ formatCurrency((data.costPrice * data.factQty) - (data.costPrice * data.currentQty)) }}$
                                                </p>
                                                <p v-else>-</p>
                                            </div>
                                        </template>
                                    </Column>
                                    <Column field="differenceUnit" :header="t('labels.differenceUnit')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <div v-else>
                                                <p
                                                    v-if="data.factQty"
                                                    :class="{
                                                    'text-green-600': data.factQty - data.currentQty >= 0,
                                                    'text-red-600': data.factQty - data.currentQty < 0
                                                }"
                                                >
                                                    {{ formatCurrency(data.factQty - data.currentQty) }} {{ t('labels.pcs') }}
                                                </p>
                                                <p v-else>-</p>
                                            </div>
                                        </template>
                                    </Column>
                                    <Column field="details" style="width: 60px;">  <!-- Fixed width for the column -->
                                        <template #header>
                                            <p class="font-semibold">{{ t('details') }}</p>
                                        </template>
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <div v-else>
                                                <div class="flex justify-center w-full">
                                                    <Button
                                                        @click="router.push({
                                                            name: 'kit',
                                                            params: { id: data.locationQuantityKit?.kit.id },
                                                        })"
                                                        icon="pi pi-eye"
                                                        pt:root="rounded-full size-8! min-w-8! h-8! bg-blue-400 dark:bg-blue-400 enabled:hover:bg-blue-300 dark:enabled:hover:bg-blue-300 border-blue-400 dark:border-blue-400 enabled:hover:border-blue-300 dark:enabled:hover:border-blue-300 focus-visible:outline-blue-400 dark:focus-visible:outline-blue-400"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>

                                    <ColumnGroup type="footer">
                                        <Row>
                                            <Column :colspan="11" footerStyle="text-align:right">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold">{{ t('labels.totals') }}:</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(totalKitCurrentPrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(totalKitFactPrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(totalKitDifferencePrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold text-red-600">{{ formatCurrency(totalKitNegativeDifference) }}$</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="isLoading"/>
                                                    <p v-else class="font-semibold text-green-600">{{ formatCurrency(totalKitPositiveDifference) }}$</p>
                                                </template>
                                            </Column>
                                        </Row>
                                    </ColumnGroup>

                                    <template v-if="changedInventoryKits.length || changedInventoryProducts.length" #footer>
                                        <div>
                                            <Button
                                                class="px-2! sm:px-5! whitespace-nowrap"
                                                icon="pi pi-save"
                                                :label="t('buttons.saveAndExit')"
                                                @click="pushChanges"
                                                :loading="isLoadingEdit"
                                                :disabled="isLoadingEdit"
                                            />
                                        </div>
                                    </template>
                                </DataTable>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
            <!-- CANCEL CHANGES BEFORE LEAVE CURRENT ROUTE DIALOG -->
            <Dialog
                v-model:visible="showLeaveDialog"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
            <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                {{ t('dialog.leaveFromEditMessage') }}
            </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton type="button" :label="t('dialog.cancel')" @click="showLeaveDialog = false" />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="confirmLeave"
                            class="px-5"
                            :loading="isConfirmLoading"
                        />
                    </div>
                </template>
            </Dialog>
        </template>
    </Section>
</template>
