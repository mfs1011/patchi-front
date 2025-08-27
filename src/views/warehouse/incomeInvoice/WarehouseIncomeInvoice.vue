<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {computed, onMounted, ref, watch} from "vue";
import Button from "@/volt/Button.vue";
import {useRoute, useRouter} from "vue-router";
import {useToast} from "primevue/usetoast";
import updateQuery from "@/helpers/updateQuery.js";
import {useLocationQuantityStore} from "@/stores/locationQuantity.js";
import {useLocationStore} from "@/stores/location.js";
import {formatCurrency, getFormattedDate} from "@/helpers/numberFormat.js";
import Skeleton from "@/volt/Skeleton.vue";
import DataTable from "@/volt/DataTable.vue";
import Tab from "@/volt/Tab.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import Column from "primevue/column";
import Card from "@/volt/Card.vue";
import NoData from "@/components/UI/NoData.vue";
import Tabs from "@/volt/Tabs.vue";
import TabPanels from "@/volt/TabPanels.vue";
import {useLocationQuantityKitStore} from "@/stores/locationQuantityKit.js";
import {useProductStore} from "@/stores/product.js";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import {useIncomeInvoiceStore} from "@/stores/incomeInvoice.js";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import Select from "@/volt/Select.vue";
import DatePicker from "@/volt/DatePicker.vue";
import {useSupplierStore} from "@/stores/supplier.js";
import {useUserStore} from "@/stores/user.js";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row";
import {useIncomeInvoiceProductStore} from "@/stores/incomeInvoiceProduct.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast()

const incomeInvoiceProductStore = useIncomeInvoiceProductStore()
const locationStore = useLocationStore()
const productStore = useProductStore()
const supplierStore = useSupplierStore()
const userStore = useUserStore()
const isLoading = ref(true)

// refs
const isVisibleSectionHeader = ref(false);
const tabVal = ref('product');

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    location: route.query.location || null,
    supplier: route.query.supplier || null,
    createdBy: route.query.createdBy || null,
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

const items = computed(() => [{ label: t("cards.incomeInvoices"), route: { name: 'warehouse-income-invoices'} }, { label: t('cards.incomeInvoice') }]);

const isAdminAndWarehouseManager = computed(() => (
    ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'].includes(userStore.getAboutMe?.role?.name)
))

onMounted(async () => {
    await incomeInvoiceProductStore.fetchIncomeInvoiceProduct(route.params.id)
    isLoading.value = false
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
        :section-name="t('cards.incomeInvoices')"
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
                    @click="router.push({ name: 'add-income-invoices' })"
                    class="px-2 sm:px-5 whitespace-nowrap"
                >{{ t("buttons.newIncomeInvoice") }}</Button>
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
                    @click="router.push({ name: 'add-income-invoices' })"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                >{{ t("buttons.newIncomeInvoice") }}</Button>
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
                    <NoData v-if="!incomeInvoiceProductStore.getIncomeInvoiceProducts.totalItems && !incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts" class="text-surface-400 mx-auto my-auto">
                        <p class="text-xl font-normal">{{ t("noResults") }}</p>
                    </NoData>

                    <DataTable
                        v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts || incomeInvoiceProductStore.getIncomeInvoiceProducts.totalItems > 0"
                        :value="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts ?  Array(10).fill({}) : incomeInvoiceProductStore.getIncomeInvoiceProducts.models"
                        :total-records="incomeInvoiceProductStore.getIncomeInvoiceProducts.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="location" :header="t('labels.location')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ data.location.name }}</p>
                            </template>
                        </Column>
                        <Column field="supplier" :header="t('labels.Supplier')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ data.supplier.name }}</p>
                            </template>
                        </Column>
                        <Column field="customsFee" :header="t('labels.customsFee')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ `${formatCurrency(data.customsFee)}$` || '-'  }}</p>
                            </template>
                        </Column>
                        <Column field="transportationFee" :header="t('labels.transportationFee')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ `${formatCurrency(data.transportationFee)}$` || '-'  }}</p>
                            </template>
                        </Column>
                        <Column field="totalPrice" :header="t('labels.totalPrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ `${formatCurrency(data.totalPrice)}$` || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="comment" :header="t('labels.comment')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ data.comment || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="createdAt" :header="t('labels.createdAt')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ getFormattedDate(data.createdAt) }}</p>
                            </template>
                        </Column>
                        <Column field="createdBy" :header="t('labels.createdBy')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ data.createdBy.name }}</p>
                            </template>
                        </Column>
                        <Column field="updatedAt" :header="t('labels.updatedAt')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ data.updatedAt ? getFormattedDate(data.updatedAt) : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="updatedBy" :header="t('labels.updatedBy')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>
                                <p v-else>{{ data.updatedBy?.name || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="actions" :header="t('actions')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts"/>

                                <div v-else class="flex justify-end w-full">
                                    <div class="flex items-center gap-2">
                                        <Button
                                            @click="router.push({
                                                name: 'income-invoice',
                                                params: { id: data.id },
                                            })"
                                            icon="pi pi-eye"
                                            pt:root="rounded-full size-8! bg-blue-400 dark:bg-blue-400 enabled:hover:bg-blue-300 dark:enabled:hover:bg-blue-300 border-blue-400 dark:border-blue-400 enabled:hover:border-blue-300 dark:enabled:hover:border-blue-300 focus-visible:outline-blue-400 dark:focus-visible:outline-blue-400"
                                            size="small"
                                        />
                                        <Button
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
                            <div v-if="incomeInvoiceProductStore.getIsLoadingIncomeInvoiceProducts" class="flex justify-between">
                                <Skeleton height="2rem" width="10rem" />
                                <Skeleton height="2rem" width="5rem"/>
                            </div>
                            <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                <p class="font-semibold">{{ t('labels.totals') }}:</p>
                                <div>
                                    <p class="font-semibold">{{ incomeInvoiceProductStore.getIncomeInvoiceProducts.totalPrice }}$</p>
                                </div>
                                <PaginatorComponent
                                    v-model="filters.page"
                                    v-model:items-per-page="filters.itemsPerPage"
                                    :total-items="incomeInvoiceProductStore.getIncomeInvoiceProducts.totalItems"
                                />
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
