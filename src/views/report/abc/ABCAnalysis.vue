<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";
import DataTable from "@/volt/DataTable.vue";
import NoData from "@/components/UI/NoData.vue";
import Card from "@/volt/Card.vue";
import Column from "primevue/column";
import Skeleton from "@/volt/Skeleton.vue";
import {computed, onMounted, ref, watch} from "vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {formatCurrency} from "@/helpers/numberFormat.js";
import updateQuery from "@/helpers/updateQuery.js";
import {useProductStore} from "@/stores/product.js";
import DatePicker from "@/volt/DatePicker.vue";
import Button from "@/volt/Button.vue";
import {exportAbcAnalysis} from "@/helpers/xlsx.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const isVisibleSectionHeader = ref(false);

const productStore = useProductStore()

const getCategoryClass = (category) => {
    switch (category) {
        case 'A':
            return 'text-green-600 font-semibold';
        case 'B':
            return 'text-yellow-400 font-semibold';
        case 'C':
            return 'text-red-600 font-semibold';
        default:
            return '';
    }
};

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("reports"),
    route: "/reports",
}));

const dt = ref();
const exportCSV = () => {
    exportAbcAnalysis()
};

const items = computed(() => [{ label: t("cards.abc") }]);

const debouncedFilter = useDebouncedRef(route.query.name || null, 500);
const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(today.getMonth() - 1);

const filters = ref({
    'date-from': route.query['date-from'] || oneMonthAgo.toISOString(),
    'date-to': route.query['date-to'] || today.toISOString(),
});

watch(
    [() => debouncedFilter.value, () => filters.value],
    async () => {
        const queryFilter = {};

        const { 'date-from': dateFrom, 'date-to': dateTo } = filters.value;

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(5, 0, 0, 0);
            queryFilter['date-from'] = fromDate.toISOString();
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(5, 0, 0, 0);
            queryFilter['date-to'] = toDate.toISOString();
        }

        await updateQuery(router, queryFilter);
        await productStore.fetchABCProducts(route.query);
        console.log('mana')
    },
    { immediate: true, deep: true }
);

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 13) {
            await productStore.fetchABCProducts(route.query);
        }
    })
}

onMounted(() => {
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
        :section-name="t('cards.abc')"
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
                <div class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 items-center">
                    <DatePicker
                        v-model="filters['date-from']"
                        dateFormat="dd.mm.yy"
                        showIcon
                        fluid
                        iconDisplay="input"
                        :placeholder="t('placeholders.search.byDateFrom')"
                        show-button-bar
                    />
                    <DatePicker
                        v-model="filters['date-to']"
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
            <NoData v-if="!productStore.getABCProducts.totalItems && !productStore.getIsLoadingProducts" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-if="productStore.getIsLoadingProducts || productStore.getABCProducts.totalItems > 0"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
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
                    <DataTable
                        :value="productStore.getIsLoadingProducts ?  Array(10).fill({}) : productStore.getABCProducts.models"
                        :total-records="productStore.getABCProducts.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="product" :header="t('labels.product')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts"/>
                                <p v-else>{{ data.name }}</p>
                            </template>
                        </Column>
                        <Column field="sales" :header="t('labels.sales')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts" />
                                <p v-else>{{ formatCurrency(data.ordersQty) }} {{ t(`labels.${data.unit}`) }}</p>
                            </template>
                        </Column>
                        <Column field="revenue" :header="t('labels.revenue')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts" />
                                <p v-else>{{ formatCurrency(data.ordersPrice) }}$</p>
                            </template>
                        </Column>
                        <Column field="benefit" :header="t('labels.benefit')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts" />
                                <p v-else>{{ formatCurrency(data.benefit) }}$</p>
                            </template>
                        </Column>
                        <Column field="salesCategory" :header="t('labels.sales')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts" />
                                <p v-else :class="getCategoryClass(data.qtyCategory)">
                                    {{ data.qtyCategory }} {{ data.ordersQtyPercent.toFixed(2) }}%
                                </p>
                            </template>
                        </Column>

                        <Column field="revenueCategory" :header="t('labels.revenue')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts" />
                                <p v-else :class="getCategoryClass(data.priceCategory)">
                                    {{ data.priceCategory }} {{ data.ordersPricePercent.toFixed(2) }}%
                                </p>
                            </template>
                        </Column>

                        <Column field="benefitCategory" :header="t('labels.benefit')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="productStore.getIsLoadingProducts" />
                                <p v-else :class="getCategoryClass(data.benefitCategory)">
                                    {{ data.benefitCategory }} {{ data.benefitPercent.toFixed(2) }}%
                                </p>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
