<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import DataTable from "@/volt/DataTable.vue";
import Button from "@/volt/Button.vue";
import NoData from "@/components/UI/NoData.vue";
import Card from "@/volt/Card.vue";
import Column from "primevue/column";
import Skeleton from "@/volt/Skeleton.vue";
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import {formatCurrency, getFormattedDate, getFormattedDateWithTime} from "@/helpers/numberFormat.js";
import updateQuery from "@/helpers/updateQuery.js";
import DatePicker from "@/volt/DatePicker.vue";
import {useLogStore} from "@/stores/log.js";
import {formatPhoneByCountry} from "@/helpers/phoneFormat.js";
import Select from "@/volt/Select.vue";
import Dialog from "@/volt/Dialog.vue";
import LogDetails from "@/components/LogDetails.vue";
import InputText from "@/volt/InputText.vue";
import {useUserStore} from "@/stores/user.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const isVisibleSectionHeader = ref(false);
const visible = ref({
    detailVisible: false
});

const refs = ref({})
const currentLogData = ref()
const isLoading = ref(false)
const selectedEntityType = ref('')

const logStore = useLogStore()
const userStore = useUserStore()

const elements = computed(() => [
    {id: 1, name: t('labels.Notification'), value: 'Notification'},
    {id: 2, name: t('labels.User'), value: 'User'},
    {id: 3, name: t('labels.Seller'), value: 'Seller'},
    {id: 4, name: t('labels.Customer'), value: 'Customer'},
    {id: 5, name: t('labels.Supplier'), value: 'Supplier'},
    {id: 6, name: t('labels.Product'), value: 'Product'},
    {id: 7, name: t('labels.Location'), value: 'Location'},
    {id: 8, name: t('labels.Category'), value: 'Category'},
    {id: 9, name: t('labels.Color'), value: 'Color'},
    {id: 10, name: t('labels.OrderKpiPercent'), value: 'OrderKpiPercent'},
    {id: 11, name: t('labels.KitKpiPercent'), value: 'KitKpiPercent'},
    {id: 12, name: t('labels.CategoryKpiPercent'), value: 'CategoryKpiPercent'},
    {id: 13, name: t('labels.Payment'), value: 'Payment'},
    {id: 14, name: t('labels.Assembly'), value: 'Assembly'},
    {id: 15, name: t('labels.Inventory'), value: 'Inventory'},
    {id: 16, name: t('labels.OrderInvoice'), value: 'OrderInvoice'},
    {id: 17, name: t('labels.IncomeInvoice'), value: 'IncomeInvoice'},
    {id: 18, name: t('labels.Kit'), value: 'Kit'},
    {id: 19, name: t('labels.TransferInvoice'), value: 'TransferInvoice'},
    {id: 20, name: t('labels.ReturnInvoice'), value: 'ReturnInvoice'},
    {id: 21, name: t('labels.WriteOffInvoice'), value: 'WriteOffInvoice'},
]);

const actions = computed(() => [
    {id: 1, name: t('labels.create'), value: 'create'},
    {id: 2, name: t('labels.update'), value: 'update'},
    {id: 3, name: t('labels.delete'), value: 'delete'},
    {id: 4, name: t('labels.restore'), value: 'restore'},
]);

function showDetailDialogFunc(log) {
    isLoading.value = true
    currentLogData.value = log
    selectedEntityType.value = log.entityType

    const propertyNames = computePropertyByEntityType(log.entityType) || []

    propertyNames.forEach(prop => {
        const base = capitalize(
            prop.replace(new RegExp(`^${log.entityType}`, 'i'), '')
        )

        const addedVar = `selectedAdded${base}`
        const removedVar = `selectedRemoved${base}`
        const oldChangedVar = `selectedOldChanged${base}`
        const newChangedVar = `selectedNewChanged${base}`

        if (!refs.value[addedVar]) refs.value[addedVar] = ref([])
        if (!refs.value[removedVar]) refs.value[removedVar] = ref([])
        if (!refs.value[oldChangedVar]) refs.value[oldChangedVar] = ref([])
        if (!refs[newChangedVar]) refs.value[newChangedVar] = ref([])

        if (log.action === 'create') {
            refs.value[addedVar].value = log.newData[prop] || []
        } else if (log.action === 'update') {
            refs.value[addedVar].value = log.newData[prop]?.added || []
        }

        if (log.action === 'delete') {
            refs.value[removedVar].value = log.oldData[prop] || []
        } else if (log.action === 'update') {
            refs.value[removedVar].value = log.oldData[prop]?.removed || []
        }

        refs.value[oldChangedVar].value = log.action === 'update'
            ? log.oldData[prop]?.changed || []
            : []

        refs.value[newChangedVar].value = log.action === 'update'
            ? log.newData[prop]?.changed || []
            : []
    })

    console.log(refs.value)
    visible.value.detailVisible = true
    isLoading.value = false
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function hasAnyLength(log) {
    const propertyNames = computePropertyByEntityType(log.entityType) || [];
    let total = 0;

    propertyNames.forEach(propertyName => {
        let added = [];
        let removed = [];
        let oldChanged = [];
        let newChanged = [];

        if (log.action === 'create') {
            added = log.newData[propertyName] || [];
        } else if (log.action === 'update') {
            added = log.newData[propertyName]?.added || [];
        }

        if (log.action === 'delete') {
            removed = log.oldData[propertyName] || [];
        } else if (log.action === 'update') {
            removed = log.oldData[propertyName]?.removed || [];
        }

        if (log.action === 'update') {
            oldChanged = log.oldData[propertyName]?.changed || [];
            newChanged = log.newData[propertyName]?.changed || [];
        }

        total += added.length + removed.length + oldChanged.length + newChanged.length;
    });

    return total;
}

function computePropertyByEntityType(entityType) {
    return entityTypeToPropertyMap[entityType] || [];
}

const entityTypeToPropertyMap = {
    IncomeInvoice: ['incomeInvoiceProducts'],
    Kit: ['kitProducts'],
    TransferInvoice: ['transferInvoiceProducts', 'transferInvoiceKits'],
    OrderInvoice: ['orderInvoiceProducts', 'orderInvoiceKits'],
    ReturnInvoice: ['returnInvoiceProducts', 'returnInvoiceKits'],
    WriteOffInvoice: ['writeOffInvoiceProducts', 'writeOffInvoiceKits'],
    Inventory: ['inventoryProducts', 'inventoryKits']
}

const debouncedFilter = useDebouncedRef(route.query.entityId || null, 500);

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 100,
    entityType: parseInt(route.query.entityType) || null,
    action: parseInt(route.query.action) || null,
    createdBy: parseInt(route.query.createdBy) || null,
    'date-from': route.query['date-from'] || null,
    'date-to': route.query['date-to'] || null
});

