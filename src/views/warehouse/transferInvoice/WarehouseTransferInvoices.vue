<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {computed, onMounted, ref, watch} from "vue";
import Button from "@/volt/Button.vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import {useToast} from "primevue/usetoast";
import updateQuery from "@/helpers/updateQuery.js";
import {useLocationStore} from "@/stores/location.js";
import {formatCurrency, formatLocalEndOfDay, getFormattedDate} from "@/helpers/numberFormat.js";
import Skeleton from "@/volt/Skeleton.vue";
import DataTable from "@/volt/DataTable.vue";
import Column from "primevue/column";
import Card from "@/volt/Card.vue";
import NoData from "@/components/UI/NoData.vue";
import {useProductStore} from "@/stores/product.js";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import {useIncomeInvoiceStore} from "@/stores/incomeInvoice.js";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import DatePicker from "@/volt/DatePicker.vue";
import {useSupplierStore} from "@/stores/supplier.js";
import {useUserStore} from "@/stores/user.js";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import Dialog from "@/volt/Dialog.vue";
import {useTransferInvoiceStore} from "@/stores/transferInvoice.js";
import Select from "@/volt/Select.vue";
import {useKitStore} from "@/stores/kit.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast()

const transferInvoiceStore = useTransferInvoiceStore()
const locationStore = useLocationStore()
const productStore = useProductStore()
const kitStore = useKitStore()
const userStore = useUserStore()
const deleteVisible = ref(false)
const acceptVisible = ref(false)
const isDeleteLoading = ref(false)
const isAcceptLoading = ref(false)
const currentTransferInvoiceIdForAccept = ref(null)
const currentTransferInvoiceId = ref(null)

// refs
const isVisibleSectionHeader = ref(false);
const tabVal = ref('product');

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    location: route.query.location || null,
    kit: route.query.kit || null,
    createdBy: route.query.createdBy || null,
    acceptedBy: route.query.acceptedBy || null,
    status: route.query.status || null,
    product: route.query.product || null,
    'date-from': route.query['date-from'] || null,
    'date-to': route.query['date-to'] || null,
});

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("warehouse"),
    route: "/warehouse",
}));

const items = computed(() => [{ label: t("cards.transferInvoices") }]);
const isAdminAndWarehouseManager = computed(() => (
    ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'].includes(userStore.getAboutMeFromToken?.role)
))

const statuses = computed(() => [
    { id: 1, name: t('1') },
    { id: 2, name: t('2') }
])

// watchers
watch(
    [() => filters.value, () => tabVal.value],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage
        };

        if (filters.value.location !== null) {
            queryFilter.location = filters.value.location;
        } else {
            delete queryFilter.location;
        }

        if (filters.value.supplier !== null) {
            queryFilter.supplier = filters.value.supplier;
        } else {
            delete queryFilter.supplier;
        }

        if (filters.value.createdBy !== null) {
            queryFilter.createdBy = filters.value.createdBy;
        } else {
            delete queryFilter.createdBy;
        }

        if (filters.value.acceptedBy !== null) {
            queryFilter.acceptedBy = filters.value.acceptedBy;
        } else {
            delete queryFilter.acceptedBy;
        }

        if (filters.value.status !== null) {
            queryFilter.status = filters.value.status;
        } else {
            delete queryFilter.status;
        }

        if (filters.value.product !== null) {
            queryFilter.product = filters.value.product;
        } else {
            delete queryFilter.product;
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
                queryFilter['date-to'] = formatLocalEndOfDay(new Date(filters.value['date-to']));
            }

            if (filters.value['date-to'] === "") {
                delete queryFilter['date-to'];
            }
        }

        await updateQuery(router, queryFilter);

        await transferInvoiceStore.fetchTransferInvoices({ ...route.query, 'is-warehouse': true });
    },
    { immediate: true, deep: true },
);

watch(tabVal, () => {
    filters.value.page = 1
})

const clearFilters = () => {
    filters.value.location = null;
    filters.value.supplier = null;
    filters.value.createdBy = null;
    filters.value.acceptedBy = null;
    filters.value.product = null;
    filters.value['date-from'] = null;
    filters.value['date-to'] = null;
}

