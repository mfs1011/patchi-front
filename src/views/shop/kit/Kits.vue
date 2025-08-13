<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import {computed, onMounted, ref, watch} from "vue";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {formatCurrency, getFormattedDateWithTime} from "@/helpers/numberFormat.js";
import Skeleton from "@/volt/Skeleton.vue";
import Avatar from "@/volt/Avatar.vue";
import Column from "primevue/column";
import Button from "@/volt/Button.vue";
import Dialog from "@/volt/Dialog.vue";
import InputText from "@/volt/InputText.vue";
import DataTable from "@/volt/DataTable.vue";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import Select from "@/volt/Select.vue";
import Card from "@/volt/Card.vue";
import NoData from "@/components/UI/NoData.vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import {useAssemblyStore} from "@/stores/assembly.js";
import updateQuery from "@/helpers/updateQuery.js";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import {useKitStore} from "@/stores/kit.js";
import {useSellerStore} from "@/stores/seller.js";
import {useLocationStore} from "@/stores/location.js";
import DatePicker from "@/volt/DatePicker.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const kitStore = useKitStore()
const assemblyStore = useAssemblyStore()
const sellerStore = useSellerStore()
const locationStore = useLocationStore()

const visible = ref({
    imageVisible: false,
});

const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("shop"),
    route: "/shop",
}));

const items = computed(() => [{ label: t("cards.kits") }]);
const baseUrl = computed(() => import.meta.env.VITE_APP_API_URL);
const isVisibleSectionHeader = ref(false);
const currentKit = ref();
const debouncedName = useDebouncedRef(route.query['name'] || '',  500)

const filters = ref({
    page: parseInt(route.query.page) || 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 10,
    assembly: parseInt(route.query.assembly) || null,
    seller: parseInt(route.query.seller) || null,
    location: parseInt(route.query.location) || null,
    'date-from': route.query['date-from'] || null,
    'date-to': route.query['date-to'] || null
});

watch(
    [
        () => debouncedName.value,
        () => filters.value
    ],
    async () => {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage,
        };

        if (debouncedName.value !== null) {
            queryFilter.name = debouncedName.value;
        }

        if (debouncedName.value === "") {
            delete queryFilter.name;
        }

        if (filters.value.assembly !== null) {
            queryFilter.assembly = filters.value.assembly;
        } else {
            delete queryFilter.assembly;
        }

        if (filters.value.seller !== null) {
            queryFilter.seller = filters.value.seller;
        } else {
            delete queryFilter.seller;
        }

        if (filters.value.location !== null) {
            queryFilter.location = filters.value.location;
        } else {
            delete queryFilter.location;
        }

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

        await kitStore.fetchKits(route.query);
    },
    { immediate: true, deep: true },
);

const setCurrentKit = (kit) => {
    currentKit.value = kit;
    visible.value.imageVisible = true;
};

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 7) {
            await kitStore.fetchKits(route.query);
        }
    })
}