watch(
    [() => debouncedFilter.value, () => filters.value],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage
        };

        if (debouncedFilter.value !== null) {
            queryFilter.entityId = debouncedFilter.value;
        }

        if (debouncedFilter.value === "") {
            delete queryFilter.entityId;
        }

        if (filters.value.entityType !== null) {
            queryFilter.entityType = filters.value.entityType;
        } else {
            delete queryFilter.entityType;
        }

        if (filters.value.action !== null) {
            queryFilter.action = filters.value.action;
        } else {
            delete queryFilter.action;
        }

        if (filters.value.createdBy !== null) {
            queryFilter.createdBy = filters.value.createdBy;
        } else {
            delete queryFilter.createdBy;
        }

        if (filters.value['date-from']) {
            if (filters.value['date-from'] !== null) {
                const date = new Date(filters.value['date-from']);
                date.setHours(date.getHours() + 5);
                queryFilter['date-from'] = date.toISOString();
            }


            if (filters.value['date-from'] === "") {
                delete queryFilter['date-from'];
            }
        }

        if (filters.value['date-to']) {
            if (filters.value['date-to'] !== null) {
                const date = new Date(filters.value['date-to']);
                date.setHours(date.getHours() + 5);
                queryFilter['date-to'] = date.toISOString();
            }

            if (filters.value['date-to'] === "") {
                delete queryFilter['date-to'];
            }
        }

        await updateQuery(router, queryFilter);

        await logStore.fetchLogs(route.query);
    },
    { immediate: true, deep: true },
);

watch(() => visible.value.detailVisible, val => {
    if (!val) {
        currentLogData.value = null
        refs.value = {}
    }
})

onMounted(() => {
    if(!userStore.getUsers.models.length) {
        userStore.fetchUsers({ page: 1, 'items-per-page': 100 })
    }
})
</script>

