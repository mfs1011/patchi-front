<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {computed, onMounted, ref, watch} from "vue";
import Button from "@/volt/Button.vue";
import DatePicker from "@/volt/DatePicker.vue";
import {useRoute, useRouter} from "vue-router";
import {useToast} from "primevue/usetoast";
import updateQuery from "@/helpers/updateQuery.js";
import {useLocationQuantityStore} from "@/stores/locationQuantity.js";
import Select from "@/volt/Select.vue";
import {useLocationStore} from "@/stores/location.js";
import {formatCurrency, getFormattedDate} from "@/helpers/numberFormat.js";
import Skeleton from "@/volt/Skeleton.vue";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
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
import SearchSelect from "@/components/UI/SearchSelect.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast()

const locationQuantityStore = useLocationQuantityStore()
const locationQuantityKitStore = useLocationQuantityKitStore()
const locationStore = useLocationStore()
const productStore = useProductStore()

// refs
const isVisibleSectionHeader = ref(false);
const isVisible = ref(false);
const productSelectPage = ref(1)
const tabVal = ref('product');
const productsForSelect = ref([])

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    location: route.query.location || null,
    product: route.query.product || null,
    kit: route.query.kit || null,
    'is-desc': route.query['is-desc'] || null,
    'is-zero': route.query['is-zero'] || null,
    expired: route.query.expired || null,
});

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("warehouse"),
    route: "/warehouse",
}));

const items = computed(() => [{ label: t("cards.warehouseContent") }]);

const tabList = computed(() => [
    { value: 'product', label: t('labels.product')},
    { value: 'kit', label: t('labels.kit')},
])


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
            console.log(queryFilter)
        }

        if (tabVal.value === 'product') {
            filters.value.kit = null
            filters.value.page = 1

            if (filters.value.product !== null) {
                queryFilter.product = filters.value.product;
            }
        }

        if (tabVal.value === 'kit') {
            filters.value.product = null
            filters.value.page = 1

            if (filters.value.kit !== null) {
                queryFilter.kit = filters.value.kit;
            }
        }

        if(filters.value.product !== null) {
            queryFilter.product = +filters.value.product;
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

onMounted(() => {
    if (!locationStore.getLocations.models.length) {
        locationStore.fetchLocations({page: 1, 'items-per-page': 100, isWarehouse: true })
    }

    if (!productsForSelect.value.length) {
        productStore.fetchProducts({ page: productSelectPage.value, 'items-per-page': 7, name: filters.value.product })
            .then(() => {
                productsForSelect.value = [...productsForSelect.value, ...productStore.getProducts.models]
            })
    }

    if (route.params.product) {
        filters.value.product = productsForSelect.value.find(item => item.id === route.params.product)
    }
})

async function fetchProduct(queryFilters) {
    console.log('fetch')
    await productStore.fetchProducts(queryFilters)
        .then(() => {
            productsForSelect.value = [...productsForSelect.value, ...productStore.getProducts.models]
        })
}
async function firstFetchProduct(queryFilters) {
    console.log('firstFetch')
    await productStore.fetchProducts(queryFilters)
        .then(() => {
            productsForSelect.value = [...productStore.getProducts.models]
        })
}
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
<!--                <div class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 items-center">-->
<!--                    <Select-->
<!--                        v-model="filters.location"-->
<!--                        :options="locationStore.getLocations.models"-->
<!--                        option-label="name"-->
<!--                        option-value="id"-->
<!--                        :placeholder="t('placeholders.search.byLocation')"-->
<!--                        showClear-->
<!--                        class="col-span-2 sm:col-span-1 md:min-w-50 max-w-full w-full"-->
<!--                    />-->
<!--                    filters:{{filters.product}}-->
<!--                    <SearchSelect-->
<!--                        :total-items="productStore.getProducts.totalItems"-->
<!--                        :items="productsForSelect"-->
<!--                        v-model="filters.product"-->
<!--                        :fetch="fetchProduct"-->
<!--                        :firstFetch="firstFetchProduct"-->
<!--                    />-->
<!--                    <Select-->
<!--                        v-if="tabVal === 'product'"-->
<!--                        v-model="debouncedNameForSelect"-->
<!--                        ref="productsSelect"-->
<!--                        :options="productsForSelect"-->
<!--                        option-label="name"-->
<!--                        option-value="name"-->
<!--                        :placeholder="t('placeholders.search.byProduct')"-->
<!--                        showClear-->
<!--                        :loading="isLoadingNextPartProduct"-->
<!--                        class="col-span-2 sm:col-span-1 md:min-w-50 max-w-full w-full"-->
<!--                        editable-->
<!--                        @hide="() => {console.log('show');productSelectPage = 1}"-->
<!--                    >-->
<!--                        <template #option="{option, index}">-->
<!--                            <div @click="setProduct">-->
<!--                                {{option.name}}-->
<!--                                <div-->
<!--                                    v-intersection-observer="[onIntersectionObserver, { productSelect }]"-->
<!--                                    v-if="index + 1 === productsForSelect.length && productStore.getProducts.totalItems > productsForSelect.length && productsForSelect.length"-->
<!--                                ></div>-->
<!--                            </div>-->
<!--                        </template>-->
<!--                    </Select>-->

<!--                    <Select-->
<!--                        v-if="tabVal === 'kit'"-->
<!--                        v-model="filters.kit"-->
<!--                        :options="locationStore.getLocations.models"-->
<!--                        option-label="name"-->
<!--                        option-value="id"-->
<!--                        :placeholder="t('placeholders.search.byKit')"-->
<!--                        showClear-->
<!--                        class="col-span-2 sm:col-span-1 md:min-w-50 max-w-full w-full"-->
<!--                    />-->

<!--                    <DatePicker-->
<!--                        v-model.trim="filters['date-from']"-->
<!--                        dateFormat="dd.mm.yy"-->
<!--                        showIcon-->
<!--                        fluid-->
<!--                        iconDisplay="input"-->
<!--                        :placeholder="t('placeholders.search.byDateFrom')"-->
<!--                        show-button-bar-->
<!--                    />-->
<!--                    <DatePicker-->
<!--                        v-model.trim="filters['date-to']"-->
<!--                        dateFormat="dd.mm.yy"-->
<!--                        showIcon-->
<!--                        fluid-->
<!--                        iconDisplay="input"-->
<!--                        :placeholder="t('placeholders.search.byDateTo')"-->
<!--                        show-button-bar-->
<!--                    />-->
<!--                </div>-->
                <p>Bu yeri keyinroq qilinadi</p>
            </div>
        </template>

        <template #sectionBody>
            <Card
                pt:root="grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="p-0 h-full grow flex flex-col"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
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
                                            <p v-else>{{ data.id }}</p>
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
                                            <p v-else>{{ getFormattedDate(data.expiryDate) }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityStore.getIsLoadingLocationQuantity"/>
                                            <p v-else>{{ formatCurrency(data.qty) }} {{ t(`labels.${data.product.category.unit.name}`) }}</p>
                                        </template>
                                    </Column>

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
                                            <p v-else>{{ data.id }}</p>
                                        </template>
                                    </Column>
                                    <Column field="kit" :header="t('labels.name')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ data.kit.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="kit" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ data.kit.code }}</p>
                                        </template>
                                    </Column>
                                    <Column field="location" :header="t('labels.locations')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="locationQuantityKitStore.getIsLoadingLocationQuantityKit"/>
                                            <p v-else>{{ data.location.name }}</p>
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
        </template>
    </Section>
</template>
