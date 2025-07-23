<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";
import NoData from "@/components/UI/NoData.vue";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import DataTable from "@/volt/DataTable.vue";
import Column from "primevue/column";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import Skeleton from "@/volt/Skeleton.vue";
import updateQuery from "@/helpers/updateQuery.js";
import {getFormattedDate} from "@/helpers/numberFormat.js";
import DatePicker from "@/volt/DatePicker.vue";
import Tabs from '@/volt/Tabs.vue';
import TabList from '@/volt/TabList.vue';
import Tab from '@/volt/Tab.vue';
import TabPanels from '@/volt/TabPanels.vue';
import TabPanel from '@/volt/TabPanel.vue';
import {useKpiPercentStore} from "@/stores/kpiPercent.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const kpiPercentStore = useKpiPercentStore()

// refs
const isVisibleSectionHeader = ref(false);
const tabVal = ref('order');

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
const items = computed(() => [{ label: t("cards.kpi") }]);

const isCategory = computed(() => tabVal.value === 'category')
// watchers

watch(
    [() => filters.value, () => tabVal.value],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage
        };

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

        await kpiPercentStore.fetchKpiPercents(route.query, tabVal.value);
    },
    { immediate: true, deep: true },
);

const tabList = computed(() => [
    { value: 'order', label: t('labels.orderKpiPercent')},
    { value: 'kit', label: t('labels.kitKpiPercent')},
    { value: 'category', label: t('labels.categoryKpiPercent')}
])

const tabPanels = computed(() => [
    { value: 'order' },
    { value: 'kit' },
    { value: 'category' }
])

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        const validCombinations = [
            { id: 12, tab: 'order' },
            { id: 3, tab: 'kit' },
            { id: 14, tab: 'category' },
        ];

        if (validCombinations.some(combination => combination.id === eventDataId && combination.tab === tabVal.value)) {
            await kpiPercentStore.fetchKpiPercents(route.query, tabVal.value);
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
        :add-button-name="t('buttons.newKpi')"
        :section-name="t('cards.kpi')"
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
                <Button
                    @click="router.push({ name: 'add-kpi', params: { entity: tabVal} })"
                    class="px-2 sm:px-5 whitespace-nowrap"
                >
                    {{ t("buttons.newKpi") }}
                </Button>
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
                    @click="router.push({ name: 'add-kpi', params: { entity: tabVal} })"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                >
                    {{ t("buttons.newKpi") }}
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
                <div class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 items-center">
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
            <!-- TABLE OF USERS -->
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
                            <TabPanel v-for="panel of tabPanels" :key="panel.value" :value="panel.value" class="h-full">
                                <DataTable
                                    v-if="kpiPercentStore.getIsLoadingKpiPercents || kpiPercentStore.getKpiPercents.totalItems > 0"
                                    :value="kpiPercentStore.getIsLoadingKpiPercents ?  Array(10).fill({}) : kpiPercentStore.getKpiPercents.models"
                                    :total-records="kpiPercentStore.getKpiPercents.totalItems"
                                    :rows="filters.itemsPerPage"
                                    scrollable
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50"
                                >
                                    <Column field="id" :header="t('labels.id')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kpiPercentStore.getIsLoadingKpiPercents"/>
                                            <p v-else>{{ data.id }}</p>
                                        </template>
                                    </Column>
                                    <template v-if="isCategory">
                                        <Column field="category.name" :header="t('labels.category')">
                                            <template #body="{ data }">
                                                <Skeleton height="2rem" v-if="kpiPercentStore.getIsLoadingKpiPercents"/>
                                                <p v-else-if="data?.category">{{ data.category.name }}</p>
                                            </template>
                                        </Column>
                                    </template>
                                    <Column field="kpiPercent" :header="t('labels.kpiPercent')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kpiPercentStore.getIsLoadingKpiPercents"/>
                                            <p v-else>{{ data.kpiPercent }}%</p>
                                        </template>
                                    </Column>
                                    <Column field="createdAt" :header="t('labels.createdAt')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kpiPercentStore.getIsLoadingKpiPercents"/>
                                            <p v-else>{{ getFormattedDate(data.createdAt) }}</p>
                                        </template>
                                    </Column>

                                    <Column field="id" class="flex justify-end">
                                        <template #header>
                                            <p class="font-semibold">{{ t('actions') }}</p>
                                        </template>
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="kpiPercentStore.getIsLoadingKpiPercents"/>

                                            <div v-else>
                                                <div class="flex items-center gap-2">
                                                    <Button
                                                        @click="router.push({
                                                            name: 'edit-kpi',
                                                            params: { entity: tabVal, id: data.id },
                                                        })"
                                                        icon="pi pi-pencil"
                                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>

                                    <template #footer>
                                        <div v-if="kpiPercentStore.getIsLoadingKpiPercents" class="flex justify-between">
                                            <Skeleton height="2rem" width="10rem" />
                                            <Skeleton height="2rem" width="5rem"/>
                                        </div>
                                        <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                            <PaginatorComponent
                                                v-model="filters.page"
                                                v-model:items-per-page="filters.itemsPerPage"
                                                :total-items="kpiPercentStore.getKpiPercents.totalItems"
                                            />
                                        </div>
                                    </template>
                                </DataTable>


                                <NoData v-if="!kpiPercentStore.getKpiPercents.totalItems && !kpiPercentStore.getIsLoadingKpiPercents" class="text-surface-400 mx-auto my-auto h-full">
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
