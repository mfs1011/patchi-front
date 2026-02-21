<script setup>
import Section from "@/components/UI/Section.vue";
import {useI18n} from "vue-i18n";
import {computed, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import NoData from "@/components/UI/NoData.vue";
import Column from "primevue/column";
import DataTable from "@/volt/DataTable.vue";
import {formatCurrency} from "@/helpers/numberFormat.js";
import Tab from "@/volt/Tab.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import TabPanels from "@/volt/TabPanels.vue";
import Tabs from "@/volt/Tabs.vue";
import {useProductStore} from "@/stores/product.js";
import updateQuery from "@/helpers/updateQuery.js";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import DatePicker from "@/volt/DatePicker.vue";
import Button from "@/volt/Button.vue";
import InputText from "@/volt/InputText.vue";
import {useCategoryStore} from "@/stores/category.js";
import {useLocationStore} from "@/stores/location.js";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import {useKitStore} from "@/stores/kit.js";
import SearchSelect from "@/components/UI/SearchSelect.vue";

const { t } = useI18n();
const route = useRoute()
const router = useRouter();
const tabVal = ref('products')
const isVisibleSectionHeader = ref(false);

const productStore = useProductStore()
const kitStore = useKitStore()
const categoryStore = useCategoryStore()
const locationStore = useLocationStore()

const home = ref({
    icon: 'pi pi-home',
    label: t('reports'),
    route: '/reports'
});

const dt = ref();
const exportCSV = () => {
    dt.value.exportCSV();
};

const items = computed(() => [{ label: t('cards.residualByDate') }]);
const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])

const debouncedName = useDebouncedRef(route.query['name'] || '',  500)
const today = new Date();

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    category: parseInt(route.query.category) || null,
    location: parseInt(route.query.location) || null,
    'date-to': route.query['date-to'] ? new Date(route.query['date-to']) : today,
});

watch(
    [
        () => tabVal.value,
        () => debouncedName.value,
        () => filters.value
    ],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage
        };

        if (debouncedName.value !== null) {
            queryFilter.name = debouncedName.value;
        }

        if (debouncedName.value === "") {
            delete queryFilter.name;
        }

        if (filters.value.category !== null) {
            queryFilter.category = filters.value.category;
        } else {
            delete queryFilter.category;
        }

        if (filters.value.location !== null) {
            queryFilter.location = filters.value.location;
        } else {
            delete queryFilter.location;
        }

        if (filters.value['date-to']) {
            const toDate = new Date(filters.value['date-to']);
            toDate.setHours(5, 0, 0, 0);
            queryFilter['date-to'] = toDate.toISOString();
        }

        await updateQuery(router, queryFilter);

        if (tabVal.value === 'products') {
            await productStore.fetchResidualProducts(route.query);
        } else {
            await kitStore.fetchResidualKits(route.query);
        }
    },
    { immediate: true, deep: true }
);

