<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import {useLocationStore} from "@/stores/location.js";
import {useToast} from "primevue/usetoast";
import InputNumber from "@/volt/InputNumber.vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {formatCurrency} from "@/helpers/numberFormat.js";
import TabPanels from "@/volt/TabPanels.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import NoData from "@/components/UI/NoData.vue";
import Tabs from "@/volt/Tabs.vue";
import Tab from "@/volt/Tab.vue";
import {useOrderInvoiceValidation} from "@/views/warehouse/orderInvoice/useWarehouseOrderInvoiceForm.js";
import {useCustomerStore} from "@/stores/customer.js";
import DatePicker from "@/volt/DatePicker.vue";
import Loader from "@/components/Loader.vue";
import {useProductStore} from "@/stores/product.js";
import {useKitStore} from "@/stores/kit.js";
import { vIntersectionObserver } from "@vueuse/components";
import InputText from "@/volt/InputText.vue";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import {useAssemblyStore} from "@/stores/assembly.js";
import {useCategoryStore} from "@/stores/category.js";
import {useOrderInvoice} from "@/views/warehouse/orderInvoice/useOrderInvoice.js";
import {useOrderInvoiceStore} from "@/stores/orderInvoice.js";
import {useInventoryStore} from "@/stores/inventory.js";
import {useRouter} from "vue-router";
import {usePaymentStore} from "@/stores/payment.js";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {useUSDRateStore} from "@/stores/usdRate.js";
import Select from "@/volt/Select.vue";
import Textarea from "@/volt/Textarea.vue";

const { t } = useI18n()
const toast = useToast()
const router = useRouter();

const {
    orderInvoiceHandleSubmit,
    orderInvoiceErrors,
    orderInvoiceIsSubmitting,
    orderInvoiceResetForm,
    orderInvoiceFormCtx,
    location,
    customer,
    comment,
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
    paymentHandleSubmit,
    paymentErrors,
    paymentIsSubmitting,
    paymentResetForm,
    paymentFormCtx,
    paymentValidate,
    orderInvoicePrices,
    payment,
    amount
} = useOrderInvoiceValidation();

const orderInvoiceStore = useOrderInvoiceStore();
const inventoryStore = useInventoryStore();
const locationStore = useLocationStore();
const customerStore = useCustomerStore();
const productStore = useProductStore();
const kitStore = useKitStore();
const assemblyStore = useAssemblyStore();
const categoryStore = useCategoryStore();
const paymentStore = usePaymentStore();
const usdRateStore = useUSDRateStore();
const tabVal = ref('products')
const currentProductPage = ref(1)
const currentKitPage = ref(1)
const isLoading = ref(false)
const isVisibleIntersectingProduct = ref(false)
const isVisibleIntersectingKit = ref(false)
const availableProducts = ref([])
const availableKits = ref([])
const dateFrom = ref();
const isEditing = ref(false)
const currentPayment = ref({})

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

const baseUrl = computed(() => import.meta.env.VITE_APP_API_URL + '/media/')

const totalPrice = computed(() => {
    const productsTotal = orderInvoiceProducts.value.reduce((sum, item) => {
        return sum + (item.api.qty * item.api.price)
    }, 0)

    const kitsTotal = orderInvoiceKits.value.reduce((sum, item) => {
        return sum + (item.api.qty * item.api.price)
    }, 0)

    return productsTotal + kitsTotal
})

const totalPayments = computed(() => {
    const total = orderInvoicePrices.value.reduce((sum, item) => {
        const amount = item.payment.id === 1 ? item.amount : item.amount / usdRateStore.getUSDRate.rate
        return sum + amount
    }, 0)

    return Math.floor(total)
})

const clearPaymentForm = () => {
    isEditing.value = false
    paymentResetForm()
}

const onSubmitPayment = paymentHandleSubmit(async values => {
    const isInclude = orderInvoicePrices.value.some(orderInvoicePrice => orderInvoicePrice.payment?.id === values.payment?.id)

    if (isInclude) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('payment.nominativeCapitalize') }),
            life: 3000
        })
    } else {
        orderInvoicePrices.value = [...orderInvoicePrices.value, values]
        currentPayment.value = values
        paymentResetForm()
    }
})

const onSubmitOrderInvoice = orderInvoiceHandleSubmit(async values => {
    if (orderInvoiceProducts.value.length > 0 || orderInvoiceKits.value.length > 0) {
        await addOrderInvoice(values)
    }
})

