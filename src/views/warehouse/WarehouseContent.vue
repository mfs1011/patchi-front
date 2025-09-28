<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {computed, onMounted, ref, watch} from "vue";
import Button from "@/volt/Button.vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
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
import Select from "@/volt/Select.vue";
import Column from "primevue/column";
import Card from "@/volt/Card.vue";
import NoData from "@/components/UI/NoData.vue";
import Tabs from "@/volt/Tabs.vue";
import TabPanels from "@/volt/TabPanels.vue";
import {useLocationQuantityKitStore} from "@/stores/locationQuantityKit.js";
import {useProductStore} from "@/stores/product.js";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {useKitStore} from "@/stores/kit.js";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row";
import InputNumber from "@/volt/InputNumber.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import Dialog from "@/volt/Dialog.vue";
import {useUserStore} from "@/stores/user.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast()

const locationQuantityStore = useLocationQuantityStore()
const locationQuantityKitStore = useLocationQuantityKitStore()
const locationStore = useLocationStore()
const productStore = useProductStore()
const userStore = useUserStore()
const kitStore = useKitStore()

// refs
const isVisibleSectionHeader = ref(false);
const productSelectPage = ref(1)
const tabVal = ref('product');
const productsForSelect = ref([])
const isRollbackLoading = ref(false);
const rollbackVisible = ref(false);
const locationQuantityKit = ref();
const rollbackCount = ref(1);

function rollback(data) {
    locationQuantityKit.value = data;
    rollbackVisible.value = true;
}

const rollbackKit = async () => {
    try {
        isRollbackLoading.value = true;

        const kitData = {locationQuantityKit: '/api/location_quantity_kits/' + locationQuantityKit.value.id, qty: rollbackCount.value}
        await kitStore.rollbackKit(kitData, locationQuantityKit.value.kit.id);

        toast.add({ severity: 'success', summary: t('toast.rollback', { name: t('kit.nominativeCapitalize') }), life: 3000 })
    } catch (err) {
        toast.add({ severity: 'error', summary: t('toast.notEnoughKit'), life: 3000 })
    } finally {
        isRollbackLoading.value = false;
        rollbackVisible.value = false;
    }
};

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    location: null,
    product: null,
    kit: null,
    'is-desc': null,
    'is-zero': null,
    expired: null,
});

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("warehouse"),
    route: "/warehouse",
}));

const dt = ref();
const exportCSV = () => {
    dt.value.exportCSV();
};

const items = computed(() => [{ label: t("cards.warehouseContent") }]);

const tabList = computed(() => [
    { value: 'product', label: t('labels.product')},
    { value: 'kit', label: t('labels.kit')},
])

const isAdmin = computed(() => userStore.getAboutMeFromToken.role === 'ROLE_ADMIN')

// watchers
watch(
    [() => filters.value, () => tabVal.value],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage,
            "is-warehouse": true
        };

        if (filters.value.location !== null) {
            queryFilter.location = filters.value.location;
        }

        if (tabVal.value === 'product') {
            filters.value.kit = null

            if (filters.value.product !== null) {
                queryFilter.product = filters.value.product;
            }
        }

        if (tabVal.value === 'kit') {
            filters.value.product = null

            if (filters.value.kit !== null) {
                queryFilter.kit = filters.value.kit;
            }
        }

        if (filters.value['is-desc'] !== null) {
            queryFilter['is-desc'] = filters.value['is-desc'];
        }

        if (filters.value['is-zero'] !== null) {
            queryFilter['is-zero'] = filters.value['is-zero'];
        }

        if (filters.value.expired !== null) {
            queryFilter.expired = filters.value.expired;
        }

        await updateQuery(router, queryFilter);

        if (tabVal.value === 'product') {
            await locationQuantityStore.fetchLocationQuantities(route.query);
        } else {
            await locationQuantityKitStore.fetchLocationQuantityKits(route.query)
        }
    },
    { immediate: true, deep: true },
);

watch(tabVal, () => {
    filters.value.page = 1
})

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 7) {
            await locationQuantityKitStore.fetchLocationQuantityKits(route.query)
        }
    })
}