const isAdminAndCreatedBy = createdById => (
    userStore.getAboutMe.role.name === 'ROLE_ADMIN' || userStore.getAboutMe.id === createdById
)

const deleteAction = (id) => {
    currentTransferInvoiceId.value = id;
    deleteVisible.value = true;
};

const deleteTransferInvoice = async () => {
    try {
        isDeleteLoading.value = true;

        await transferInvoiceStore.deleteTransferInvoice(currentTransferInvoiceId.value);
        toast.add({ severity: 'success', summary: t('toast.deleted', { name: t('product.nominativeCapitalize') }), life: 3000 })
    } catch (err) {
        toast.add({ severity: 'error', summary: t('toast.cannot_delete_product_in_stock'), life: 3000 })
    } finally {
        isDeleteLoading.value = false;
        deleteVisible.value = false;
    }
};

const acceptAction = id => {
    currentTransferInvoiceIdForAccept.value = id
    acceptVisible.value = true
}
const acceptTransferInvoice = async () => {
    isAcceptLoading.value = true;

    try {
        await transferInvoiceStore.acceptTransferInvoice(currentTransferInvoiceIdForAccept.value)
        toast.add({ severity: 'success', summary: t('toast.accepted', { name: t('transferInvoice.nominativeCapitalize') }), life: 3000 })
    } catch (err) {
        toast.add({ severity: 'error', summary: t('toast.cannot_delete_product_in_stock'), life: 3000 })
    } finally {
        isAcceptLoading.value = false;
        acceptVisible.value = false;
    }
}

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 17) {
            await transferInvoiceStore.fetchTransferInvoices({ ...route.query, 'is-warehouse': true });
        }
    })
}

onMounted(async () => {
    connectMercure()
})

onBeforeRouteLeave(() => {
    if (eventSource.value) {
        eventSource.value.close()
    }
})
</script>