const addOrderInvoice = async (values) => {
    const date = new Date(values.createdAt);
    date.setHours(date.getHours() + 5);

    const payload = {
        location: values.location['@id'],
        customer: values.customer['@id'],
        comment: values.comment,
        createdAt: date,
        orderInvoiceProducts: orderInvoiceProducts.value.map(p => p.api),
        orderInvoiceKits: orderInvoiceKits.value.map(k => k.api),
    };

    if (values.orderInvoicePrices.length) {
        payload.orderInvoicePrices = values.orderInvoicePrices.map(orderInvoicePrice => ({
            payment: orderInvoicePrice.payment['@id'],
            amount: orderInvoicePrice.amount,
        }))
    }

    try {
        await orderInvoiceStore.pushOrderInvoiceB2B(payload)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('orderInvoice.nominativeCapitalize') }), life: 3000 })
        orderInvoiceResetForm()
        productResetForm()
        kitResetForm()
        paymentResetForm()
        router.back()
    } catch (error) {
        if (error.status === 412) {
            toast.add({ severity: 'error', summary: t('toast.notEnough', { field: t('code.nominativeCapitalize') }), life: 3000 })
        } else {
            toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
        }
    }
}

const onSubmitOrderInvoicePrice = orderInvoiceHandleSubmit(async values => {
    if (orderInvoiceProducts.value.length || orderInvoiceKits.value.length) {
        await addOrderInvoice(values)
    }
})

onMounted( () => {
    paymentStore.fetchPayments()
    usdRateStore.fetchLastUSDRate()
    categoryStore.fetchCategories()
    assemblyStore.fetchAssemblies()
})

watch([() => location.value], async () => {
    if (location.value) {
        orderInvoiceProducts.value = []
        orderInvoiceKits.value = []
        createdAt.value = new Date()
        await inventoryStore.fetchLastDateToByLocation({ location: `/api/locations/${location.value.id}`})

        if (inventoryStore.getLastInventoryDateTo === null) {
            dateFrom.value = null
        } else {
            const date = new Date(inventoryStore.getLastInventoryDateTo);
            date.setDate(date.getDate());
            date.setMinutes(date.getMinutes() + 1);
            dateFrom.value = date;
        }
    } else {
        availableProducts.value = [];
        availableKits.value = [];
        dateFrom.value = null
        createdAt.value = null

        return;
    }

    isLoading.value = true;

    try {
        if (tabVal.value === 'products') {
            availableProducts.value = []
            currentProductPage.value = 1;
            await productStore.fetchAvailableProducts({ page: 1, location: location?.value?.id });
            availableProducts.value = productStore.getAvailableProducts.models;
        } else {
            availableKits.value = []
            currentKitPage.value = 1;
            await kitStore.fetchAvailableKits({ page: 1, location: location?.value?.id });
            availableKits.value = kitStore.getAvailableKits.models;
        }
    } catch (err) {
        console.error('Tab/Location load error', err);
    } finally {
        isLoading.value = false;
    }
});

