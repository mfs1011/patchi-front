<script setup>
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";
import NoData from "@/components/UI/NoData.vue";
import Dialog from "@/volt/Dialog.vue";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import DataTable from "@/volt/DataTable.vue";
import Column from "primevue/column";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import InputText from "@/volt/InputText.vue";
import SelectButton from "@/volt/SelectButton.vue";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import {useToast} from "primevue/usetoast";
import Skeleton from "@/volt/Skeleton.vue";
import {useCategoryStore} from "@/stores/category.js";
import Select from "@/volt/Select.vue";
import {useCategoryTypeStore} from "@/stores/categoryType.js";
import {useUnitStore} from "@/stores/unit.js";
import updateQuery from "@/helpers/updateQuery.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const categoryStore = useCategoryStore()
const categoryTypeStore = useCategoryTypeStore()
const unitStore = useUnitStore()

// refs
const visible = ref({
    deleteVisible: false,
    restoreVisible: false,
});

const isVisibleSectionHeader = ref(false);
const isDeleteLoading = ref(false);
const currentCategoryId = ref();
const debouncedFilter = useDebouncedRef(route.query.name || null, 500);

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    isDelete: route.query['is-delete'] || false,
    categoryType: route.query['categoryType'] || null,
    unit: route.query['unit'] || null
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
const items = computed(() => [{ label: t("cards.categories") }]);
const options = computed(() => [t('active'), t('archive')]);
const units = computed(() => unitStore.getUnits.models.map(unit => {
    return {
        ...unit,
        name: t(`labels.${unit.name}`)
    }
}))
// watchers

watch(archiveOrActive, (newVal) => {
    filters.value.isDelete = newVal !== t('active')
    filters.value.page = 1
})

watch(
    [() => debouncedFilter.value, () => filters.value],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage,
            "is-delete": filters.value.isDelete,
        };

        if (debouncedFilter.value !== null) {
            queryFilter.name = debouncedFilter.value;
        }

        if (debouncedFilter.value === "") {
            delete queryFilter.name;
        }

        if (filters.value.unit !== null) {
            queryFilter.unit = filters.value.unit
        }

        if (filters.value.categoryType !== null) {
            queryFilter.categoryType = filters.value.categoryType;
        }

        await updateQuery(router, queryFilter);

        await categoryStore.fetchCategories(route.query);
    },
    { immediate: true, deep: true },
);

const deleteAction = (id) => {
    currentCategoryId.value = id;
    visible.value.deleteVisible = true;
};

const restoreAction = (id) => {
    currentCategoryId.value = id;
    visible.value.restoreVisible = true;
};

const deleteLocation = async () => {
    isDeleteLoading.value = true;
    await categoryStore.deleteCategory(currentCategoryId.value);
    toast.add({ severity: 'success', summary: t('toast.deleted', { name: t('categories.nominativeCapitalize') }), life: 3000 })
    isDeleteLoading.value = false;
    visible.value.deleteVisible = false;
};

const restoreLocation = async () => {
    isDeleteLoading.value = true;
    await categoryStore.restoreCategory(currentCategoryId.value);
    isDeleteLoading.value = false;
    visible.value.restoreVisible = false;
    toast.add({ severity: 'success', summary: t('toast.restored', { name: t('categories.nominativeCapitalize') }), life: 3000 })
};

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 2) {
            await categoryStore.fetchCategories(route.query);
        }
    })
}

onMounted(() => {
    if (!categoryTypeStore.getCategoryTypes.models.length) {
        categoryTypeStore.fetchCategoryTypes()
    }

    if (!unitStore.getUnits.models.length) {
        unitStore.fetchUnits()
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
        :add-button-name="t('buttons.newCategory')"
        :section-name="t('cards.categories')"
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
                    @click="router.push({ name: 'add-category' })"
                    class="px-2 sm:px-5 whitespace-nowrap"
                >
                    {{ t("buttons.newCategory") }}
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
                    {{ t("buttons.newCategory") }}
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
                <div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 items-center">
                    <div>
                        <label class="relative max-w-full w-full">
                            <i class="pi pi-search absolute top-1/2 -mt-2 text-surface-400 leading-none start-3 z-1"/>
                            <InputText
                                pt:root="dark:bg-surface-800 ps-10"
                                v-model="debouncedFilter"
                                class="w-full"
                                :placeholder="t('placeholders.search.byTitle')"
                            />
                        </label>
                    </div>
                    <div>
                        <Select
                            v-model="filters.categoryType"
                            :options="categoryTypeStore.getCategoryTypes.models"
                            option-label="name"
                            option-value="id"
                            :placeholder="t('placeholders.search.byCategoryType')"
                            showClear
                            class="w-full"
                        />
                    </div>
                    <div>
                        <Select
                            v-model="filters.unit"
                            :options="units"
                            option-label="name"
                            option-value="id"
                            :placeholder="t('placeholders.search.byUnit')"
                            showClear
                            class="w-full"
                        />
                    </div>

                    <div class="flex justify-end col-span-1 md:col-span-1 lg:col-span-3 xl:col-span-1">
                        <SelectButton v-model="archiveOrActive" :options="options" />
                    </div>
                </div>
            </div>
        </template>

        <template #sectionBody>
            <!-- FILTERS OF TABLE ITEMS -->

            <NoData v-if="!categoryStore.getCategories.totalItems && !categoryStore.getIsLoadingCategory" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-if="categoryStore.getIsLoadingCategory || categoryStore.getCategories.totalItems > 0"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        ref="data-table"
                        :value="categoryStore.getIsLoadingCategory ?  Array(10).fill({}) : categoryStore.getCategories.models"
                        :total-records="categoryStore.getCategories.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="categoryStore.getIsLoadingCategory"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="name" :header="t('labels.categoryName')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="categoryStore.getIsLoadingCategory"/>
                                <p v-else>{{ data.name }}</p>
                            </template>
                        </Column>
                        <Column field="categoryType" :header="t('labels.categoryType')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="categoryStore.getIsLoadingCategory"/>
                                <p v-else>{{ data.categoryType.name }}</p>
                            </template>
                        </Column>
                        <Column field="unit" :header="t('labels.unit')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="categoryStore.getIsLoadingCategory"/>
                                <p v-else>{{ t(`labels.${data.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="id" class="flex justify-end">
                            <template #header>
                                <p class="font-semibold">{{ t('actions') }}</p>
                            </template>
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="categoryStore.getIsLoadingCategory"/>

                                <div v-else>
                                    <div v-if="route.query['is-delete'] === 'false'" class="flex items-center gap-2">
                                        <Button
                                            @click="router.push({
                                            name: 'edit-category',
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
                                </div>
                            </template>
                        </Column>

                        <template #footer>
                            <div v-if="categoryStore.getIsLoadingCategory" class="flex justify-between">
                                <Skeleton height="2rem" width="10rem" />
                                <Skeleton height="2rem" width="5rem"/>
                            </div>
                            <div v-else class="flex flex-wrap items-center justify-end gap-5">
                                <PaginatorComponent
                                    v-model="filters.page"
                                    v-model:items-per-page="filters.itemsPerPage"
                                    :total-items="categoryStore.getCategories.totalItems"
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
                        {{ t('dialog.deleteConfirmation', { name: t('categories.accusative'), id: currentCategoryId }) }}
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
                        {{ t('dialog.recoverConfirmation', { name: t('categories.accusative'), id: currentCategoryId }) }}
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
