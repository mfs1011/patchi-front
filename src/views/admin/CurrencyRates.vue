<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";
import NoData from "@/components/UI/NoData.vue";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import DataTable from "@/volt/DataTable.vue";
import Column from "primevue/column";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import InputText from "@/volt/InputText.vue";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {useRoute, useRouter} from "vue-router";
import {computed, ref, watch} from "vue";
import Skeleton from "@/volt/Skeleton.vue";
import updateQuery from "@/helpers/updateQuery.js";
import {useUSDRateStore} from "@/stores/usdRate.js";
import {formatCurrency, getFormattedDate} from "@/helpers/numberFormat.js";
import DatePicker from "@/volt/DatePicker.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const USDRateStore = useUSDRateStore()

// refs
const isVisibleSectionHeader = ref(false);

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    'date-from': route.query['date-from'] || null,
    'date-to': route.query['date-to'] || null,
});

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("administration"),
    route: "/administration",
}));
const items = computed(() => [{ label: t("cards.currencyRates") }]);
// watchers

watch(
    filters,
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage
        };

        if (filters.value['date-from'] !== null) {
            const date = new Date(filters.value['date-from']);
            date.setHours(date.getHours() + 5);
            queryFilter['date-from'] = date.toISOString();
        }

        if (filters.value['date-from'] === "") {
            delete queryFilter['date-from'];
        }

        if (filters.value['date-to'] !== null) {
            const date = new Date(filters.value['date-to']);
            date.setHours(date.getHours() + 5);
            queryFilter['date-to'] = date.toISOString();
        }

        if (filters.value['date-to'] === "") {
            delete queryFilter['date-to'];
        }

        await updateQuery(router, queryFilter);

        await USDRateStore.fetchUSDRates(route.query);
    },
    { immediate: true, deep: true },
);

const customLocale = {
    firstDayOfWeek: 1,
    dayNames: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
    dayNamesShort: ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha'],
    dayNamesMin: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
    monthNames: [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ],
    monthNamesShort: [
        'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn',
        'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ],
    today: 'Bugun',
    clear: 'Tozalash',
};
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
        without-buttons
        :section-name="t('cards.currencyRates')"
        back-route-name="administration"
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
                <Button
                    @click="router.push({ name: 'add-color' })"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                >
                    {{ t("buttons.newColor") }}
                </Button>
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
                <div class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 items-center">
                    <DatePicker
                        v-model="filters['date-from']"
                        dateFormat="dd.mm.yy"
                        showIcon
                        fluid
                        iconDisplay="input"
                        :placeholder="t('placeholders.search.byDateFrom')"
                        :locale="customLocale"
                    />
                    <DatePicker
                        v-model="filters['date-to']"
                        dateFormat="dd.mm.yy"
                        showIcon
                        fluid
                        iconDisplay="input"
                        :placeholder="t('placeholders.search.byDateTo')"
                        :locale="customLocale"
                    />
                </div>
            </div>
        </template>

        <template #sectionBody>
            <!-- FILTERS OF TABLE ITEMS -->

            <NoData v-if="!USDRateStore.getUSDRates.totalItems && !USDRateStore.getIsLoadingUSDRate" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-if="USDRateStore.getIsLoadingUSDRate || USDRateStore.getUSDRates.totalItems > 0"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        ref="data-table"
                        :value="USDRateStore.getIsLoadingUSDRate ?  Array(10).fill({}) : USDRateStore.getUSDRates.models"
                        :total-records="USDRateStore.getUSDRates.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="USDRateStore.getIsLoadingUSDRate"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="name" :header="t('labels.usdRate')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="USDRateStore.getIsLoadingUSDRate"/>
                                <p v-else>{{ formatCurrency(data.rate) }} UZS</p>
                            </template>
                        </Column>
                        <Column field="createdAt" :header="t('labels.createdAt')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="USDRateStore.getIsLoadingUSDRate"/>
                                <p v-else>{{ getFormattedDate(data.createdAt) }}</p>
                            </template>
                        </Column>

                        <template #footer>
                            <div v-if="USDRateStore.getIsLoadingUSDRate" class="flex justify-between">
                                <Skeleton height="2rem" width="10rem" />
                                <Skeleton height="2rem" width="5rem"/>
                            </div>
                            <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                <PaginatorComponent
                                    v-model="filters.page"
                                    v-model:items-per-page="filters.itemsPerPage"
                                    :total-items="USDRateStore.getUSDRates.totalItems"
                                />
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