watch([() => tabVal.value], async () => {
    try {
        if (tabVal.value === 'products') {
            availableProducts.value = []
            currentProductPage.value = 1;
            await productStore.fetchAvailableProducts({ page: 1, location: location?.value?.id });
            availableProducts.value = productStore.getAvailableProducts.models;
        } else {
            availableKits.value = []
            currentKitPage.value = 1;
            await kitStore.fetchAvailableKits({ page: 1, location: location?.value?.id });
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
            location: location?.value?.id ?? null,
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

        const query = { page: nextPage, location: location?.value?.id ?? null };

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
            location: location?.value?.id,
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
        const queryFilter = { page: 1, location: location?.value?.id };

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

function removePayment(orderInvoicePrice) {
    orderInvoicePrices.value = orderInvoicePrices.value.filter(o => o.payment.id !== orderInvoicePrice.payment.id);
}

const {
    orderInvoiceProducts,
    orderInvoiceKits,
    addProduct,
    removeProduct,
    addKit,
    removeKit
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
                <div data-lol class="col-span-12 lg:col-span-5 2xl:col-span-4 h-full overflow-y-auto">
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

                                    <Select
                                        v-model="location"
                                        :options="locationStore.getLocations.models"
                                        option-label="name"
                                        showClear
                                        :placeholder="t('placeholders.select.location')"
                                        pt:root="w-full dark:bg-surface-700"
                                    />
                                </div>

                                <div>
                                    <p class="text-sm">{{ t('labels.client') }}<span class="text-red-500"> *</span></p>

                                    <Select
                                        v-model="customer"
                                        :options="customerStore.getCustomers.models"
                                        option-label="name"
                                        showClear
                                        :placeholder="t('placeholders.select.customer')"
                                        pt:root="w-full dark:bg-surface-700"
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
                                        :minDate="dateFrom"
                                    />
                                </div>
                            </div>
                            </div>

                            <div class="flex-1 overflow-auto">
                                <table class="w-full">
                                    <thead>
                                        <tr class="sticky top-0 bg-surface-0 dark:bg-surface-800 z-20 border-b border-surface-200 dark:border-surface-600/50">
                                            <th class="font-medium text-sm text-start pl-4 py-3">{{ t('labels.code') }}</th>
                                            <th class="font-medium text-sm text-start">{{t('labels.amount')}}</th>
                                            <th class="font-medium text-sm text-start">{{t('labels.price')}}</th>
                                            <th class="font-medium text-sm text-start">{{t('labels.total')}}</th>
                                            <th class="font-medium text-sm text-start pr-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="text-start" v-for="item of orderInvoiceProducts" :key="item.ui.id">
                                            <td class="text-start text-sm pl-4 py-3">{{ item.ui.code }}</td>
                                            <td>
                                                <InputNumber
                                                    fluid
                                                    showButtons
                                                    v-model.number="item.api.qty"
                                                    class="max-w-20!"
                                                    :min="1"
                                                    :max="item.ui.totalQty"
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
                                            <td class="text-start text-sm pl-4 py-2">{{ item.ui.code }}</td>
                                            <td>
                                                <InputNumber
                                                    fluid
                                                    showButtons
                                                    v-model.number="item.api.qty"
                                                    class="max-w-20!"
                                                    :min="1"
                                                    :max="item.ui.totalQty"
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
                                            <td class="text-sm">{{ formatCurrency(item.api.qty * item.api.price) }}</td>
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

                                <div class="p-2 sm:p-4 border-t border-surface-200 dark:border-surface-600/50">
                                    <p class="text-sm pb-4">{{ t('labels.totals') }}: {{ formatCurrency(totalPrice) }}$</p>
                                    <Button
                                        size="small"
                                        @click="onSubmitOrderInvoice"
                                        :label="t('buttons.save')"
                                        icon="pi pi-save"
                                        class="w-full px-3!"
                                    />

                                    <div>
                                        <table class="w-full">
                                            <thead>
                                            <tr class="sticky top-0 bg-surface-0 dark:bg-surface-800 z-20 border-b border-surface-200 dark:border-surface-600/50">
                                                <th class="font-medium text-sm text-start pl-4 py-3">{{ t('labels.title') }} / {{ t('labels.paymentType') }}</th>
                                                <th class="font-medium text-sm text-start">{{t('labels.price')}}</th>
                                                <th class="font-medium text-sm text-start pr-4"></th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <tr class="text-start" v-for="item of orderInvoicePrices" :key="item.payment.id">
                                                <td class="text-start text-sm pl-4 py-3">{{ item.payment.name }} / {{ item.payment.paymentType.name }}</td>
                                                <td class="text-sm">{{ formatCurrency(item.amount) }}</td>
                                                <td class="pr-4">
                                                    <Button
                                                        @click="removePayment(item)"
                                                        icon="pi pi-trash"
                                                        pt:root="rounded-full size-7! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                                        pt:icon="text-sm"
                                                        size="small"
                                                    />
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>

                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <p class="text-sm">{{ t('labels.Payment') }}<span class="text-red-500"> *</span></p>
                                                <Select
                                                    v-model="payment"
                                                    :options="paymentStore.getPayments.models"
                                                    option-label="name"
                                                    showClear
                                                    :placeholder="t('placeholders.select.paymentType')"
                                                    pt:root="w-full dark:bg-surface-700"
                                                />
                                            </div>

                                            <div>
                                                <p class="text-sm">{{ t('labels.price') }}<span class="text-red-500"> *</span></p>
                                                <InputNumber
                                                    :modelValue="amount"
                                                    @update:modelValue="val => {
                                                        if (typeof val === 'number' || val === null) {
                                                            amount = val
                                                        }
                                                    }"
                                                    fluid
                                                    showButtons
                                                    :placeholder="t('placeholders.price')"
                                                    :minFractionDigits="1"
                                                    :maxFractionDigits="2"
                                                    :invalid="!!paymentErrors.amount"
                                                />
                                            </div>
                                        </div>

                                        <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                            <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearPaymentForm" />
                                            <Button v-if="!isEditing" @click="onSubmitPayment" :label="t('buttons.add')" class="px-5" :loading="paymentIsSubmitting"/>
                                        </div>
                                    </div>

                                    <p class="text-sm pt-4">{{ t('labels.usdRate') }}: {{ formatCurrency(Math.floor(usdRateStore.getUSDRate.rate)) }}</p>
                                    <p class="text-sm pt-4">{{ t('labels.total') }}: {{ formatCurrency(totalPayments) }}$</p>
                                    <p class="text-sm pb-4">{{ t('difference') }}: {{ formatCurrency(totalPayments - totalPrice) }}$</p>

                                    <div class="flex justify-end">
                                        <Button
                                            size="small"
                                            @click="onSubmitOrderInvoicePrice"
                                            :label="t('buttons.pay')"
                                            icon="pi pi-credit-card"
                                            class="w-fit px-3! h-fit"
                                        />
                                    </div>

                                    <label class="block mt-5">
                                        <Textarea
                                            v-model="comment"
                                            rows="5"
                                            class="resize-none"
                                            size="small"
                                            fluid
                                            :placeholder="t('placeholders.comment')"
                                        />
                                    </label>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
                <div v-if="location" class="col-span-12 lg:col-span-7 2xl:col-span-8 h-full overflow-y-auto">
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
                                            />
                                        </label>
                                    </div>
                                    <Select
                                        v-model="filters.productCategory"
                                        :options="categoryStore.getCategories.models"
                                        option-label="name"
                                        option-value="id"
                                        showClear
                                        :placeholder="t('placeholders.search.byCategory')"
                                    />
                                    <Select
                                        v-model="filters.productAssembly"
                                        :options="assemblyStore.getAssemblies.models"
                                        option-label="name"
                                        option-value="id"
                                        showClear
                                        :placeholder="t('placeholders.search.byAssembly')"
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
                                            />
                                        </label>
                                    </div>
                                    <Select
                                        v-model="filters.kitAssembly"
                                        :options="assemblyStore.getAssemblies.models"
                                        option-label="name"
                                        option-value="id"
                                        showClear
                                        :placeholder="t('placeholders.search.byAssembly')"
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
                                        <div v-if="!isLoading && !productStore.getAvailableProducts.totalItems && !productStore.getIsLoadingProducts" class="my-auto">
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
                                                                <p>{{ t('labels.code') }}:</p>
                                                                <p class="font-semibold">{{ product.code }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.category') }}:</p>
                                                                <p class="font-semibold">{{ product.category }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.collection') }}:</p>
                                                                <p class="font-semibold">{{ product.assembly || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.qty') }}:</p>
                                                                <p class="font-semibold">{{ formatCurrency(product.totalQty) + `${t(`labels.${product.unit}`)}` || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.price') }}:</p>
                                                                <p class="font-semibold">{{ formatCurrency(product.wholesalePrice) }}$</p>
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

                                        <div v-if="!isLoading && !kitStore.getAvailableKits.totalItems && !kitStore.getIsLoadingKits" class="my-auto">
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
                                                <div class="flex items-center grow p-2 text-sm">
                                                    <div class="flex justify-between w-full dark:text-surface-0">
                                                        <div class="w-full">
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.code') }}:</p>
                                                                <p class="font-semibold">{{ kit.code }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.collection') }}:</p>
                                                                <p class="font-semibold">{{ kit.assembly || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.qty') }}:</p>
                                                                <p class="font-semibold">{{ formatCurrency(kit.totalQty) + `${t('labels.pcs')}` || '-' }}</p>
                                                            </div>
                                                            <div class="flex justify-between w-full">
                                                                <p>{{ t('labels.price') }}:</p>
                                                                <p class="font-semibold">{{ formatCurrency(kit.wholesalePrice) }}$</p>
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