<template>
    <Section
        :section-name="t('logs')"
        back-route-name="reports"
    >
        <template #buttons>
            <div class="hidden sm:flex grow gap-2 sm:gap-4 justify-end">
                <Button
                    @click="isVisibleSectionHeader = !isVisibleSectionHeader"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :icon="isVisibleSectionHeader ? 'pi pi-filter' : 'pi pi-filter-slash'"
                    :label="t('buttons.filters')"
                />
            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    size="small"
                    @click="isVisibleSectionHeader = !isVisibleSectionHeader"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :icon="isVisibleSectionHeader ? 'pi pi-filter' : 'pi pi-filter-slash'"
                    :label="t('buttons.filters')"
                />
            </div>
        </template>

        <template #sectionHeader>
            <div
                :class="{
                    'h-0 border-transparent -my-1 sm:-my-2': !isVisibleSectionHeader,
                    'py-2 sm:py-4 h-fit border-surface-300 dark:border-surface-600/50 border': isVisibleSectionHeader
                }"
                class="px-2 sm:px-4 transition-all overflow-hidden bg-surface-0 dark:bg-surface-800 rounded-lg"
            >
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 items-center">
                    <div class="col-span-2 sm:col-span-1">
                        <label class="relative max-w-full w-full">
                            <i class="pi pi-search absolute top-1/2 -mt-2 text-surface-400 leading-none start-3 z-1"/>
                            <InputText
                                pt:root="ps-10"
                                v-model="debouncedFilter"
                                class="w-full"
                                :placeholder="t('placeholders.search.byElementId')"
                            />
                        </label>
                    </div>
                    <Select
                        v-model="filters.entityType"
                        :options="elements"
                        option-label="name"
                        option-value="value"
                        :placeholder="t('placeholders.search.byElement')"
                        showClear
                        class="min-w-50 max-w-full w-full"
                    />
                    <Select
                        v-model="filters.action"
                        :options="actions"
                        option-label="name"
                        option-value="value"
                        :placeholder="t('placeholders.search.byAction')"
                        showClear
                        class="min-w-50 max-w-full w-full"
                    />
                    <Select
                        v-model="filters.createdBy"
                        :options="userStore.getUsers.models"
                        option-label="name"
                        option-value="id"
                        :placeholder="t('placeholders.search.byUser')"
                        showClear
                        class="min-w-50 max-w-full w-full"
                    />
                    <DatePicker
                        v-model.trim="filters['date-from']"
                        dateFormat="dd.mm.yy"
                        showIcon
                        fluid
                        iconDisplay="input"
                        :placeholder="t('placeholders.search.byDateFrom')"
                        show-button-bar
                    />
                    <DatePicker
                        v-model.trim="filters['date-to']"
                        dateFormat="dd.mm.yy"
                        showIcon
                        fluid
                        iconDisplay="input"
                        :placeholder="t('placeholders.search.byDateTo')"
                        show-button-bar
                    />
                </div>
            </div>
        </template>

        <template #sectionBody>
            <NoData v-if="!logStore.getLogs.totalItems && !logStore.getIsLoadingLogs" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-if="logStore.getIsLoadingLogs || logStore.getLogs.totalItems > 0"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        :value="logStore.getIsLoadingLogs ?  Array(10).fill({}) : logStore.getLogs.models"
                        :total-records="logStore.getLogs.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="createdAt" :header="t('labels.createdAt')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <p v-else>{{ getFormattedDateWithTime(data.createdAt) }}</p>
                            </template>
                        </Column>
                        <Column field="element" :header="t('labels.element')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <p v-else>{{ t(`labels.${data.entityType}`) }}</p>
                            </template>
                        </Column>
                        <Column field="elementId" :header="t('labels.elementId')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <p v-else>{{ formatCurrency(data.entityId) }}</p>
                            </template>
                        </Column>
                        <Column field="oldValue" :header="t('labels.oldValue')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <div v-else>
                                    <div v-if="data.entityType === 'Notification'">
                                        <h6 v-if="data.oldData?.status">{{ t('labels.status') }}: <b>{{ t(data.oldData.status) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'User'">
                                        <h6 v-if="data.oldData?.username">{{ t('labels.phoneNumber') }}: <b>{{ formatPhoneByCountry(data.oldData.username) }}</b></h6>
                                        <h6 v-if="data.oldData?.name">{{ t('labels.name') }}: <b>{{ data.oldData.name }}</b></h6>
                                        <h6 v-if="data.oldData?.role">{{ t('labels.role') }}:
                                            <b v-if="data.oldData.role.name === 'ROLE_ADMIN'">{{ t('roles.admin') }}</b>
                                            <b v-if="data.oldData.role.name === 'ROLE_SELLER'">{{ t('roles.seller') }}</b>
                                            <b v-if="data.oldData.role.name === 'ROLE_WAREHOUSE_MANAGER'">{{ t('roles.warehouseManager') }}</b>
                                            <b v-if="data.oldData.role.name === 'ROLE_DIRECTOR'">{{ t('roles.director') }}</b>
                                            <b v-if="data.oldData.role.name === 'ROLE_PARTNER'">{{ t('roles.partner') }}</b>
                                        </h6>
                                        <h6 v-if="data.oldData?.locations?.length">{{ t('labels.locations') }}:
                                            <b
                                                class="bg-surface-100 dark:bg-surface-900 w-fit px-3 py-0.5 rounded"
                                                v-for="location in data.oldData.locations"
                                                :key="location.id"
                                            >
                                                {{ location.name }}
                                            </b>
                                        </h6>
                                        <h6 v-if="data.action === 'update' && data.oldData?.locations?.removed?.length">{{ t('labels.locations') }}:
                                            <b
                                                class="bg-surface-100 dark:bg-surface-900 w-fit px-3 py-0.5 rounded"
                                                v-for="location in data.oldData.locations.removed"
                                                :key="location.id"
                                            >
                                                {{ location.name }}
                                            </b>
                                        </h6>
                                    </div>
                                    <div v-if="data.entityType === 'Seller'">
                                        <h6 v-if="data.oldData?.telephone">{{ t('labels.phoneNumber') }}: <b>{{ formatPhoneByCountry(data.oldData.telephone) }}</b></h6>
                                        <h6 v-if="data.oldData?.name">{{ t('labels.name') }}: <b>{{ data.oldData.name }}</b></h6>
                                        <h6 v-if="data.oldData?.location">{{ t('labels.locations') }}: <b>{{ data.oldData.location.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Customer'">
                                        <h6 v-if="data.oldData?.telephone">{{ t('labels.phoneNumber') }}: <b>{{ formatPhoneByCountry(data.oldData.telephone) }}</b></h6>
                                        <h6 v-if="data.oldData?.name">{{ t('labels.name') }}: <b>{{ data.oldData.name }}</b></h6>
                                        <h6 v-if="data.oldData?.comment" class="truncate max-w-xs">{{ t('labels.comment') }}: <b>{{ data.oldData.comment }}</b></h6>
                                        <h6 v-if="data.oldData?.b2b !== undefined"><b>{{ data.oldData?.b2b ? t('labels.clientB2B') : t('labels.clientB2C') }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Supplier'">
                                        <h6 v-if="data.oldData?.telephone">{{ t('labels.phoneNumber') }}: <b>{{ formatPhoneByCountry(data.oldData.telephone) }}</b></h6>
                                        <h6 v-if="data.oldData?.name">{{ t('labels.name') }}: <b>{{ data.oldData.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Product'">
                                        <h6 v-if="data.oldData?.code">{{ t('labels.code') }}: <b>{{ data.oldData.code }}</b></h6>
                                        <h6 v-if="data.oldData?.name">{{ t('labels.title') }}: <b>{{ data.oldData.name }}</b></h6>
                                        <h6 v-if="data.oldData?.qr">{{ t('labels.qr') }}: <b>{{ data.oldData.qr }}</b></h6>
                                        <h6 v-if="data.oldData?.category">{{ t('labels.category') }}: <b>{{ data.oldData.category.name }}</b></h6>
                                        <h6 v-if="data.oldData?.assembly">{{ t('labels.collection') }}: <b>{{ data.oldData.assembly.name }}</b></h6>
                                        <h6 v-if="data.oldData?.wholesalePrice !== undefined">{{ t('labels.wholesalePrice') }}: <b>{{ formatCurrency(data.oldData.wholesalePrice) }}$</b></h6>
                                        <h6 v-if="data.oldData?.retailPrice !== undefined">{{ t('labels.retailPrice') }}: <b>{{ formatCurrency(data.oldData.retailPrice) }}$</b></h6>
                                        <h6 v-if="data.oldData?.minQty !== undefined">{{ t('labels.minQty') }}: <b>{{ formatCurrency(data.oldData.minQty) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Location'">
                                        <h6 v-if="data.oldData?.name">{{ t('labels.title') }}: <b>{{ data.oldData.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Category'">
                                        <h6 v-if="data.oldData?.name">{{ t('labels.title') }}: <b>{{ data.oldData.name }}</b></h6>
                                        <h6 v-if="data.oldData?.categoryType">{{ t('labels.categoryType') }}: <b>{{ data.oldData.categoryType.name }}</b></h6>
                                        <h6 v-if="data.oldData?.unit">{{ t('labels.unit') }}: <b>{{ t(`labels.${data.oldData.unit.name}`) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Color'">
                                        <h6 v-if="data.oldData?.name">{{ t('labels.title') }}: <b>{{ data.oldData.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'OrderKpiPercent'">
                                        <h6 v-if="data.oldData?.kpiPercent !== undefined">{{ t('labels.kpiPercent') }}: <b>{{ data.oldData.kpiPercent }}%</b></h6>
                                        <h6 v-if="data.oldData?.createdAt">{{ t('labels.createdAt') }}: <b>{{ getFormattedDate(data.oldData.createdAt) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'KitKpiPercent'">
                                        <h6 v-if="data.oldData?.kpiPercent !== undefined">{{ t('labels.kpiPercent') }}: <b>{{ data.oldData.kpiPercent }}%</b></h6>
                                        <h6 v-if="data.oldData?.createdAt">{{ t('labels.createdAt') }}: <b>{{ getFormattedDate(data.oldData.createdAt) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'CategoryKpiPercent'">
                                        <h6 v-if="data.oldData?.kpiPercent !== undefined">{{ t('labels.kpiPercent') }}: <b>{{ data.oldData.kpiPercent }}%</b></h6>
                                        <h6 v-if="data.oldData?.createdAt">{{ t('labels.createdAt') }}: <b>{{ getFormattedDate(data.oldData.createdAt) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Payment'">
                                        <h6 v-if="data.oldData?.name">{{ t('labels.title') }}: <b>{{ data.oldData.name }}</b></h6>
                                        <h6 v-if="data.oldData?.paymentType">{{ t('labels.paymentType') }}: <b>{{ data.oldData.paymentType.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Assembly'">
                                        <h6 v-if="data.oldData?.name">{{ t('labels.title') }}: <b>{{ data.oldData.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Inventory'">
                                        <h6 v-if="data.oldData?.location">{{ t('labels.locations') }}: <b>{{ data.oldData.location.name }}</b></h6>
                                        <h6 v-if="data.oldData?.dateFrom">{{ t('labels.dateFrom') }}: <b>{{ getFormattedDateWithTime(data.oldData.dateFrom) }}</b></h6>
                                        <h6 v-if="data.oldData?.dateTo">{{ t('labels.dateTo') }}: <b>{{ getFormattedDateWithTime(data.oldData.dateTo) }}</b></h6>
                                        <h6 v-if="data.oldData?.status">{{ t('labels.status') }}: <b>{{ t(data.oldData.status) }}</b></h6>
                                        <h6 v-if="data.oldData?.totalPrice !== undefined">{{ t('labels.total') }}: <b>{{ formatCurrency(data.oldData.totalPrice) }}$</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'OrderInvoice'">
                                        <h6 v-if="data.oldData?.location">{{ t('labels.locations') }}: <b>{{ data.oldData.location.name }}</b></h6>
                                        <h6 v-if="data.oldData?.seller">{{ t('labels.Seller') }}: <b>{{ data.oldData.seller.name }}</b></h6>
                                        <h6 v-if="data.oldData?.customer">{{ t('labels.Customer') }}: <b>{{ data.oldData.customer.name }}</b></h6>
                                        <h6 v-if="data.oldData?.status">{{ t('labels.status') }}: <b>{{ t(data.oldData.status) }}</b></h6>
                                        <h6 v-if="data.oldData?.totalPrice !== undefined">{{ t('labels.total') }}: <b>{{ formatCurrency(data.oldData.totalPrice) }}$</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'IncomeInvoice'">
                                        <h6 v-if="data.oldData?.supplier">{{ t('labels.Supplier') }}: <b>{{ data.oldData.supplier.name }}</b></h6>
                                        <h6 v-if="data.oldData?.location">{{ t('labels.locations') }}: <b>{{ data.oldData.location.name }}</b></h6>
                                        <h6 v-if="data.oldData?.comment" class="truncate max-w-xs">{{ t('labels.comment') }}: <b>{{ data.oldData.comment }}</b></h6>
                                        <h6 v-if="data.oldData?.totalPrice !== undefined">{{ t('labels.total') }}: <b>{{ formatCurrency(data.oldData.totalPrice) }}$</b></h6>
                                        <h6 v-if="data.oldData?.createdAt">{{ t('labels.createdAt') }}: <b>{{ getFormattedDate(data.oldData.createdAt) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Kit'">
                                        <h6 v-if="data.oldData?.seller">{{ t('labels.Seller') }}: <b>{{ data.oldData.seller.name }}</b></h6>
                                        <h6 v-if="data.oldData?.name">{{ t('labels.title') }}: <b>{{ data.oldData.name }}</b></h6>
                                        <h6 v-if="data.oldData?.code">{{ t('labels.code') }}: <b>{{ data.oldData.code }}</b></h6>
                                        <h6 v-if="data.oldData?.qr">{{ t('labels.qr') }}: <b>{{ data.oldData.qr }}</b></h6>
                                        <h6 v-if="data.oldData?.assembly">{{ t('labels.collection') }}: <b>{{ data.oldData.assembly.name }}</b></h6>
                                        <h6 v-if="data.oldData?.wholesalePrice !== undefined">{{ t('labels.wholesalePrice') }}: <b>{{ formatCurrency(data.oldData.wholesalePrice) }}$</b></h6>
                                        <h6 v-if="data.oldData?.retailPrice !== undefined">{{ t('labels.retailPrice') }}: <b>{{ formatCurrency(data.oldData.retailPrice) }}$</b></h6>
                                        <h6 v-if="data.oldData?.qty !== undefined">{{ t('labels.qty') }}: <b>{{ formatCurrency(data.oldData.qty) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'TransferInvoice'">
                                        <h6 v-if="data.oldData?.fromLocation">{{ t('labels.fromLocation') }}: <b>{{ data.oldData.fromLocation.name }}</b></h6>
                                        <h6 v-if="data.oldData?.toLocation">{{ t('labels.toLocation') }}: <b>{{ data.oldData.toLocation.name }}</b></h6>
                                        <h6 v-if="data.oldData?.status">{{ t('labels.status') }}: <b>{{ t(data.oldData.status) }}</b></h6>
                                        <h6 v-if="data.oldData?.totalCostPrice !== undefined">{{ t('labels.costPrice') }}: <b>{{ formatCurrency(data.oldData.totalCostPrice) }}$</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'ReturnInvoice'">
                                        <h6 v-if="data.oldData?.totalPrice !== undefined">{{ t('labels.total') }}: <b>{{ formatCurrency(data.oldData.totalPrice) }}$</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'WriteOffInvoice'">
                                        <h6 v-if="data.oldData?.totalCostPrice !== undefined">{{ t('labels.costPrice') }}: <b>{{ formatCurrency(data.oldData.totalCostPrice) }}$</b></h6>
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column field="newValue" :header="t('labels.newValue')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <div v-else>
                                    <div v-if="data.entityType === 'Notification'">
                                        <h6 v-if="data.newData?.status">{{ t('labels.status') }}: <b>{{ t(data.newData.status) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'User'">
                                        <h6 v-if="data.newData?.username">{{ t('labels.phoneNumber') }}: <b>{{ formatPhoneByCountry(data.newData.username) }}</b></h6>
                                        <h6 v-if="data.newData?.name">{{ t('labels.name') }}: <b>{{ data.newData.name }}</b></h6>
                                        <h6 v-if="data.newData?.password">{{ t('labels.password') }}: <b>{{ t('labels.passwordUpdated') }}</b></h6>
                                        <h6 v-if="data.newData?.role">{{ t('labels.role') }}:
                                            <b v-if="data.newData.role.name === 'ROLE_ADMIN'">{{ t('roles.admin') }}</b>
                                            <b v-if="data.newData.role.name === 'ROLE_SELLER'">{{ t('roles.seller') }}</b>
                                            <b v-if="data.newData.role.name === 'ROLE_WAREHOUSE_MANAGER'">{{ t('roles.warehouseManager') }}</b>
                                            <b v-if="data.newData.role.name === 'ROLE_DIRECTOR'">{{ t('roles.director') }}</b>
                                            <b v-if="data.newData.role.name === 'ROLE_PARTNER'">{{ t('roles.partner') }}</b>
                                        </h6>
                                        <h6 v-if="data.newData?.locations?.length">{{ t('labels.locations') }}:
                                            <b
                                                class="bg-surface-100 dark:bg-surface-900 w-fit px-3 py-0.5 rounded"
                                                v-for="location in data.newData.locations"
                                                :key="location.id"
                                            >
                                                {{ location.name }}
                                            </b>
                                        </h6>
                                        <h6 v-if="data.action === 'update' && data.newData?.locations?.added?.length">{{ t('labels.locations') }}:
                                            <b
                                                class="bg-surface-100 dark:bg-surface-900 w-fit px-3 py-0.5 rounded"
                                                v-for="location in data.newData.locations.added"
                                                :key="location.id"
                                            >
                                                {{ location.name }}
                                            </b>
                                        </h6>
                                    </div>
                                    <div v-if="data.entityType === 'Seller'">
                                        <h6 v-if="data.newData?.telephone">{{ t('labels.phoneNumber') }}: <b>{{ formatPhoneByCountry(data.newData.telephone) }}</b></h6>
                                        <h6 v-if="data.newData?.name">{{ t('labels.name') }}: <b>{{ data.newData.name }}</b></h6>
                                        <h6 v-if="data.newData?.location">{{ t('labels.locations') }}: <b>{{ data.newData.location.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Customer'">
                                        <h6 v-if="data.newData?.telephone">{{ t('labels.phoneNumber') }}: <b>{{ formatPhoneByCountry(data.newData.telephone) }}</b></h6>
                                        <h6 v-if="data.newData?.name">{{ t('labels.name') }}: <b>{{ data.newData.name }}</b></h6>
                                        <h6 v-if="data.newData?.comment" class="truncate max-w-xs">{{ t('labels.comment') }}: <b>{{ data.newData.comment }}</b></h6>
                                        <h6 v-if="data.newData?.b2b !== undefined"><b>{{ data.newData?.b2b ? t('labels.clientB2B') : t('labels.clientB2C') }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Supplier'">
                                        <h6 v-if="data.newData?.telephone">{{ t('labels.phoneNumber') }}: <b>{{ formatPhoneByCountry(data.newData.telephone) }}</b></h6>
                                        <h6 v-if="data.newData?.name">{{ t('labels.name') }}: <b>{{ data.newData.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Product'">
                                        <h6 v-if="data.newData?.code">{{ t('labels.code') }}: <b>{{ data.newData.code }}</b></h6>
                                        <h6 v-if="data.newData?.name">{{ t('labels.title') }}: <b>{{ data.newData.name }}</b></h6>
                                        <h6 v-if="data.newData?.qr">{{ t('labels.qr') }}: <b>{{ data.newData.qr }}</b></h6>
                                        <h6 v-if="data.newData?.category">{{ t('labels.category') }}: <b>{{ data.newData.category.name }}</b></h6>
                                        <h6 v-if="data.newData?.assembly">{{ t('labels.collection') }}: <b>{{ data.newData.assembly.name }}</b></h6>
                                        <h6 v-if="data.newData?.wholesalePrice !== undefined">{{ t('labels.wholesalePrice') }}: <b>{{ formatCurrency(data.newData.wholesalePrice) }}$</b></h6>
                                        <h6 v-if="data.newData?.retailPrice !== undefined">{{ t('labels.retailPrice') }}: <b>{{ formatCurrency(data.newData.retailPrice) }}$</b></h6>
                                        <h6 v-if="data.newData?.minQty !== undefined">{{ t('labels.minQty') }}: <b>{{ formatCurrency(data.newData.minQty) }}</b></h6>
                                        <h6 v-if="data.action === 'update' && data.newData?.photo">{{ t('labels.photo') }}: <b>{{ t('labels.imageUpdated') }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Location'">
                                        <h6 v-if="data.newData?.name">{{ t('labels.title') }}: <b>{{ data.newData.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Category'">
                                        <h6 v-if="data.newData?.name">{{ t('labels.title') }}: <b>{{ data.newData.name }}</b></h6>
                                        <h6 v-if="data.newData?.categoryType">{{ t('labels.categoryType') }}: <b>{{ data.newData.categoryType.name }}</b></h6>
                                        <h6 v-if="data.newData?.unit">{{ t('labels.unit') }}: <b>{{ t(`labels.${data.newData.unit.name}`) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Color'">
                                        <h6 v-if="data.newData?.name">{{ t('labels.title') }}: <b>{{ data.newData.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'OrderKpiPercent'">
                                        <h6 v-if="data.newData?.kpiPercent !== undefined">{{ t('labels.kpiPercent') }}: <b>{{ data.newData.kpiPercent }}%</b></h6>
                                        <h6 v-if="data.newData?.createdAt">{{ t('labels.createdAt') }}: <b>{{ getFormattedDate(data.newData.createdAt) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'KitKpiPercent'">
                                        <h6 v-if="data.newData?.kpiPercent !== undefined">{{ t('labels.kpiPercent') }}: <b>{{ data.newData.kpiPercent }}%</b></h6>
                                        <h6 v-if="data.newData?.createdAt">{{ t('labels.createdAt') }}: <b>{{ getFormattedDate(data.newData.createdAt) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'CategoryKpiPercent'">
                                        <h6 v-if="data.newData?.kpiPercent !== undefined">{{ t('labels.kpiPercent') }}: <b>{{ data.newData.kpiPercent }}%</b></h6>
                                        <h6 v-if="data.newData?.createdAt">{{ t('labels.createdAt') }}: <b>{{ getFormattedDate(data.newData.createdAt) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Payment'">
                                        <h6 v-if="data.newData?.name">{{ t('labels.title') }}: <b>{{ data.newData.name }}</b></h6>
                                        <h6 v-if="data.newData?.paymentType">{{ t('labels.paymentType') }}: <b>{{ data.newData.paymentType.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Assembly'">
                                        <h6 v-if="data.newData?.name">{{ t('labels.title') }}: <b>{{ data.newData.name }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Inventory'">
                                        <h6 v-if="data.newData?.location">{{ t('labels.locations') }}: <b>{{ data.newData.location.name }}</b></h6>
                                        <h6 v-if="data.newData?.dateFrom">{{ t('labels.dateFrom') }}: <b>{{ getFormattedDateWithTime(data.newData.dateFrom) }}</b></h6>
                                        <h6 v-if="data.newData?.dateTo">{{ t('labels.dateTo') }}: <b>{{ getFormattedDateWithTime(data.newData.dateTo) }}</b></h6>
                                        <h6 v-if="data.newData?.status">{{ t('labels.status') }}: <b>{{ t(data.newData.status) }}</b></h6>
                                        <h6 v-if="data.newData?.totalPrice !== undefined">{{ t('labels.total') }}: <b>{{ formatCurrency(data.newData.totalPrice) }}$</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'OrderInvoice'">
                                        <h6 v-if="data.newData?.location">{{ t('labels.locations') }}: <b>{{ data.newData.location.name }}</b></h6>
                                        <h6 v-if="data.newData?.seller">{{ t('labels.Seller') }}: <b>{{ data.newData.seller.name }}</b></h6>
                                        <h6 v-if="data.newData?.customer">{{ t('labels.Customer') }}: <b>{{ data.newData.customer.name }}</b></h6>
                                        <h6 v-if="data.newData?.status">{{ t('labels.status') }}: <b>{{ t(data.newData.status) }}</b></h6>
                                        <h6 v-if="data.newData?.totalPrice !== undefined">{{ t('labels.total') }}: <b>{{ formatCurrency(data.newData.totalPrice) }}$</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'IncomeInvoice'">
                                        <h6 v-if="data.newData?.supplier">{{ t('labels.Supplier') }}: <b>{{ data.newData.supplier.name }}</b></h6>
                                        <h6 v-if="data.newData?.location">{{ t('labels.locations') }}: <b>{{ data.newData.location.name }}</b></h6>
                                        <h6 v-if="data.newData?.comment" class="truncate max-w-xs">{{ t('labels.comment') }}: <b>{{ data.newData.comment }}</b></h6>
                                        <h6 v-if="data.newData?.totalPrice !== undefined">{{ t('labels.total') }}: <b>{{ formatCurrency(data.newData.totalPrice) }}$</b></h6>
                                        <h6 v-if="data.newData?.createdAt">{{ t('labels.createdAt') }}: <b>{{ getFormattedDate(data.newData.createdAt) }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'Kit'">
                                        <h6 v-if="data.newData?.seller">{{ t('labels.Seller') }}: <b>{{ data.newData.seller.name }}</b></h6>
                                        <h6 v-if="data.newData?.name">{{ t('labels.title') }}: <b>{{ data.newData.name }}</b></h6>
                                        <h6 v-if="data.newData?.code">{{ t('labels.code') }}: <b>{{ data.newData.code }}</b></h6>
                                        <h6 v-if="data.newData?.qr">{{ t('labels.qr') }}: <b>{{ data.newData.qr }}</b></h6>
                                        <h6 v-if="data.newData?.assembly">{{ t('labels.collection') }}: <b>{{ data.newData.assembly.name }}</b></h6>
                                        <h6 v-if="data.newData?.wholesalePrice !== undefined">{{ t('labels.wholesalePrice') }}: <b>{{ formatCurrency(data.newData.wholesalePrice) }}$</b></h6>
                                        <h6 v-if="data.newData?.retailPrice !== undefined">{{ t('labels.retailPrice') }}: <b>{{ formatCurrency(data.newData.retailPrice) }}$</b></h6>
                                        <h6 v-if="data.newData?.qty !== undefined">{{ t('labels.qty') }}: <b>{{ formatCurrency(data.newData.qty) }}</b></h6>
                                        <h6 v-if="data.action === 'update' && data.newData?.photo">{{ t('labels.photo') }}: <b>{{ t('labels.imageUpdated') }}</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'TransferInvoice'">
                                        <h6 v-if="data.newData?.fromLocation">{{ t('labels.fromLocation') }}: <b>{{ data.newData.fromLocation.name }}</b></h6>
                                        <h6 v-if="data.newData?.toLocation">{{ t('labels.toLocation') }}: <b>{{ data.newData.toLocation.name }}</b></h6>
                                        <h6 v-if="data.newData?.status">{{ t('labels.status') }}: <b>{{ t(data.newData.status) }}</b></h6>
                                        <h6 v-if="data.newData?.totalCostPrice !== undefined">{{ t('labels.costPrice') }}: <b>{{ formatCurrency(data.newData.totalCostPrice) }}$</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'ReturnInvoice'">
                                        <h6 v-if="data.newData?.orderInvoice?.location">{{ t('labels.locations') }}: <b>{{ data.newData.orderInvoice.location.name }}</b></h6>
                                        <h6 v-if="data.newData?.orderInvoice?.seller">{{ t('labels.Seller') }}: <b>{{ data.newData.orderInvoice.seller.name }}</b></h6>
                                        <h6 v-if="data.newData?.orderInvoice?.customer">{{ t('labels.Customer') }}: <b>{{ data.newData.orderInvoice.customer.name }}</b></h6>
                                        <h6 v-if="data.newData?.totalPrice !== undefined">{{ t('labels.total') }}: <b>{{ formatCurrency(data.newData.totalPrice) }}$</b></h6>
                                    </div>
                                    <div v-if="data.entityType === 'WriteOffInvoice'">
                                        <h6 v-if="data.newData?.location">{{ t('labels.locations') }}: <b>{{ data.newData.location.name }}</b></h6>
                                        <h6 v-if="data.newData?.totalCostPrice !== undefined">{{ t('labels.costPrice') }}: <b>{{ formatCurrency(data.newData.totalCostPrice) }}$</b></h6>
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column field="actionType" :header="t('labels.actionType')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <p
                                    v-else
                                    :class="{
                                        'text-teal-500': data.action === 'create',
                                        'text-amber-500': data.action === 'update',
                                        'text-red-500': data.action === 'delete',
                                    }"
                                >{{ t(`labels.${data.action}`) }}</p>
                            </template>
                        </Column>
                        <Column field="responsible" :header="t('labels.responsible')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <p v-else>{{ data.createdBy.name }}</p>
                            </template>
                        </Column>
                        <Column field="id" style="width: 60px;">  <!-- Fixed width for the column -->
                            <template #header>
                                <p class="font-semibold">{{ t('details') }}</p>
                            </template>
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="logStore.getIsLoadingLogs"/>
                                <div v-else>
                                    <div v-if="hasAnyLength(data)" class="flex justify-center w-full">
                                        <Button
                                            @click="showDetailDialogFunc(data)"
                                            icon="pi pi-eye"
                                            pt:root="rounded-full size-8! min-w-8! h-8! bg-blue-400 dark:bg-blue-400 enabled:hover:bg-blue-300 dark:enabled:hover:bg-blue-300 border-blue-400 dark:border-blue-400 enabled:hover:border-blue-300 dark:enabled:hover:border-blue-300 focus-visible:outline-blue-400 dark:focus-visible:outline-blue-400"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <template #footer>
                            <div v-if="logStore.getIsLoadingLogs" class="flex justify-between">
                                <Skeleton height="2rem" width="10rem" />
                                <Skeleton height="2rem" width="5rem"/>
                            </div>
                            <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                <PaginatorComponent
                                    v-model="filters.page"
                                    v-model:items-per-page="filters.itemsPerPage"
                                    :total-items="logStore.getLogs.totalItems"
                                />
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>
            <!-- DETAILS DIALOG -->
            <Dialog
                v-model:visible="visible.detailVisible"
                modal
                :header="t('details')"
                class="sm:min-w-100 sm:w-9/10 h-11/12"
                pt:root="mx-2 sm:mx-4"
                pt:header="border-b border-surface-300 dark:border-surface-600/50 px-2 sm:px-4"
                pt:content="px-2 sm:px-4 h-full"
            >
                <div class="h-full">
                    <LogDetails
                        :is-loading="isLoading"
                        :refs="refs"
                        :entityType="selectedEntityType"
                    />
                </div>
            </Dialog>
        </template>
    </Section>
</template>
