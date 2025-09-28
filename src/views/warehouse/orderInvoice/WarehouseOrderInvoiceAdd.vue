<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {onBeforeRouteLeave, useRouter} from "vue-router";
import {useLocationStore} from "@/stores/location.js";
import {useToast} from "primevue/usetoast";
import InputNumber from "@/volt/InputNumber.vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {formatCurrency, getFormattedDate} from "@/helpers/numberFormat.js";
import Column from "primevue/column";
import DataTable from "@/volt/DataTable.vue";
import Dialog from "@/volt/Dialog.vue";
import {useTransferInvoiceStore} from "@/stores/transferInvoice.js";
import {useLocationQuantityStore} from "@/stores/locationQuantity.js";
import {useUserStore} from "@/stores/user.js";
import TabPanels from "@/volt/TabPanels.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import NoData from "@/components/UI/NoData.vue";
import Tabs from "@/volt/Tabs.vue";
import Tab from "@/volt/Tab.vue";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row";
import {useLocationQuantityKitStore} from "@/stores/locationQuantityKit.js";
import {useTransferInvoiceValidation} from "@/views/warehouse/transferInvoice/useWarehouseTransferInvoiceForm.js";
import {useOrderInvoiceValidation} from "@/views/warehouse/orderInvoice/useWarehouseOrderInvoiceForm.js";
import {useCustomerStore} from "@/stores/customer.js";
import Skeleton from "@/volt/Skeleton.vue";
import PaginatorComponent from "@/components/PaginatorComponent.vue";
import DatePicker from "@/volt/DatePicker.vue";
import Loader from "@/components/Loader.vue";
import {useProductStore} from "@/stores/product.js";
import {useKitStore} from "@/stores/kit.js";
import { vIntersectionObserver } from "@vueuse/components";
import InputText from "@/volt/InputText.vue";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import updateQuery from "@/helpers/updateQuery.js";
import {useAssemblyStore} from "@/stores/assembly.js";
import {useCategoryStore} from "@/stores/category.js";
import {useOrderInvoice} from "@/views/warehouse/orderInvoice/useOrderInvoice.js";

const { t } = useI18n()
const toast = useToast()

const {
    orderInvoiceHandleSubmit,
    orderInvoiceErrors,
    orderInvoiceIsSubmitting,
    orderInvoiceResetForm,
    orderInvoiceFormCtx,
    location,
    customer,
    createdAt,
    productHandleSubmit,
    productErrors,
    productIsSubmitting,
    productResetForm,
    productFormCtx,
    productValidate,
    product,
    productColor,
    productQty,
    productPrice,
    kitHandleSubmit,
    kitErrors,
    kitIsSubmitting,
    kitResetForm,
    kitFormCtx,
    kitValidate,
    kit,
    kitQty,
    kitPrice,
} = useOrderInvoiceValidation();

const locationStore = useLocationStore();
const customerStore = useCustomerStore();
const productStore = useProductStore();
const kitStore = useKitStore();
const assemblyStore = useAssemblyStore();
const categoryStore = useCategoryStore();
const userStore = useUserStore();
const tabVal = ref('products')
const currentProductPage = ref(1)
const currentKitPage = ref(1)
const isLoading = ref(false)
const isVisibleIntersectingProduct = ref(false)
const isVisibleIntersectingKit = ref(false)
const availableProducts = ref([])
const availableKits = ref([])

const filters = ref({
    productCategory: null,
    productAssembly: null,
    kitAssembly: null
});

const productNameDebounced = useDebouncedRef('', 300)
const kitNameDebounced = useDebouncedRef('', 300)

const home = computed(() => ({
    icon: 'pi pi-home',
    label: t('warehouse'),
    route: '/warehouse'
}));

const items = computed(() => [{ label: t('cards.orderInvoices'), route: { name: 'warehouse-order-invoices'} }, { label: t('sections.warehouseOrderInvoices.add') }]);
const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])