<template>
    <Breadcrumb
        :home="home"
        :model="items"
        class="mb-2 sm:mb-4 rounded-md border border-surface-300 dark:border-surface-600/50"
    >
        <template #item="{ item, props }">
            <router-link
                v-if="item.route"
                v-slot="{ href, navigate }"
                :to="item.route"
                custom
                class="group"
            >
                <a :href="href" v-bind="props.action" @click="navigate">
                <span class="text-surface-700 dark:text-surface-0 group-hover:text-main dark:group-hover:text-green transition-all">
                    {{ item.label }}
                </span>
                </a>
            </router-link>
            <a v-else :href="item.url" :target="item.target" v-bind="props.action">
                <span class="text-main dark:text-green font-semibold">{{ item.label }}</span>
            </a>
        </template>
        <template #separator>
            <span class="text-primary">/</span>
        </template>
    </Breadcrumb>
    <Section
        :section-name="t('cards.transferInvoices')"
        back-route-name="warehouse"
    >
        <template #buttons>
            <div class="hidden sm:flex grow gap-2 sm:gap-4 justify-end">
                <Button
                    @click="isVisibleSectionHeader = !isVisibleSectionHeader"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :icon="isVisibleSectionHeader ? 'pi pi-filter' : 'pi pi-filter-slash'"
                    :label="t('buttons.filters')"
                />
                <Button
                    v-if="isAdminAndWarehouseManager"
                    @click="router.push({ name: 'warehouse-add-transfer-invoices' })"
                    class="px-2 sm:px-5 whitespace-nowrap"
                >{{ t("buttons.newTransferInvoice") }}</Button>
            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    size="small"
                    @click="isVisibleSectionHeader = !isVisibleSectionHeader"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :icon="isVisibleSectionHeader ? 'pi pi-filter' : 'pi pi-filter-slash'"
                    :label="t('buttons.filters')"
                />
                <Button
                    v-if="isAdminAndWarehouseManager"
                    @click="router.push({ name: 'warehouse-add-transfer-invoices' })"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                >{{ t("buttons.newTransferInvoice") }}</Button>
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
                <div class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 items-center">
                    <SearchSelect
                        v-model="filters.location"
                        :fetchFn="(query) => locationStore.fetchLocations({ ...query, isWarehouse: true})"
                        :options="locationStore.getLocations.models"
                        :option-label="opt => opt?.name"
                        :option-value="opt => opt?.id"
                        :return-value="opt => opt?.id"
                        :placeholder="t('placeholders.search.byLocation')"
                        :loading="locationStore.getIsLoadingLocation"
                        :total-items="locationStore.getLocations.totalItems"
                    />
                    <SearchSelect
                        v-model="filters.createdBy"
                        :fetchFn="userStore.fetchUsers"
                        :options="userStore.getUsers.models"
                        :option-label="opt => opt?.name"
                        :option-value="opt => opt?.id"
                        :return-value="opt => opt?.id"
                        :placeholder="t('placeholders.search.byCreatedBy')"
                        :loading="userStore.getIsLoadingUsers"
                        :total-items="userStore.getUsers.totalItems"
                    />
                    <SearchSelect
                        v-model="filters.acceptedBy"
                        :fetchFn="userStore.fetchUsers"
                        :options="userStore.getUsers.models"
                        :option-label="opt => opt?.name"
                        :option-value="opt => opt?.id"
                        :return-value="opt => opt?.id"
                        :placeholder="t('placeholders.search.byAcceptedBy')"
                        :loading="userStore.getIsLoadingUsers"
                        :total-items="userStore.getUsers.totalItems"
                    />
                    <Select
                        v-model="filters.status"
                        :options="statuses"
                        option-label="name"
                        option-value="id"
                        :placeholder="t('placeholders.search.byStatus')"
                        showClear
                        class="col-span-2 sm:col-span-1 md:min-w-50 max-w-full w-full bg-surface-0! dark:bg-surface-700!"
                    />
                    <SearchSelect
                        v-model="filters.product"
                        :fetchFn="productStore.fetchProducts"
                        :options="productStore.getProducts.models"
                        :option-label="opt => `${opt?.name} | ${opt?.code}`"
                        :option-value="opt => `${opt?.name} | ${opt?.code}`"
                        :return-value="opt => opt?.id"
                        :placeholder="t('placeholders.search.byProduct')"
                        :loading="productStore.getIsLoadingProducts"
                        :total-items="productStore.getProducts.totalItems"
                    >
                        <template #header>
                            <div class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{t('labels.title')}} | {{t('labels.code') }}</div>
                        </template>
                    </SearchSelect>
                    <SearchSelect
                        v-model="filters.kit"
                        :fetchFn="kitStore.fetchKits"
                        :options="kitStore.getKits.models"
                        :option-label="opt => `${opt?.name} | ${opt?.code}`"
                        :option-value="opt => `${opt?.name} | ${opt?.code}`"
                        :return-value="opt => opt?.id"
                        :placeholder="t('placeholders.search.byKit')"
                        :loading="kitStore.getIsLoadingKits"
                        :total-items="kitStore.getKits.totalItems"
                    >
                        <template #header>
                            <div class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{t('labels.title')}} | {{t('labels.code') }}</div>
                        </template>
                    </SearchSelect>

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

                    <div class="col-span-full xl:col-span-4 flex justify-end">
                        <Button @click="clearFilters" :label="t('clear')" icon="pi pi-trash" class="bg-surface-500 border-surface-500 enabled:hover:border-surface-400 enabled:hover:bg-surface-400 dark:bg-surface-500 dark:border-surface-500 dark:enabled:hover:border-surface-400 dark:enabled:hover:bg-surface-400 w-fit px-4"/>
                    </div>
                </div>
            </div>
        </template>

        <template #sectionBody>
            <Card
                pt:root="grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="h-full grow flex flex-col p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <NoData v-if="!transferInvoiceStore.getTransferInvoices.totalItems && !transferInvoiceStore.getIsLoadingTransferInvoices" class="text-surface-400 mx-auto my-auto">
                        <p class="text-xl font-normal">{{ t("noResults") }}</p>
                    </NoData>

                    <DataTable
                        v-if="transferInvoiceStore.getIsLoadingTransferInvoices || transferInvoiceStore.getTransferInvoices.totalItems > 0"
                        :value="transferInvoiceStore.getIsLoadingTransferInvoices ?  Array(10).fill({}) : transferInvoiceStore.getTransferInvoices.models"
                        :total-records="transferInvoiceStore.getTransferInvoices.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="fromLocation" :header="t('labels.fromLocation')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p v-else>{{ data.fromLocation?.name }}</p>
                            </template>
                        </Column>
                        <Column field="toLocation" :header="t('labels.toLocation')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p v-else>{{ data.toLocation?.name }}</p>
                            </template>
                        </Column>
                        <Column field="status" :header="t('labels.status')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p
                                    v-else
                                    :class="{'text-yellow-500': data.status === 1, 'text-green-500': data.status === 2}"
                                >
                                    {{ t(data.status) }}
                                </p>
                            </template>
                        </Column>
                        <Column field="createdAt" :header="t('labels.createdAt')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p v-else>{{ getFormattedDate(data.createdAt) }}</p>
                            </template>
                        </Column>
                        <Column field="createdBy" :header="t('labels.createdBy')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p v-else>{{ data.createdBy.name }}</p>
                            </template>
                        </Column>
                        <Column field="acceptedBy" :header="t('labels.acceptedBy')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p v-else>{{ data.acceptedBy?.name ?? '-' }}</p>
                            </template>
                        </Column>
                        <Column field="updatedAt" :header="t('labels.updatedAt')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p v-else>{{ data.updatedAt ? getFormattedDate(data.updatedAt) : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="updatedBy" :header="t('labels.updatedBy')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>
                                <p v-else>{{ data.updatedBy?.name || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="actions" :header="t('actions')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="transferInvoiceStore.getIsLoadingTransferInvoices"/>

                                <div v-else class="flex justify-end w-full">
                                    <div class="flex items-center gap-2">
                                        <Button
                                            v-if="isAdminAndCreatedBy && data.status !== 2"
                                            @click="acceptAction(data.id)"
                                            icon="pi pi-check"
                                            pt:root="rounded-full size-8! bg-teal-500 dark:bg-teal-500 enabled:hover:bg-teal-400 dark:enabled:hover:bg-teal-400 border-teal-500 dark:border-teal-500 enabled:hover:border-teal-400 dark:enabled:hover:border-teal-400 focus-visible:outline-teal-500 dark:focus-visible:outline-teal-500"
                                            size="small"
                                        />
                                        <Button
                                            @click="router.push({
                                                name: 'warehouse-transfer-invoice',
                                                params: { id: data.id },
                                            })"
                                            icon="pi pi-eye"
                                            pt:root="rounded-full size-8! bg-blue-400 dark:bg-blue-400 enabled:hover:bg-blue-300 dark:enabled:hover:bg-blue-300 border-blue-400 dark:border-blue-400 enabled:hover:border-blue-300 dark:enabled:hover:border-blue-300 focus-visible:outline-blue-400 dark:focus-visible:outline-blue-400"
                                            size="small"
                                        />
                                        <Button
                                            v-if="data.status !== 2"
                                            @click="deleteAction(data.id)"
                                            icon="pi pi-trash"
                                            pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <template #footer>
                            <div v-if="transferInvoiceStore.getIsLoadingTransferInvoices" class="flex justify-between">
                                <Skeleton height="2rem" width="10rem" />
                                <Skeleton height="2rem" width="5rem"/>
                            </div>
                            <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                <PaginatorComponent
                                    v-model="filters.page"
                                    v-model:items-per-page="filters.itemsPerPage"
                                    :total-items="transferInvoiceStore.getTransferInvoices.totalItems"
                                />
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>

            <!-- DELETE INCOME_INVOICE DIALOG -->
            <Dialog
                v-model:visible="deleteVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.deleteConfirmation', { name: t('transferInvoice.accusative'), id: currentTransferInvoiceId }) }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="deleteVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteTransferInvoice"
                            :loading="isDeleteLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>

            <!-- ACCEPT INCOME_INVOICE DIALOG -->
            <Dialog
                v-model:visible="acceptVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.acceptConfirmation', { name: t('transferInvoice.accusative'), id: currentTransferInvoiceIdForAccept }) }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="acceptVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="acceptTransferInvoice"
                            :loading="isAcceptLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
        </template>
    </Section>
</template>