watch(() => tabVal.value, () => {
    filters.value.page = 1;
});
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
        :section-name="t('cards.residualByDate')"
        back-route-name="reports"
    >
        <template #buttons>
            <div class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
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
                                v-model="debouncedName"
                                class="w-full"
                                :placeholder="t('placeholders.search.byTitleAndQRAndCode')"
                            />
                        </label>
                    </div>
                    <SearchSelect
                        v-if="tabVal === 'products'"
                        v-model="filters.category"
                        :fetchFn="(query) => categoryStore.fetchCategories({ ...query })"
                        :options="categoryStore.getCategories.models"
                        :option-label="opt => opt?.name"
                        :option-value="opt => opt?.id"
                        :return-value="opt => opt?.id"
                        :placeholder="t('placeholders.search.byCategory')"
                        :loading="categoryStore.getIsLoadingCategory"
                        :total-items="categoryStore.getCategories.totalItems"
                    />
                    <SearchSelect
                        v-model="filters.location"
                        :fetchFn="(query) => locationStore.fetchLocations({ ...query, toLocation: true})"
                        :options="locationStore.getLocations.models"
                        :option-label="opt => opt?.name"
                        :option-value="opt => opt?.id"
                        :return-value="opt => opt?.id"
                        :placeholder="t('placeholders.search.byLocation')"
                        :loading="locationStore.getIsLoadingLocation"
                        :total-items="locationStore.getLocations.totalItems"
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
            <Card
                pt:root="grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="h-full grow flex flex-col p-2 sm:p-4"
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
                        <TabPanels pt:root="px-0 pb-0">
                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'products'"
                                value="products"
                            >
                                <NoData v-if="!productStore.getResidualProducts.totalItems && !productStore.getIsLoadingProducts" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-if="productStore.getIsLoadingProducts || productStore.getResidualProducts.totalItems > 0"
                                    ref="dt"
                                    :value="productStore.getIsLoadingProducts ? Array(10).fill({}) : productStore.getResidualProducts.models"
                                    scrollable
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50"
                                >
                                    <Column field="id" :header="t('labels.id')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ data.product.id }}</p>
                                        </template>
                                    </Column>
                                    <Column field="name" :header="t('labels.name')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ data.product.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ data.product.code }}</p>
                                        </template>
                                    </Column>
                                    <Column field="category" :header="t('labels.category')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ data.product.category.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="type" :header="t('labels.type')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ data.product.category.categoryType.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="amount" :header="t('labels.amount')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ formatCurrency(data.amount) }} {{ t(`labels.${data.product.category.unit.name}`) }}</p>
                                        </template>
                                    </Column>
                                    <Column field="costPrice" :header="t('labels.costPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column field="wholesalePrice" :header="t('priceInDollar')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ formatCurrency(data.wholesalePrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column field="retailPrice" :header="t('priceInSoum')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                            <p v-else>{{ formatCurrency(data.retailPrice) }} {{ t('soum') }}</p>
                                        </template>
                                    </Column>

                                    <template #footer>
                                        <div v-if="productStore.getIsLoadingProducts" class="flex justify-between">
                                            <Skeleton height="2rem" width="10rem" />
                                            <Skeleton height="2rem" width="5rem"/>
                                        </div>
                                        <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                            <PaginatorComponent
                                                v-model="filters.page"
                                                v-model:items-per-page="filters.itemsPerPage"
                                                :total-items="productStore.getResidualProducts.totalItems"
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
                                <NoData v-if="!kitStore.getResidualKits.totalItems && !kitStore.getIsLoadingKits" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-if="kitStore.getIsLoadingKits || kitStore.getResidualKits.totalItems > 0"
                                    ref="dt"
                                    :value="kitStore.getIsLoadingKits ? Array(10).fill({}) : kitStore.getResidualKits.models"
                                    scrollable
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50"
                                >
                                    <Column field="id" :header="t('labels.id')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                            <p v-else>{{ data.kit.id }}</p>
                                        </template>
                                    </Column>
                                    <Column field="name" :header="t('labels.name')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                            <p v-else>{{ data.kit.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                            <p v-else>{{ data.kit.code }}</p>
                                        </template>
                                    </Column>
                                    <Column field="amount" :header="t('labels.amount')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                            <p v-else>{{ formatCurrency(data.amount) }} {{ t(`labels.pcs`) }}</p>
                                        </template>
                                    </Column>
                                    <Column field="costPrice" :header="t('labels.costPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                            <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column field="wholesalePrice" :header="t('priceInDollar')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                            <p v-else>{{ formatCurrency(data.wholesalePrice) }}$</p>
                                        </template>
                                    </Column>
                                    <Column field="retailPrice" :header="t('priceInSoum')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                            <p v-else>{{ formatCurrency(data.retailPrice) }} {{ t('soum') }}</p>
                                        </template>
                                    </Column>
                                    <Column field="id" style="width: 60px;">  <!-- Fixed width for the column -->
                                        <template #header>
                                            <p class="font-semibold">{{ t('details') }}</p>
                                        </template>
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                            <div v-else>
                                                <div class="flex justify-center w-full">
                                                    <Button
                                                        @click="router.push({
                                                            name: 'kit',
                                                            params: { id: data.kit.id },
                                                        })"
                                                        icon="pi pi-eye"
                                                        pt:root="rounded-full size-8! min-w-8! h-8! bg-blue-400 dark:bg-blue-400 enabled:hover:bg-blue-300 dark:enabled:hover:bg-blue-300 border-blue-400 dark:border-blue-400 enabled:hover:border-blue-300 dark:enabled:hover:border-blue-300 focus-visible:outline-blue-400 dark:focus-visible:outline-blue-400"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>

                                    <template #footer>
                                        <div v-if="kitStore.getIsLoadingKits" class="flex justify-between">
                                            <Skeleton height="2rem" width="10rem" />
                                            <Skeleton height="2rem" width="5rem"/>
                                        </div>
                                        <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                            <PaginatorComponent
                                                v-model="filters.page"
                                                v-model:items-per-page="filters.itemsPerPage"
                                                :total-items="kitStore.getResidualKits.totalItems"
                                            />
                                        </div>
                                    </template>
                                </DataTable>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
        </template>
    </Section>
</template>