const tabPanels = computed(() => [
    { value: 'products', key: 'orderInvoiceProducts' },
    { value: 'kit', key: 'orderInvoiceKits' },
])

const baseUrl = computed(() => import.meta.env.VITE_APP_API_URL + '/media/')

watch([() => location.value, () => tabVal.value], async () => {
    if (!location.value) {
        availableProducts.value = [];
        availableKits.value = [];
        return;
    }

    isLoading.value = true;
    try {
        if (tabVal.value === 'products') {
            currentProductPage.value = 1;
            await productStore.fetchAvailableProducts({ page: 1, location: location.value });
            availableProducts.value = productStore.getAvailableProducts.models;
        } else {
            currentKitPage.value = 1;
            await kitStore.fetchAvailableKits({ page: 1, location: location.value });
            availableKits.value = kitStore.getAvailableKits.models;
        }
    } catch (err) {
        console.error('Tab/Location load error', err);
    } finally {
        isLoading.value = false;
    }
});

watch(isVisibleIntersectingProduct, async (newVal) => {
    if (!newVal) return;
    if (isLoading.value) return;

    const total = productStore.getAvailableProducts?.totalItems || 0;
    if (availableProducts.value.length >= total) {
        isVisibleIntersectingProduct.value = false;
        return;
    }

    isLoading.value = true;
    try {
        const nextPage = currentProductPage.value + 1;

        const query = {
            page: nextPage,
            location: location?.value ?? null,
        };

        if (typeof productNameDebounced.value === 'string' && productNameDebounced.value.trim() !== '') {
            query.name = productNameDebounced.value;
        }

        if (filters.value.productCategory !== null) {
            query.category = filters.value.productCategory;
        }
        if (filters.value.productAssembly !== null) {
            query.assembly = filters.value.productAssembly;
        }

        await productStore.fetchAvailableProducts(query);

        currentProductPage.value = nextPage;
        availableProducts.value = [...availableProducts.value, ...productStore.getAvailableProducts.models];
    } catch (err) {
        console.error('Products load more error', err);
    } finally {
        isLoading.value = false;
        isVisibleIntersectingProduct.value = false;
    }
});

watch(isVisibleIntersectingKit, async (newVal) => {
    if (!newVal) return;
    if (isLoading.value) return;

    const total = kitStore.getAvailableKits?.totalItems || 0;
    if (availableKits.value.length >= total) {
        isVisibleIntersectingKit.value = false;
        return;
    }

    isLoading.value = true;
    try {
        const nextPage = currentKitPage.value + 1;

        const query = { page: nextPage, location: location?.value ?? null };

        if (typeof kitNameDebounced.value === 'string' && kitNameDebounced.value.trim() !== '') {
            query.name = kitNameDebounced.value;
        }

        if (filters.value.kitAssembly !== null) {
            query.assembly = filters.value.kitAssembly;
        }

        await kitStore.fetchAvailableKits(query);

        currentKitPage.value = nextPage;
        availableKits.value = [...availableKits.value, ...kitStore.getAvailableKits.models];
    } catch (err) {
        console.error('Kits load more error', err);
    } finally {
        isLoading.value = false;
        isVisibleIntersectingKit.value = false;
    }
});

watch(
    [() => productNameDebounced.value, () => filters.value.productAssembly, () => filters.value.productCategory],
    async () => {
        const queryFilter = {
            page: 1,
            location: location.value,
        };

        if (typeof productNameDebounced.value === 'string' && productNameDebounced.value.trim() !== '') {
            queryFilter.name = productNameDebounced.value;
        }

        if (filters.value.productCategory !== null) {
            queryFilter.category = filters.value.productCategory;
        }

        if (filters.value.productAssembly !== null) {
            queryFilter.assembly = filters.value.productAssembly;
        }

        // reset page and list before new search
        currentProductPage.value = 1;
        isLoading.value = true;
        try {
            await productStore.fetchAvailableProducts(queryFilter);
            availableProducts.value = productStore.getAvailableProducts.models;
        } catch (err) {
            console.error('Products search error', err);
        } finally {
            isLoading.value = false;
        }
    },
    { immediate: true }
);