onMounted(async () => {
    if(!assemblyStore.getAssemblies.models.length) {
        await assemblyStore.fetchAssemblies()
    }

    if(!sellerStore.getSellers.models.length) {
        sellerStore.fetchSellers()
    }

    if(!locationStore.getLocations.models.length) {
        locationStore.fetchLocations()
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
        :add-button-name="t('buttons.newCollection')"
        :section-name="t('cards.kits')"
        back-route-name="shop"
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
                    @click="router.push({ name: 'add-kit' })"
                    class="px-2 sm:px-5 whitespace-nowrap"
                >
                    {{ t("buttons.newKit") }}
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
                    @click="router.push({ name: 'add-product' })"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                >
                    {{ t("buttons.newProduct") }}
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
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 items-center">
                    <div class="col-span-2 sm:col-span-1">
                        <label class="relative max-w-full w-full">
                            <i class="pi pi-search absolute top-1/2 -mt-2 text-surface-400 leading-none start-3 z-1"/>
                            <InputText
                                pt:root="dark:bg-surface-800 ps-10"
                                v-model="debouncedName"
                                class="w-full"
                                :placeholder="t('placeholders.search.byTitleAndQRAndCode')"
                            />
                        </label>
                    </div>

                    <Select
                        v-model="filters.assembly"
                        :options="assemblyStore.getAssemblies.models"
                        option-label="name"
                        option-value="id"
                        :placeholder="t('placeholders.search.byAssembly')"
                        showClear
                        class="col-span-2 sm:col-span-1 md:min-w-50 max-w-full w-full"
                    />
                    <Select
                        v-model="filters.seller"
                        :options="sellerStore.getSellers.models"
                        option-label="name"
                        option-value="id"
                        :placeholder="t('placeholders.search.bySeller')"
                        showClear
                        class="col-span-2 sm:col-span-1 md:min-w-50 max-w-full w-full"
                    />
                    <Select
                        v-model="filters.location"
                        :options="locationStore.getLocations.models"
                        option-label="name"
                        option-value="id"
                        :placeholder="t('placeholders.search.byLocation')"
                        showClear
                        class="col-span-2 sm:col-span-1 md:min-w-50 max-w-full w-full"
                    />
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
            <NoData v-if="!kitStore.getKits.totalItems && !kitStore.getIsLoadingKits" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-if="kitStore.getIsLoadingKits || kitStore.getKits.totalItems > 0"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        ref="dt"
                        :value="kitStore.getIsLoadingKits ?  Array(10).fill({}) : kitStore.getKits.models"
                        :total-records="kitStore.getKits.totalItems"
                        :rows="filters.itemsPerPage"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="photo" :header="t('labels.photo')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <Button @click="setCurrentKit(data)" pt:root="bg-[#ffffff] enabled:hover:bg-[#ffffff] p-0 border-none" v-else-if="data.photo">
                                    <Avatar :image="baseUrl + data.photo?.contentUrl" size="large" class="rounded overflow-hidden cursor-pointer hover:scale-110 transition-all"/>
                                </Button>
                                <div v-else> - </div>
                            </template>
                        </Column>
                        <Column field="name" :header="t('labels.name')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.name }}</p>
                            </template>
                        </Column>
                        <Column field="code" :header="t('labels.code')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.code }}</p>
                            </template>
                        </Column>
                        <Column field="qr" :header="t('labels.qr')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.qr || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="collection" :header="t('labels.collection')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.assembly?.name || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="seller" :header="t('labels.seller')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.seller.name }}</p>
                            </template>
                        </Column>
                        <Column field="locations" :header="t('labels.locations')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.seller.location.name }}</p>
                            </template>
                        </Column>
                        <Column field="costPrice" :header="t('labels.costPrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p
                                    v-else
                                    :class="{
                                        'text-green-600': data.costPrice < data.wholesalePrice,
                                        'text-red-600': data.costPrice >= data.wholesalePrice
                                   }"
                                >
                                    {{ data.costPrice ? `${formatCurrency(data.costPrice)}$` : '-' }}
                                </p>
                            </template>
                        </Column>
                        <Column field="retailPrice" :header="t('labels.retailPrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.retailPrice ? `${formatCurrency(data.retailPrice)}$` : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="wholesalePrice" :header="t('labels.wholesalePrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ data.wholesalePrice ? `${formatCurrency(data.wholesalePrice)}$` : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="amount" :header="t('labels.amount')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ formatCurrency(data.qty) }} {{ t('labels.pcs') }}</p>
                            </template>
                        </Column>
                        <Column field="createdAt" :header="t('labels.createdAt')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>
                                <p v-else>{{ getFormattedDateWithTime(data.createdAt) }}</p>
                            </template>
                        </Column>
                        <Column field="actions" :header="t('actions')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="kitStore.getIsLoadingKits"/>

                                <div v-else>
                                    <div class="flex items-center gap-2">
                                        <Button
                                            @click="router.push({
                                                name: 'edit-kit',
                                                params: { id: data.id },
                                            })"
                                            icon="pi pi-pencil"
                                            pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                            size="small"
                                        />
                                        <Button
                                            @click="router.push({
                                                name: 'kit',
                                                params: { id: data.id },
                                            })"
                                            icon="pi pi-eye"
                                            pt:root="rounded-full size-8! bg-blue-400 dark:bg-blue-400 enabled:hover:bg-blue-300 dark:enabled:hover:bg-blue-300 border-blue-400 dark:border-blue-400 enabled:hover:border-blue-300 dark:enabled:hover:border-blue-300 focus-visible:outline-blue-400 dark:focus-visible:outline-blue-400"
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
                                    :total-items="kitStore.getKits.totalItems"
                                />
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>

            <Dialog v-model:visible="visible.imageVisible" maximizable modal :header="currentKit?.name" class="md:w-200 w-9/10 ">
                <div class="w-full h-fit">
                    <img class="object-cover w-full sm:h-full" :src="baseUrl + currentKit.photo.contentUrl" :alt="currentKit.name">
                </div>
            </Dialog>
        </template>
    </Section>
</template>
