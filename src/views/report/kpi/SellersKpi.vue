<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";
import DataTable from "@/volt/DataTable.vue";
import NoData from "@/components/UI/NoData.vue";
import Card from "@/volt/Card.vue";
import Column from "primevue/column";
import Skeleton from "@/volt/Skeleton.vue";
import {computed, onMounted, reactive, ref, watch} from "vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import updateQuery from "@/helpers/updateQuery.js";
import {useSellerStore} from "@/stores/seller.js";
import {formatCurrency} from "@/helpers/numberFormat.js";
import InputText from "@/volt/InputText.vue";
import Select from "@/volt/Select.vue";
import Button from "@/volt/Button.vue";
import {useLocationStore} from "@/stores/location.js";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {exportSellersKpi} from "@/helpers/xlsx.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const isVisibleSectionHeader = ref(false);

const years = computed(() => {
    const currentYear = new Date().getFullYear();
    const range = 10;
    return Array.from({ length: range + 1 }, (_, i) => {
        const year = currentYear - i;
        return {
            id: year,
            name: String(year),
        };
    });
});

const sellerStore = useSellerStore()
const locationStore = useLocationStore()

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("reports"),
    route: "/reports",
}));

const exportCSV = () => {
    exportSellersKpi(formattedRows.value)
};

const items = computed(() => [{ label: t("cards.sellerKpi") }]);

const debouncedFilter = useDebouncedRef(route.query.name || null, 500);

const filters = ref({
    year: parseInt(route.query.year) || new Date().getFullYear(),
    location: parseInt(route.query.location) || null,
});

watch(
    [() => debouncedFilter.value, () => filters.value],
    async () => {
        const queryFilter = {
            "year": filters.value.year
        };

        if (debouncedFilter.value !== null) {
            queryFilter.name = debouncedFilter.value;
        }

        if (debouncedFilter.value === "") {
            delete queryFilter.name;
        }

        if (filters.value.location !== null) {
            queryFilter.location = filters.value.location;
        } else {
            delete queryFilter.location;
        }

        await updateQuery(router, queryFilter);

        await sellerStore.fetchSellersKpi(route.query);
    },
    { immediate: true, deep: true },
);

const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

const formattedRows = computed(() => {
    const rows = []

    sellerStore.getSellersKpi.models.forEach(entry => {
        const date = new Date(entry.period)
        const monthIndex = date.getMonth()
        const monthName = monthNames[monthIndex]

        entry.sellers.forEach(seller => {
            rows.push({
                id: seller.id,
                seller: seller.name,
                location: seller.location.name,
                month: monthName,
                kitsKpi: seller.kitsKpi,
                orderInvoicesKpi: seller.orderInvoicesKpi,
                categoriesKpi: seller.categoriesKpi,
            })
        })
    })

    return rows
})

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 13) {
            await sellerStore.fetchSellersKpi(route.query);
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
        :section-name="t('cards.sellerKpi')"
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
                <div class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 items-center">
                    <div>
                        <label class="relative max-w-full w-full">
                            <i class="pi pi-search absolute top-1/2 -mt-2 text-surface-400 leading-none start-3 z-1"/>
                            <InputText
                                pt:root="ps-10"
                                v-model="debouncedFilter"
                                class="w-full"
                                :placeholder="t('placeholders.search.byName')"
                            />
                        </label>
                    </div>
                    <div>
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
                    </div>
                    <div>
                        <Select
                            v-model="filters.year"
                            :options="years"
                            option-label="name"
                            option-value="id"
                            :placeholder="t('placeholders.search.byDateFrom')"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>
        </template>

        <template #sectionBody>
            <NoData v-if="!sellerStore.getSellersKpi.totalItems && !sellerStore.getIsLoadingSellers" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-if="sellerStore.getIsLoadingSellers || sellerStore.getSellersKpi.totalItems > 0"
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
                        :value="sellerStore.getIsLoadingSellers ?  Array(10).fill({}) : formattedRows"
                        :total-records="sellerStore.getSellersKpi.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="sellerStore.getIsLoadingSellers"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="location" :header="t('roles.seller')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="sellerStore.getIsLoadingSellers"/>
                                <p v-else>{{ data.seller }}</p>
                            </template>
                        </Column>
                        <Column field="dateFrom" :header="t('labels.locations')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="sellerStore.getIsLoadingSellers"/>
                                <p v-else>{{ data.location }}</p>
                            </template>
                        </Column>
                        <Column field="id" :header="t('labels.month')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="sellerStore.getIsLoadingSellers"/>
                                <p v-else>{{ t(data.month) }}</p>
                            </template>
                        </Column>
                        <Column field="dateFrom" :header="t('labels.forTheKit')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="sellerStore.getIsLoadingSellers"/>
                                <p v-else>{{ formatCurrency(Math.round(data.kitsKpi)) }}$</p>
                            </template>
                        </Column>
                        <Column field="dateFrom" :header="t('labels.forTheOrder')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="sellerStore.getIsLoadingSellers"/>
                                <p v-else>{{ formatCurrency(Math.round(data.orderInvoicesKpi)) }}$</p>
                            </template>
                        </Column>
                        <Column field="dateFrom" :header="t('labels.forTheCategory')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="sellerStore.getIsLoadingSellers"/>
                                <p v-else>{{ formatCurrency(Math.round(data.categoriesKpi)) }}$</p>
                            </template>
                        </Column>
                        <Column field="dateFrom" :header="t('labels.total')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="sellerStore.getIsLoadingSellers"/>
                                <p v-else>{{ formatCurrency(Math.round(data.kitsKpi + data.orderInvoicesKpi + data.categoriesKpi)) }}$</p>
                            </template>
                        </Column>

                        <template #footer>
                            <div v-if="sellerStore.getIsLoadingSellers" class="flex justify-between">
                                <Skeleton height="2rem" width="10rem" />
                                <Skeleton height="2rem" width="5rem"/>
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