watch(
    [() => kitNameDebounced.value, () => filters.value.kitAssembly],
    async () => {
        const queryFilter = { page: 1, location: location.value };

        if (typeof kitNameDebounced.value === 'string' && kitNameDebounced.value.trim() !== '') {
            queryFilter.name = kitNameDebounced.value;
        }
        if (filters.value.kitAssembly !== null) {
            queryFilter.assembly = filters.value.kitAssembly;
        }

        currentKitPage.value = 1;
        isLoading.value = true;
        try {
            await kitStore.fetchAvailableKits(queryFilter);
            availableKits.value = kitStore.getAvailableKits.models;
        } catch (err) {
            console.error('Kits search error', err);
        } finally {
            isLoading.value = false;
        }
    },
    { immediate: true }
);

function onIntersectionObserverProduct([entry]) {
    isVisibleIntersectingProduct.value = entry?.isIntersecting;
}
function onIntersectionObserverKit([entry]) {
    isVisibleIntersectingKit.value = entry?.isIntersecting;
}

function clearFilters() {
    productNameDebounced.value = null
    kitNameDebounced.value = null
    filters.value.productCategory = null
    filters.value.productAssembly = null
    filters.value.kitAssembly = null
}

async function fetchLocations(query) {
    const newQuery = {
        ...query
    }

    if(userStore.getAboutMeFromToken.role === 'ROLE_ADMIN') {
        newQuery.isWarehouse = true
    }
    console.log(userStore.getAboutMeFromToken.role)

    if (userStore.getAboutMeFromToken.role === 'ROLE_WAREHOUSE_MANAGER') {
        newQuery.user = userStore.getAboutMeFromToken.id
    }

    await locationStore.fetchLocations(newQuery)
}

const {
    orderInvoiceProducts, orderInvoiceKits,
    addProduct, removeProduct,
    addKit, removeKit
} = useOrderInvoice();

</script>

