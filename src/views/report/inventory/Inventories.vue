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
import {useInventoryStore} from "@/stores/inventory.js";
import {computed, onMounted, ref, watch} from "vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import {useToast} from "primevue/usetoast";
import Breadcrumb from "@/volt/Breadcrumb.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const inventoryStore = useInventoryStore()

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("reports"),
    route: "/reports",
}));
const items = computed(() => [{ label: t("cards.inventories") }]);

const debouncedFilter = useDebouncedRef(route.query.name || null, 500);
const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10
});

watch(
    [() => debouncedFilter.value, () => filters.value],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage
        };

        if (debouncedFilter.value !== null) {
            queryFilter.name = debouncedFilter.value;
        }

        if (debouncedFilter.value === "") {
            delete queryFilter.name;
        }

        await updateQuery(queryFilter);

        await inventoryStore.fetchInventories(route.query);
    },
    { immediate: true, deep: true },
);

async function updateQuery(newParams) {
    await router.push({
        query: {
            ...newParams,
        },
    });
}

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 20) {
            await inventoryStore.fetchInventories(route.query);
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
        :section-name="t('cards.inventory')"
        back-route-name="reports"
        without-buttons
    >
        <template #sectionBody>
            <!-- FILTERS OF TABLE ITEMS -->

            <NoData v-if="!inventoryStore.getInventories.totalItems && !inventoryStore.getIsLoadingInventories" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-if="inventoryStore.getIsLoadingInventories || inventoryStore.getInventories.totalItems > 0"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        ref="data-table"
                        :value="inventoryStore.getIsLoadingInventories ?  Array(10).fill({}) : inventoryStore.getInventories.models"
                        :total-records="inventoryStore.getInventories.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="inventoryStore.getIsLoadingInventories"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="location" :header="t('labels.locations')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="inventoryStore.getIsLoadingInventories"/>
                                <p v-else>{{ data.location.name }}</p>
                            </template>
                        </Column>
                        <Column field="status" :header="t('labels.status')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="inventoryStore.getIsLoadingInventories"/>
                                <p v-else>{{ t(data.status) }}</p>
                            </template>
                        </Column>
                        <Column field="dateFrom" :header="t('labels.dateFrom')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="inventoryStore.getIsLoadingInventories"/>
                                <p v-else>{{ data.dateFrom }}</p>
                            </template>
                        </Column>
                        <Column field="dateTo" :header="t('labels.dateTo')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="inventoryStore.getIsLoadingInventories"/>
                                <p v-else>{{ data.dateTo }}</p>
                            </template>
                        </Column>
                        <Column field="responsible" :header="t('labels.responsible')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="inventoryStore.getIsLoadingInventories"/>
                                <p v-else>{{ data.createdBy.name }}</p>
                            </template>
                        </Column>
                        <Column field="id" class="flex justify-end">
                            <template #header>
                                <p class="font-semibold">{{ t('actions') }}</p>
                            </template>
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="inventoryStore.getIsLoadingInventories"/>
                                <div v-else>
                                    <div class="flex items-center gap-2">
                                        <Button
                                            @click="router.push({
                                                name: 'inventory',
                                                params: { id: data.id },
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
                            <div v-if="inventoryStore.getIsLoadingInventories" class="flex justify-between">
                                <Skeleton height="2rem" width="10rem" />
                                <Skeleton height="2rem" width="5rem"/>
                            </div>
                            <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                <PaginatorComponent
                                    v-model="filters.page"
                                    v-model:items-per-page="filters.itemsPerPage"
                                    :total-items="inventoryStore.getInventories.totalItems"
                                />
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