const clearFilters = () => {
    filters.value.location = null;
    filters.value.product = null;
    filters.value.kit = null;
    filters.value['is-desc'] = null;
    filters.value['is-zero'] = null;
    filters.value.expired = null;
}

onMounted(() => {
    if (!productsForSelect.value.length) {
        productStore.fetchProducts({ page: productSelectPage.value, 'items-per-page': 7, name: filters.value.product })
            .then(() => {
                productsForSelect.value = [...productsForSelect.value, ...productStore.getProducts.models]
            })
    }

    if (route.params.product) {
        filters.value.product = productsForSelect.value.find(item => item.id === route.params.product)
    }

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
        :section-name="t('cards.warehouseContent')"
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
                        v-if="tabVal === 'product'"
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
                        v-if="tabVal === 'kit'"
                        v-model="filters.kit"
                        :fetchFn="kitStore.fetchKits"
                        :options="kitStore.getKits.models"
                        :option-label="opt => opt?.name"
                        :option-value="opt => opt?.id"
                        :return-value="opt => opt?.id"
                        :placeholder="t('placeholders.search.byKit')"
                        :loading="kitStore.getIsLoadingKits"
                        :total-items="kitStore.getKits.totalItems"
                    />

                    <Select
                        v-model="filters.expired"
                        :options="[{id: 1, value: true, name: t('expired')}, {id: 2, value: false, name: t('notExpired')}]"
                        option-label="name"
                        option-value="value"
                        showClear
                        :placeholder="t('placeholders.search.byExpiry')"
                    />

                    <Select
                        v-model="filters['is-desc']"
                        :options="[{id: 1, value: true, name: t('desc')}, {id: 2, value: false, name: t('asc')}]"
                        option-label="name"
                        option-value="value"
                        showClear
                        :placeholder="t('placeholders.search.orderByExpiry')"
                    />

                    <Select
                        v-model="filters['is-zero']"
                        :options="[{id: 1, value: true, name: t('zero')}, {id: 2, value: false, name: t('notZero')}]"
                        option-label="name"
                        option-value="value"
                        showClear
                        :placeholder="t('placeholders.search.byQty')"
                    />
                    <div class="xl:col-span-3 flex justify-end">
                        <Button @click="clearFilters" :label="t('clear')" icon="pi pi-trash" class="bg-surface-500 border-surface-500 enabled:hover:border-surface-400 enabled:hover:bg-surface-400 dark:bg-surface-500 dark:border-surface-500 dark:enabled:hover:border-surface-400 dark:enabled:hover:bg-surface-400 w-fit px-4"/>
                    </div>
                </div>
            </div>
        </template>

        <template #sectionBody>
            <Card
                pt:root="grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="p-0 h-full grow flex flex-col"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #header>
                    <div class="pt-5 px-5">
                        <Button
                            @click="exportCSV"
                            icon="pi pi-file-excel"
                            pt:root="bg-teal-500 dark:bg-teal-500 enabled:hover:bg-teal-400 dark:enabled:hover:bg-teal-400 border-teal-500 dark:border-teal-500 enabled:hover:border-teal-400 dark:enabled:hover:border-teal-400 focus-visible:outline-teal-500 dark:focus-visible:outline-teal-500"
                            size="small"
                            label="Export"
                        />
                    </div>
                </template>
                <template #content>
                    <Tabs v-model:value="tabVal" scrollable :showNavigators="false">
                        <TabList>
                            <Tab pt:root="font-medium dark:text-surface-0" v-for="tab of tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel value="product" class="h-full">
                                <DataTable
                                    v-if="locationQuantityStore.getIsLoadingLocationQuantity || locationQuantityStore.getLocationQuantities.totalItems > 0"
                                    :value="locationQuantityStore.getIsLoadingLocationQuantity ?  Array(10).fill({}) : locationQuantityStore.getLocationQuantities.models"
                                    :total-records="locationQuantityStore.getLocationQuantities.totalItems"
                                    :rows="filters.itemsPerPage"
                                    scrollable
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50"
                                >
                                    <Column field="id" :header="t('labels.id')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ data.product.id }}</p>
                                        </template>
                                    </Column>
                                    <Column field="product" :header="t('labels.name')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ data.product.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="product" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ data.product.code }}</p>
                                        </template>
                                    </Column>
                                    <Column field="product" :header="t('labels.type')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ data.product.category.categoryType.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="location" :header="t('labels.locations')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ data.location.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="color" :header="t('labels.color')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ data.color?.name || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ data.expiryDate ? getFormattedDate(data.expiryDate) : '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ formatCurrency(data.qty) }} {{ t(`labels.${data.product.category.unit.name}`) }}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="isAdmin" field="costPrice" :header="t('labels.costPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ formatCurrency(data.product.costPrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column v-if="isAdmin" field="retailPrice" :header="t('labels.retailPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ formatCurrency(data.product.retailPrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column v-if="isAdmin" field="wholesalePrice" :header="t('labels.wholesalePrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ formatCurrency(data.product.wholesalePrice) }}$</p>
                                        </template>
                                    </Column>

                                    <ColumnGroup type="footer">
                                        <Row>
                                            <Column :colspan="7" footerStyle="text-align:right">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                                    <p v-else class="font-semibold">{{ t('labels.totals') }}:</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                                    <div v-else>
                                                        <p class="font-semibold">{{ formatCurrency(locationQuantityStore.getLocationQuantities.totalQtyKg) }} {{ t('labels.kg') }}</p>
                                                        <p class="font-semibold">{{ formatCurrency(locationQuantityStore.getLocationQuantities.totalQtyPcs) }}  {{ t('labels.pcs') }}</p>
                                                    </div>
                                                </template>
                                            </Column>
                                            <Column v-if="isAdmin">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(locationQuantityStore.getLocationQuantities.totalCostPrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column v-if="isAdmin">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(locationQuantityStore.getLocationQuantities.totalRetailPrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column v-if="isAdmin">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(locationQuantityStore.getLocationQuantities.totalWholesalePrice) }}$</p>
                                                </template>
                                            </Column>
                                        </Row>
                                    </ColumnGroup>

                                    <template #footer>
                                        <div v-if="locationQuantityStore.getIsLoadingLocationQuantity" class="flex justify-between">
                                            <Skeleton height="2rem" width="10rem" />
                                            <Skeleton height="2rem" width="5rem"/>
                                        </div>
                                        <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                            <PaginatorComponent
                                                v-model="filters.page"
                                                v-model:items-per-page="filters.itemsPerPage"
                                                :total-items="locationQuantityStore.getLocationQuantities.totalItems"
                                            />
                                        </div>
                                    </template>
                                </DataTable>

                                <NoData v-if="!locationQuantityStore.getLocationQuantities.totalItems && !locationQuantityStore.getIsLoadingLocationQuantity" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>
                            </TabPanel>
                            <TabPanel value="kit" class="h-full">
                                <DataTable
                                    v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit || locationQuantityKitStore.getLocationQuantityKits.totalItems > 0"
                                    :value="locationQuantityKitStore.getIsLoadingLocationQuantityKit ?  Array(10).fill({}) : locationQuantityKitStore.getLocationQuantityKits.models"
                                    :total-records="locationQuantityKitStore.getLocationQuantityKits.totalItems"
                                    :rows="filters.itemsPerPage"
                                    scrollable
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50"
                                >
                                    <Column field="id" :header="t('labels.id')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ data.kit.id }}</p>
                                        </template>
                                    </Column>
                                    <Column field="kit" :header="t('labels.name')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ data.kit?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="kit" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ data.kit?.code }}</p>
                                        </template>
                                    </Column>
                                    <Column field="location" :header="t('labels.locations')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ data.location?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ getFormattedDate(data.expiryDate) }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ formatCurrency(data.qty) }} {{ t('labels.pcs')}}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="isAdmin" field="costPrice" :header="t('labels.costPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ formatCurrency(data.kit?.costPrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column v-if="isAdmin" field="retailPrice" :header="t('labels.retailPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ formatCurrency(data.kit?.retailPrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column v-if="isAdmin" field="wholesalePrice" :header="t('labels.wholesalePrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ formatCurrency(data.kit?.wholesalePrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column field="actions" :header="t('actions')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>

                                            <div v-else>
                                                <div class="flex items-center gap-2">
                                                    <Button
                                                        @click="rollback(data)"
                                                        icon="pi pi-replay"
                                                        pt:root="rounded-full size-8! bg-teal-500 dark:bg-teal-500 enabled:hover:bg-teal-400 dark:enabled:hover:bg-teal-400 border-teal-500 dark:border-teal-500 enabled:hover:border-teal-400 dark:enabled:hover:border-teal-400 focus-visible:outline-teal-500 dark:focus-visible:outline-teal-500"
                                                        size="small"
                                                    />
                                                    <Button
                                                        @click="router.push({
                                                        name: 'kit_warehouse',
                                                        params: { id: data.kit.id },
                                                    })"
                                                        icon="pi pi-eye"
                                                        pt:root="rounded-full size-8! bg-blue-400 dark:bg-blue-400 enabled:hover:bg-blue-300 dark:enabled:hover:bg-blue-300 border-blue-400 dark:border-blue-400 enabled:hover:border-blue-300 dark:enabled:hover:border-blue-300 focus-visible:outline-blue-400 dark:focus-visible:outline-blue-400"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>
                                    <ColumnGroup type="footer">
                                        <Row>
                                            <Column :colspan="5" footerStyle="text-align:right">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                                    <p v-else class="font-semibold">{{ t('labels.totals') }}:</p>
                                                </template>
                                            </Column>
                                            <Column>
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                                    <div v-else>
                                                        <p class="font-semibold">{{ formatCurrency(locationQuantityKitStore.getLocationQuantityKits.totalQty) }} {{ t('labels.pcs') }}</p>
                                                    </div>
                                                </template>
                                            </Column>
                                            <Column v-if="isAdmin">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(locationQuantityKitStore.getLocationQuantityKits.totalCostPrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column v-if="isAdmin">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(locationQuantityKitStore.getLocationQuantityKits.totalRetailPrice) }}$</p>
                                                </template>
                                            </Column>
                                            <Column v-if="isAdmin">
                                                <template #footer>
                                                    <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                                    <p v-else class="font-semibold">{{ formatCurrency(locationQuantityKitStore.getLocationQuantityKits.totalWholesalePrice) }}$</p>
                                                </template>
                                            </Column>
                                        </Row>
                                    </ColumnGroup>

                                    <template #footer>
                                        <div v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit" class="flex justify-between">
                                            <Skeleton height="2rem" width="10rem" />
                                            <Skeleton height="2rem" width="5rem"/>
                                        </div>
                                        <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                            <PaginatorComponent
                                                v-model="filters.page"
                                                v-model:items-per-page="filters.itemsPerPage"
                                                :total-items="locationQuantityKitStore.getLocationQuantityKits.totalItems"
                                            />
                                        </div>
                                    </template>
                                </DataTable>

                                <NoData v-if="!locationQuantityKitStore.getLocationQuantityKits.totalItems && !locationQuantityKitStore.getIsLoadingLocationQuantityKit" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>

            <!-- Rollback DIALOG -->
            <Dialog
                v-model:visible="rollbackVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.rollbackConfirmation', { name: t('kit.accusative'), id: locationQuantityKit.kit.id }) }}
                </span>

                <div class="mt-4">
                    <label class="block mb-1 text-sm text-gray-500">
                        {{ t('placeholders.qty') }}
                    </label>
                    <InputNumber
                        v-model="rollbackCount"
                        :max="locationQuantityKit.qty"
                        class="w-full"
                        :placeholder="t('placeholders.qty')"
                    />
                </div>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="rollbackVisible = false"
                        />
                        <Button
                            v-if="rollbackCount"
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="rollbackKit"
                            :loading="isRollbackLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
        </template>
    </Section>
</template>