<template>
    <Breadcrumb :home="home" :model="items" class="shrink-0 flex-none rounded-md border border-surface-300 dark:border-surface-600/50">
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
        :section-name="t('sections.warehouseOrderInvoices.add')"
        back-route-name="warehouse-order-invoices"
        without-buttons
    >
        <template #sectionBody>
            <div class="h-full xl:h-[calc(100dvh_-_170px)] grid grid-cols-12 gap-4 overflow-hidden lg:overflow-auto">
                <div data-lol class="col-span-12 xl:col-span-5 2xl:col-span-4 h-full overflow-y-auto">
                    <Card
                        pt:root="sm:h-full overflow-hidden rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                        pt:body="p-0 h-full flex flex-col"
                        pt:content="flex flex-col h-full"
                    >
                        <template #content>
                            <div class="border-b border-surface-200 dark:border-surface-600/50">
                                <div class="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2 border-b border-surface-200 dark:border-surface-600/50 p-2 sm:p-4">
                                <div>
                                    <p class="text-sm">{{ t('labels.location') }}<span class="text-red-500"> *</span></p>
                                    <SearchSelect
                                        v-model="location"
                                        :fetchFn="fetchLocations"
                                        :options="locationStore.getLocations.models"
                                        :option-label="opt => opt?.name"
                                        :option-value="opt => opt?.name"
                                        :return-value="opt => opt.id"
                                        :placeholder="t('placeholders.select.location')"
                                        :loading="locationStore.getIsLoadingLocation"
                                        :total-items="locationStore.getLocations.totalItems"
                                        :invalid="!!orderInvoiceErrors.location"
                                        size="small"
                                    />
                                </div>

                                <div>
                                    <p class="text-sm">{{ t('labels.client') }}<span class="text-red-500"> *</span></p>

                                    <SearchSelect
                                        v-model="customer"
                                        :fetchFn="(query) => customerStore.fetchCustomers({ ...query, 'is-b2b': true })"
                                        :options="customerStore.getCustomers.models"
                                        :option-label="opt => opt?.name"
                                        :option-value="opt => opt?.name"
                                        :return-value="opt => opt.id"
                                        :placeholder="t('placeholders.select.customer')"
                                        :loading="customerStore.getIsLoadingCustomers"
                                        :total-items="customerStore.getCustomers.totalItems"
                                        :invalid="!!orderInvoiceErrors.customer"
                                        size="small"
                                    />
                                </div>

                                <div>
                                    <p class="text-sm">{{ t('labels.createdAt') }}<span class="text-red-500"> *</span></p>

                                    <DatePicker
                                        v-model="createdAt"
                                        dateFormat="dd.mm.yy"
                                        showIcon
                                        fluid
                                        iconDisplay="input"
                                        :placeholder="t('placeholders.date')"
                                        show-button-bar
                                        :invalid="!!orderInvoiceErrors.createdAt"
                                        :minDate="new Date()"
                                        size="small"
                                    />

                                </div>
                            </div>
                            </div>

                            <div class="flex-1 overflow-auto">
                                <table class="w-full">
                                    <thead>
                                        <tr class="sticky top-0 bg-surface-0 dark:bg-surface-800 z-20 border-b border-surface-200 dark:border-surface-600/50">
                                            <th class="font-medium text-sm text-start pl-4 py-3">{{ t('labels.title') }} / {{ t('labels.color') }}</th>
                                            <th class="font-medium text-sm text-start">Miqdori</th>
                                            <th class="font-medium text-sm text-start">Narxi</th>
                                            <th class="font-medium text-sm text-start">Jami</th>
                                            <th class="font-medium text-sm text-start pr-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="text-start" v-for="item of orderInvoiceProducts" :key="item.ui.id">
                                            <td class="text-start text-sm pl-4 py-3">{{ item.ui.name }} / {{ item.ui.color || '-' }}</td>
                                            <td>
                                                <InputNumber
                                                    fluid
                                                    showButtons
                                                    v-model.number="item.api.qty"
                                                    class="max-w-20!"
                                                    :min="1"
                                                    size="small"
                                                    :minFractionDigits="1"
                                                    :maxFractionDigits="2"
                                                    pt:incrementButton="w-6 ml-auto"
                                                    pt:decrementButton="w-6 ml-auto"
                                                />
                                            </td>
                                            <td>
                                                <InputNumber
                                                    fluid
                                                    prefix="$"
                                                    showButtons
                                                    v-model.number="item.api.price"
                                                    class="max-w-24!"
                                                    :min="item.ui.wholesalePrice"
                                                    size="small"
                                                    :minFractionDigits="1"
                                                    :maxFractionDigits="2"
                                                    pt:incrementButton="w-6 ml-auto"
                                                    pt:decrementButton="w-6 ml-auto"
                                                />
                                            </td>
                                            <td class="text-sm">${{ formatCurrency(item.api.qty * item.api.price) }}</td>
                                            <td class="pr-4">
                                                <Button
                                                    @click="removeProduct(item)"
                                                    icon="pi pi-trash"
                                                    pt:root="rounded-full size-7! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                                    pt:icon="text-sm"
                                                    size="small"
                                                />
                                            </td>
                                        </tr>
                                        <tr class="text-start" v-for="item of orderInvoiceKits" :key="item.ui.id">
                                            <td class="text-start text-sm pl-4 py-2">{{ item.ui.name }} / {{ item.ui.color || '-' }}</td>
                                            <td>
                                                <InputNumber
                                                    fluid
                                                    showButtons
                                                    v-model.number="item.api.qty"
                                                    class="max-w-20!"
                                                    :min="1"
                                                    size="small"
                                                    :minFractionDigits="1"
                                                    :maxFractionDigits="2"
                                                    pt:incrementButton="w-6 ml-auto"
                                                    pt:decrementButton="w-6 ml-auto"
                                                />
                                            </td>
                                            <td>
                                                <InputNumber
                                                    fluid
                                                    prefix="$"
                                                    showButtons
                                                    v-model.number="item.api.price"
                                                    class="max-w-24!"
                                                    :min="item.ui.wholesalePrice"
                                                    size="small"
                                                    :minFractionDigits="1"
                                                    :maxFractionDigits="2"
                                                    pt:incrementButton="w-6 ml-auto"
                                                    pt:decrementButton="w-6 ml-auto"
                                                />
                                            </td>
                                            <td class="text-sm">{{ item.api.qty * item.api.price }}</td>
                                            <td class="pr-4">
                                                <Button
                                                    @click="removeKit(item)"
                                                    icon="pi pi-trash"
                                                    pt:root="rounded-full size-7! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                                    pt:icon="text-sm"
                                                    size="small"
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="p-2 sm:p-4 border-t border-surface-200 dark:border-surface-600/50">
                                <Button
                                    size="small"
                                    @click="clearFilters"
                                    :label="t('buttons.save')"
                                    icon="pi pi-save"
                                    class="w-full px-3!"
                                />

                                <div class="py-4">
                                    <p>footer</p>
                                    <p>footer</p>
                                    <p>footer</p>
                                </div>
                                <div class="flex justify-end">
                                    <Button
                                        size="small"
                                        @click="clearFilters"
                                        :label="t('buttons.pay')"
                                        icon="pi pi-credit-card"
                                        class="w-fit px-3! h-fit"
                                    />
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
                <div v-if="location" class="col-span-12 xl:col-span-7 2xl:col-span-8 sm:h-full overflow-y-auto">
                    <Card
                        pt:root="md:h-full overflow-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                        pt:body="p-0 grow"
                        pt:content="grow flex flex-col"
                        pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
                        pt:header="px-3 pt-3"
                    >
                        <template #content>
                            <div class="bg-surface-0 dark:bg-surface-800 p-3 pb-0.5 sticky top-0">
                                <div class="grid max-[450px]:grid-cols-1 grid-cols-2 xl:grid-cols-4 gap-3" v-if="tabVal === 'products'">
                                    <div>
                                        <label class="relative max-w-full w-full">
                                            <i class="text-sm pi pi-search absolute top-1/2 -mt-1.5 text-surface-400 leading-none start-2.5 z-1"/>
                                            <InputText
                                                pt:root="ps-8!"
                                                v-model="productNameDebounced"
                                                class="w-full"
                                                :placeholder="t('placeholders.search.byTitleAndQRAndCode')"
                                                size="small"
                                            />
                                        </label>
                                    </div>
                                    <SearchSelect
                                        v-model="filters.productCategory"
                                        :fetchFn="categoryStore.fetchCategories"
                                        :options="categoryStore.getCategories.models"
                                        :option-label="opt => opt?.name"
                                        :option-value="opt => opt?.name"
                                        :return-value="opt => opt.id"
                                        :placeholder="t('placeholders.search.byCategory')"
                                        :loading="categoryStore.getIsLoadingCategory"
                                        :total-items="categoryStore.getCategories.totalItems"
                                        :invalid="!!orderInvoiceErrors.productCategory"
                                        size="small"
                                    />
                                    <SearchSelect
                                        v-model="filters.productAssembly"
                                        :fetchFn="assemblyStore.fetchAssemblies"
                                        :options="assemblyStore.getAssemblies.models"
                                        :option-label="opt => opt?.name"
                                        :option-value="opt => opt?.name"
                                        :return-value="opt => opt.id"
                                        :placeholder="t('placeholders.search.byAssembly')"
                                        :loading="assemblyStore.getIsLoadingAssembly"
                                        :total-items="assemblyStore.getAssemblies.totalItems"
                                        :invalid="!!orderInvoiceErrors.productAssembly"
                                        size="small"
                                    />

                                    <div class="flex justify-end">
                                        <Button size="small" @click="clearFilters" :label="t('clear')" icon="pi pi-trash" class="bg-surface-500 border-surface-500 enabled:hover:border-surface-400 enabled:hover:bg-surface-400 dark:bg-surface-500 dark:border-surface-500 dark:enabled:hover:border-surface-400 dark:enabled:hover:bg-surface-400 w-fit px-3!"/>
                                    </div>
                                </div>
                                <div class="grid max-[450px]:grid-cols-1 grid-cols-2 xl:grid-cols-3 gap-3" v-if="tabVal === 'kits'">
                                    <div>
                                        <label class="relative max-w-full w-full">
                                            <i class="pi pi-search absolute top-1/2 -mt-2 text-surface-400 leading-none start-3 z-1"/>
                                            <InputText
                                                pt:root="ps-8!"
                                                v-model="kitNameDebounced"
                                                class="w-full"
                                                :placeholder="t('placeholders.search.byTitleAndQRAndCode')"
                                                size="small"
                                            />
                                        </label>
                                    </div>
                                    <SearchSelect
                                        v-model="filters.kitAssembly"
                                        :fetchFn="assemblyStore.fetchAssemblies"
                                        :options="assemblyStore.getAssemblies.models"
                                        :option-label="opt => opt?.name"
                                        :option-value="opt => opt?.name"
                                        :return-value="opt => opt.id"
                                        :placeholder="t('placeholders.search.byAssembly')"
                                        :loading="assemblyStore.getIsLoadingAssembly"
                                        :total-items="assemblyStore.getAssemblies.totalItems"
                                        :invalid="!!orderInvoiceErrors.kitAssembly"
                                        size="small"
                                    />

                                    <div class="col-span-full xl:col-span-1 flex justify-end">
                                        <Button size="small" @click="clearFilters" :label="t('clear')" icon="pi pi-trash" class="bg-surface-500 border-surface-500 enabled:hover:border-surface-400 enabled:hover:bg-surface-400 dark:bg-surface-500 dark:border-surface-500 dark:enabled:hover:border-surface-400 dark:enabled:hover:bg-surface-400 w-fit px-3!"/>
                                    </div>
                                </div>
                            </div>
                            <Tabs v-model:value="tabVal" scrollable :showNavigators="true">
                                <TabList class="sticky top-12">
                                    <Tab pt:root="text-sm font-medium dark:text-surface-0" v-for="tab of tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
                                </TabList>
                                <TabPanels>
                                    <TabPanel value="products">

                                        <div v-if="!isLoading && !location && (!kitStore.getAvailableKits.totalItems && !kitStore.getIsLoadingKits) || (!productStore.getAvailableProducts.totalItems && !productStore.getIsLoadingProducts)" class="my-auto">
                                            <NoData class="text-surface-400 mx-auto my-auto h-full">
                                                <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                            </NoData>
                                        </div>

                                        <div v-else class="grid grid-cols-1 min-[450px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                            <button
                                                @click="addProduct(product)"
                                                v-for="product of availableProducts"
                                                :key="product.id"
                                                class="cursor-pointer flex flex-col rounded-md shadow hover:shadow-md active:shadow-none active:border-surface-300 active:dark:border-surface-500 border border-surface-200 dark:border-surface-700/90 overflow-hidden"
                                            >
                                                <div class="h-36 bg-surface-100 dark:bg-surface-700/50 overflow-hidden">
                                                    <img class="object-cover h-full mx-auto" v-if="!!product.photo" :src="baseUrl + product.photo" :alt="product.name">
                                                    <div v-else class="h-full w-full flex justify-center items-center text-surface-400 italic text-2xl sm:text-base md:text-lg xl:text-2xl select-none">
                                                        {{ t('noPhoto') }}
                                                    </div>
                                                </div>
                                                <div class="flex items-center grow p-2 text-sm">
                                                    <div class="flex justify-between w-full dark:text-surface-0">
                                                        <div class="w-full">
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.title') }}:</p>
                                                                <p class="font-semibold">{{ product.name }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.code') }}:</p>
                                                                <p class="font-semibold">{{ product.code || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.color') }}:</p>
                                                                <p class="font-semibold">{{ product.color || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.category') }}:</p>
                                                                <p class="font-semibold">{{ product.category || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.collection') }}:</p>
                                                                <p class="font-semibold">{{ product.assembly || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.qty') }}:</p>
                                                                <p class="font-semibold">{{ product.totalQty + `${t(`labels.${product.unit}`)}` || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.price') }}:</p>
                                                                <p class="font-semibold">{{ product.wholesalePrice }}$</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            <div
                                                v-intersection-observer="onIntersectionObserverProduct"
                                                v-if="productStore.getAvailableProducts.totalItems && (isLoading || productStore.getAvailableProducts.totalItems > availableProducts.length)"
                                                class="flex justify-center col-span-full h-10"
                                            >
                                                <Loader />
                                            </div>
                                        </div>
                                    </TabPanel>
                                    <TabPanel value="kits">

                                        <div v-if="!location && (!kitStore.getAvailableKits.totalItems && !kitStore.getIsLoadingKits)" class="my-auto">
                                            <NoData class="text-surface-400 mx-auto my-auto h-full">
                                                <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                            </NoData>
                                        </div>

                                        <div v-else class="grid grid-cols-1 min-[450px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                            <button
                                                @click="addKit(kit)"
                                                v-for="kit of availableKits"
                                                :key="kit.id"
                                                class="cursor-pointer flex flex-col rounded-md shadow hover:shadow-md active:shadow-none active:border-surface-300 active:dark:border-surface-500 border border-surface-200 dark:border-surface-700/90 overflow-hidden"
                                            >
                                                <div class="h-36 bg-surface-100 dark:bg-surface-700/50 overflow-hidden">
                                                    <img class="object-cover h-full mx-auto" v-if="!!kit.photo" :src="baseUrl + kit.photo" :alt="kit.name">
                                                    <div v-else class="h-full w-full flex justify-center items-center text-surface-400 italic text-2xl sm:text-base md:text-lg xl:text-2xl select-none">
                                                        {{ t('noPhoto') }}
                                                    </div>
                                                </div>
                                                <div class="flex items-center grow px-2 text-sm">
                                                    <div class="flex justify-between w-full text-surface-900 dark:text-surface-0">
                                                        <div>
                                                            <p>{{ kit.name }}</p>
                                                            <p>{{ kit.color || 'color' }}</p>
                                                        </div>
                                                        <p>{{ kit.wholesalePrice }}$</p>
                                                    </div>
                                                </div>
                                                <div class="flex items-center grow p-2 text-sm">
                                                    <div class="flex justify-between w-full dark:text-surface-0">
                                                        <div class="w-full">
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.title') }}:</p>
                                                                <p class="font-semibold">{{ kit.name }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.code') }}:</p>
                                                                <p class="font-semibold">{{ kit.code || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.Assembly') }}:</p>
                                                                <p class="font-semibold">{{ kit.assembly || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.qty') }}:</p>
                                                                <p class="font-semibold">{{ kit.totalQty + `${t('labels.pcs')}` || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.price') }}:</p>
                                                                <p class="font-semibold">{{ kit.wholesalePrice }}$</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            <div
                                                v-intersection-observer="onIntersectionObserverKit"
                                                v-if="kitStore.getAvailableKits.totalItems && (isLoading || kitStore.getAvailableKits.totalItems > availableKits.length)"
                                                class="flex justify-center col-span-full h-10"
                                            >
                                                <Loader />
                                            </div>
                                        </div>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                        </template>
                    </Card>
                </div>
            </div>
        </template>
    </Section>
</template>
