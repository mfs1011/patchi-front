<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";
import {formatPhoneByCountry} from "@/helpers/phoneFormat.js";
import NoData from "@/components/UI/NoData.vue";
import Dialog from "@/volt/Dialog.vue";
import Button from "@/volt/Button.vue";
import Loader from "@/components/Loader.vue";
import Card from "@/volt/Card.vue";
import DataTable from "@/volt/DataTable.vue";
import Column from "primevue/column";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import InputText from "@/volt/InputText.vue";
import SelectButton from "@/volt/SelectButton.vue";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {useRoute, useRouter} from "vue-router";
import {useCustomerStore} from "@/stores/customer.js";
import {useLocationStore} from "@/stores/location.js";
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import useDebouncedRef from "@/composables/useDebouncedRef.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const locationStore = useLocationStore()

// refs
const visible = ref({
    deleteVisible: false,
    restoreVisible: false,
});

const isVisibleSectionHeader = ref(false);
const isDeleteLoading = ref(false);
const currentCustomerId = ref();
const debouncedFilter = useDebouncedRef(route.query.name || null, 500);

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    isDelete: route.query['is-delete'] || false,
});

const archiveOrActive = computed({
    get() {
        const isDeleted = route.query['is-delete']
        return (isDeleted === 'true' || isDeleted === true)
            ? t('archive')
            : t('active')
    },
    set(val) {
        const query = { ...route.query }
        query['is-delete'] = val === t('archive')
        router.replace({ query })
    }
})

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("administration"),
    route: "/administration",
}));
const items = computed(() => [{ label: t("cards.warehouses") }]);
const options = computed(() => [t('active'), t('archive')]);
// watchers

watch(archiveOrActive, (newVal) => {
    filters.value.isDelete = newVal !== t('active')
})

watch(
    [() => debouncedFilter.value, () => filters.value],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage,
            "is-delete": filters.value.isDelete
        };

        if (debouncedFilter.value !== null) {
            queryFilter.name = debouncedFilter.value;
        }

        if (debouncedFilter.value === "") {
            delete queryFilter.name;
        }

        await updateQuery(queryFilter);

        await locationStore.fetchLocations({ ...route.query, isWarehouse: true});
    },
    { immediate: true, deep: true },
);

// Functions
async function updateQuery(newParams) {
    await router.push({
        query: {
            ...newParams,
        },
    });
}

const deleteAction = (id) => {
    currentCustomerId.value = id;
    visible.value.deleteVisible = true;
};

const restoreAction = (id) => {
    currentCustomerId.value = id;
    visible.value.restoreVisible = true;
};

const deleteLocation = async () => {
    isDeleteLoading.value = true;
    await locationStore.deleteLocation(currentCustomerId.value);
    await locationStore.fetchLocations({ ...route.query, isWarehouse: true});
    isDeleteLoading.value = false;
    visible.value.deleteVisible = false;
};

const restoreLocation = async () => {
    isDeleteLoading.value = true;
    await locationStore.restoreLocation(currentCustomerId.value);
    await locationStore.fetchLocations({ ...route.query, isWarehouse: true});
    isDeleteLoading.value = false;
    visible.value.restoreVisible = false;
};

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {

        if (JSON.parse(event.data).eventId === 8) {
            await locationStore.fetchLocations({ ...route.query, isWarehouse: true});
        }

        if (JSON.parse(event.data).eventId === 88) {
            await locationStore.fetchLocations({ ...route.query, isWarehouse: true});
        }
    })
}

onMounted(() => {
    connectMercure()
})

onBeforeUnmount(() => {
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
        :add-button-name="t('buttons.newWarehouse')"
        :section-name="t('cards.warehouses')"
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
                    @click="router.push({ name: 'add-warehouse' })"
                    class="px-2 sm:px-5 whitespace-nowrap"
                >
                    {{ t("buttons.newWarehouse") }}
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
                    @click="router.push({ name: 'add-warehouse' })"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                >
                    {{ t("buttons.newWarehouse") }}
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
                <div class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-2 sm:gap-y-4 sm:gap-x-0 items-center">
                    <div class="col-span-2 sm:col-span-1">
                        <label class="relative max-w-full w-full">
                            <i class="pi pi-search absolute top-1/2 -mt-2 text-surface-400 leading-none start-3 z-1"/>
                            <InputText
                                pt:root="dark:bg-surface-800 ps-10"
                                v-model="debouncedFilter"
                                class="w-full"
                                :placeholder="t('placeholders.search.byName')"
                            />
                        </label>
                    </div>

                    <div class="flex justify-end col-span-2 md:col-span-1 lg:col-span-1 xl:col-span-2">
                        <SelectButton v-model="archiveOrActive" :options="options" />
                    </div>
                </div>
            </div>
        </template>

        <template #sectionBody>
            <!-- FILTERS OF TABLE ITEMS -->
            <Loader v-if="locationStore.getIsLoadingLocation" class="my-auto" />

            <NoData v-else-if="!locationStore.getLocations.totalItems" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-else
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        ref="data-table"
                        :value="locationStore.getLocations.models"
                        :total-records="locationStore.getLocations.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                        :loading="locationStore.getIsLoadingLocation"
                    >
                        <Column field="id" :header="t('labels.id')"></Column>
                        <Column field="name" :header="t('labels.warehouseName')"></Column>
                        <Column field="id" class="flex justify-end">
                            <template #header>
                                <p class="font-semibold">{{ t('actions') }}</p>
                            </template>
                            <template #body="{ data }">
                                <div v-if="route.query['is-delete'] === 'false'" class="flex items-center gap-2">
                                    <Button
                                        @click="router.push({
                                        name: 'edit-warehouse',
                                        params: { id: data.id },
                                    })"
                                        icon="pi pi-pencil"
                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                        size="small"
                                    />
                                    <Button
                                        @click="deleteAction(data.id)"
                                        icon="pi pi-trash"
                                        pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                        size="small"
                                    />
                                </div>
                                <div v-else class="flex items-center gap-2">
                                    <Button
                                        @click="restoreAction(data.id)"
                                        icon="pi pi-replay"
                                        pt:root="rounded-full size-8! bg-teal-500 dark:bg-teal-500 enabled:hover:bg-teal-400 dark:enabled:hover:bg-teal-400 border-teal-500 dark:border-teal-500 enabled:hover:border-teal-400 dark:enabled:hover:border-teal-400 focus-visible:outline-teal-500 dark:focus-visible:outline-teal-500"
                                        size="small"
                                    />
                                </div>
                            </template>
                        </Column>

                        <template #footer>
                            <div class="flex flex-wrap items-center justify-end gap-5">
                                <PaginatorComponent
                                    v-model="filters.page"
                                    v-model:items-per-page="filters.itemsPerPage"
                                    :total-items="locationStore.getLocations.totalItems"
                                />
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>
            <!-- DELETE B2B DIALOG -->
            <Dialog
                v-model:visible="visible.deleteVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                    <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                        {{ t('dialog.deleteConfirmation', { name: t('warehouses.accusative'), id: currentCustomerId }) }}
                    </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="visible.deleteVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteLocation"
                            :loading="isDeleteLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>

            <!-- RECOVER B2B DIALOG -->
            <Dialog
                v-model:visible="visible.restoreVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                    <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                        {{ t('dialog.recoverConfirmation', { name: t('warehouses.accusative'), id: currentCustomerId }) }}
                    </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="visible.restoreVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="restoreLocation"
                            :loading="isDeleteLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
        </template>
    </Section>
</template>
