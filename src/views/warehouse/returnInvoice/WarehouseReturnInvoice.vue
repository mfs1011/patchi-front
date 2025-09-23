<script setup>
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import Section from "@/components/UI/Section.vue";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Dialog from "@/volt/Dialog.vue";
import DataTable from "@/volt/DataTable.vue";
import Column from "primevue/column";
import InputNumber from "@/volt/InputNumber.vue";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import DatePicker from "@/volt/DatePicker.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import Button from "@/volt/Button.vue";
import NoData from "@/components/UI/NoData.vue";
import {useI18n} from "vue-i18n";
import {useLocationStore} from "@/stores/location.js";
import {useInventoryStore} from "@/stores/inventory.js";
import {formatCurrency, formatDateTimeLocal, getFormattedDate} from "@/helpers/numberFormat.js";
import {useToast} from "primevue/usetoast";
import {useCustomerStore} from "@/stores/customer.js";
import TabList from "@/volt/TabList.vue";
import Row from "primevue/row";
import ColumnGroup from "primevue/columngroup";
import TabPanel from "@/volt/TabPanel.vue";
import Tab from "@/volt/Tab.vue";
import TabPanels from "@/volt/TabPanels.vue";
import Tabs from "@/volt/Tabs.vue";
import {useReturnInvoiceStore} from "@/stores/returnInvoice.js";
import {useReturnInvoiceValidation} from "@/views/warehouse/returnInvoice/useWarehouseReturnInvoiceForm.js";
import {useOrderInvoiceProductStore} from "@/stores/orderInvoiceProduct.js";
import {useUserStore} from "@/stores/user.js";
import {useOrderInvoiceKitStore} from "@/stores/orderInvoiceKit.js";

const route = useRoute();
const router = useRouter();
const toast = useToast()
const returnInvoiceStore = useReturnInvoiceStore();
const inventoryStore = useInventoryStore();
const customerStore = useCustomerStore();
const locationStore = useLocationStore();
const orderInvoiceProductStore = useOrderInvoiceProductStore();
const orderInvoiceKitStore = useOrderInvoiceKitStore();
const userStore = useUserStore();
const { t } = useI18n();
const {
    returnInvoiceHandleSubmit,
    returnInvoiceErrors,
    returnInvoiceIsSubmitting,
    returnInvoiceResetForm,
    location,
    customer,
    createdAt,
    productHandleSubmit,
    productErrors,
    productIsSubmitting,
    productResetForm,
    productValidate,
    orderInvoiceProduct,
    qtyProduct,
    kitHandleSubmit,
    kitErrors,
    kitIsSubmitting,
    kitResetForm,
    kitValidate,
    orderInvoiceKit,
    qtyKit,
} = useReturnInvoiceValidation();

const apiData = ref(null);
const editableData = ref(null);
const currentProductIndex = ref(null);
const currentKitIndex = ref(null);
const currentDeleteProduct = ref(null);
const currentDeleteKit = ref(null);
const deleteProductVisible = ref(false);
const deleteKitVisible = ref(false);
const isDeleteProductLoading = ref(false);
const isDeleteKitLoading = ref(false);
const deletedData = ref([]);
const createdData = ref([]);
const updatedData = ref([]);
const deletedKitData = ref([]);
const createdKitData = ref([]);
const updatedKitData = ref([]);
const dateFrom = ref(null);
const editMode = ref(false);
const isLoading = ref(true);
const showLeaveDialog = ref(false);
const isEditing = ref(false);
const pendingNavigation = ref(false);
const isEdited = ref(false);
const isConfirmLoading = ref(false);
const tabVal = ref('products')

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("warehouse"),
    route: "/warehouse",
}));

const items = computed(() => [{ label: t("cards.returnInvoices"), route: { name: 'warehouse-return-invoices'} }, { label: t("cards.returnInvoice") }]);
const isAdminOrCreatedBy = createdById => (
    userStore.getAboutMe.role.name === 'ROLE_ADMIN' || userStore.getAboutMe.id === createdById
)
const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])

const sumPriceOfReturnInvoiceProducts = computed(() => {
    return editableData.value.returnInvoiceProducts.length === 0
        ? 0
        : editableData.value.returnInvoiceProducts.reduce((acc, returnInvoiceProduct) => {
            return acc
                + returnInvoiceProduct?.price
                + returnInvoiceProduct?.transportationFee
                + returnInvoiceProduct?.customsFee
        }, 0)
})

const isChanged = computed(() => (
    createdData.value.length ||
    updatedData.value.length ||
    deletedData.value.length
));
// functions
const onSubmitProduct = productHandleSubmit((values) => {
    addProduct(values)
})

const onEditProduct = productHandleSubmit(async (values) => {
    const isValid = await productValidate()

    if (!isValid.valid) {
        return
    }

    editProduct(values)
})

const onSubmitKit = kitHandleSubmit((values) => {
    addKit(values)
})

const onEditKit = kitHandleSubmit(async (values) => {
    const isValid = await kitValidate()

    if (!isValid.valid) {
        return
    }

    editKit(values)
})

const onSubmitReturnInvoice = returnInvoiceHandleSubmit(async values => {
    const payload = {};

    payload.returnInvoiceProducts = [...createdData.value, ...updatedData.value, ...deletedData.value]
    payload.returnInvoiceKits = [...createdKitData.value, ...updatedKitData.value, ...deletedKitData.value]

    if (!payload.returnInvoiceProducts.length) {
        delete payload.returnInvoiceProducts
    }

    if (!payload.returnInvoiceKits.length) {
        delete payload.returnInvoiceKits
    }

    try {
        await returnInvoiceStore.putReturnInvoice(payload, route.params.id)
        isEditing.value = false
        editMode.value = false
        isEdited.value = true
        toast.add({
            severity: 'success',
            summary: t('toast.successEditingSave'),
            life: 3000
        })

        router.back()
    } catch (error) {
        if (error.status === 439) {
            toast.add({ severity: 'error', summary: t('toast.already_exists_error', { field: t('code.nominativeCapitalize') }), life: 3000 })
        } else if (error.status === 412) {
            toast.add({ severity: 'error', summary: t('toast.notEnough', { field: t('code.nominativeCapitalize') }), life: 3000 })
        } else {
            toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
        }
    } finally {
        createdData.value = []
        deletedData.value = []
        updatedData.value = []
        createdKitData.value = []
        deletedKitData.value = []
        updatedKitData.value = []
    }
})

const normalizeDate = date => date ? new Date(date).getTime() : null

const clearProductForm = () => {
    isEditing.value = false
    productResetForm()
}

const clearKitForm = () => {
    isEditing.value = false
    kitResetForm()
}

function editProduct(updatedProduct) {
    // Duplicate check
    const exists = editableData.value.returnInvoiceProducts.some((p, i) =>
        i !== currentProductIndex.value &&
        p.orderInvoiceProduct.id === updatedProduct.orderInvoiceProduct.id,
    );

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

     const current = editableData.value.returnInvoiceProducts[currentProductIndex.value];

    const payload = {};

    if (updatedProduct.orderInvoiceProduct.id !== current.orderInvoiceProduct.id) {
        payload.orderInvoiceProduct = updatedProduct.orderInvoiceProduct
    }

    if (updatedProduct.qtyProduct !== current.qty) {
        payload.qty = updatedProduct.qtyProduct
    }

    if (current.id) {
        payload.returnInvoiceProduct = current['@id']
        const indexFromUpdatedData = updatedData.value.findIndex(data => data.returnInvoiceProduct['@id'] === payload.returnInvoiceProduct['@id'])

        if (indexFromUpdatedData !== -1) {
            updatedData.value[indexFromUpdatedData] = {
                ...payload
            }
        } else {
            updatedData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.returnInvoiceProducts[currentProductIndex.value] = {
            returnInvoiceProduct: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.returnInvoiceProducts[currentProductIndex.value] = {
            ...current,
            ...payload
        };

        const index = createdData.value.findIndex(p => (
            p.orderInvoiceProduct.id === current.orderInvoiceProduct.id
        ))

        if (index !== -1) {
            // Agar mavjud bo‘lsa yangilash
            createdData.value[index] = { ...createdData.value[index], ...updatedProduct }
        } else {
            // Aks holda push qilish
            createdData.value.push(updatedProduct)
        }
    }

    clearProductForm()
}

function editKit(updatedKit) {
    // Duplicate check
    const exists = editableData.value.returnInvoiceKits.some((p, i) =>
        i !== currentKitIndex.value &&
        p.orderInvoiceKit.id === updatedKit.orderInvoiceKit.id,
    );

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('kit.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const current = editableData.value.returnInvoiceKits[currentKitIndex.value];

    const payload = {};

    if (updatedKit.orderInvoiceKit.id !== current.orderInvoiceKit.id) {
        payload.orderInvoiceKit = updatedKit.orderInvoiceKit
    }

    if (updatedKit.qtyKit !== current.qty) {
        payload.qty = updatedKit.qtyKit
    }

    if (current.id) {
        payload.returnInvoiceKit = current['@id']
        const indexFromUpdatedData = updatedKitData.value.findIndex(data => data.returnInvoiceKit['@id'] === payload.returnInvoiceKit['@id'])

        if (indexFromUpdatedData !== -1) {
            updatedKitData.value[indexFromUpdatedData] = {
                ...payload
            }
        } else {
            updatedKitData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.returnInvoiceKits[currentKitIndex.value] = {
            returnInvoiceKit: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.returnInvoiceKits[currentKitIndex.value] = {
            ...current,
            ...payload
        };

        const index = createdData.value.findIndex(p => (
            p.orderInvoiceKit.id === current.orderInvoiceKit.id
        ))

        if (index !== -1) {
            // Agar mavjud bo‘lsa yangilash
            createdData.value[index] = { ...createdData.value[index], ...updatedKit }
        } else {
            // Aks holda push qilish
            createdData.value.push(updatedKit)
        }
    }

    clearKitForm()
}

function cancelEditing() {
    editMode.value = false;
    returnInvoiceResetForm()
}

function addProduct(newProduct) {
    const exists = editableData.value.returnInvoiceProducts.some(p => p.orderInvoiceProduct.id === newProduct.orderInvoiceProduct.id);

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const { qtyProduct, orderInvoiceProduct } = newProduct;

    editableData.value.returnInvoiceProducts.push({ orderInvoiceProduct, qty: qtyProduct});
    createdData.value.push({ orderInvoiceProduct: `/api/order_invoice_products/${orderInvoiceProduct.id}`, qty: qtyProduct})

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('product.nominativeCapitalize') }),
        life: 3000
    })

    productResetForm();
}

function addKit(newKit) {
    const exists = editableData.value.returnInvoiceKits.some(p => p.orderInvoiceKit.id === newKit.orderInvoiceKit.id);

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('kit.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const { qtyKit, orderInvoiceKit } = newKit;

    editableData.value.returnInvoiceKits.push({ orderInvoiceKit, qty: qtyKit });
    createdKitData.value.push({ orderInvoiceKit: `/api/order_invoice_kits/${orderInvoiceKit.id}`, qty: qtyKit})

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('kit.nominativeCapitalize') }),
        life: 3000
    })

    kitResetForm();
}

function deleteProductAction(product) {
    deleteProductVisible.value = true
    currentDeleteProduct.value = product
}

function deleteKitAction(kit) {
    deleteKitVisible.value = true
    currentDeleteKit.value = kit
}

function deleteProduct() {
    const index = editableData.value.returnInvoiceProducts.findIndex(p => p.id === currentDeleteProduct.value.id);

    if (index === -1) return;

    const current = editableData.value.returnInvoiceProducts[index];

    if (current.id) {
        // API’dan kelgan
        editableData.value.returnInvoiceProducts.splice(index, 1);

        deletedData.value.push({
            returnInvoiceProduct: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        editableData.value.returnInvoiceProducts.splice(index, 1);
    }

    deleteProductVisible.value = false
}

function deleteKit() {
    const index = editableData.value.returnInvoiceKits.findIndex(p => p.id === currentDeleteKit.value.id);

    if (index === -1) return;

    const current = editableData.value.returnInvoiceKits[index];

    if (current.id) {
        // API’dan kelgan
        editableData.value.returnInvoiceKits.splice(index, 1);

        deletedKitData.value.push({
            returnInvoiceKit: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        editableData.value.returnInvoiceKits.splice(index, 1);
    }

    deleteKitVisible.value = false
}

function editProductAction(data, index) {
    isEditing.value = true;
    currentProductIndex.value = index
    orderInvoiceProduct.value = data.orderInvoiceProduct
    qtyProduct.value = data.qty;
}

function editKitAction(data, index) {
    isEditing.value = true;
    currentKitIndex.value = index
    orderInvoiceKit.value = data.orderInvoiceKit
    qtyKit.value = data.qty;
}

watch(location, async () => {
    if (location.value) {
        await inventoryStore.fetchLastDateToByLocation({ location: `/api/locations/${location.value.id}`})

        if (inventoryStore.getLastInventoryDateTo === null) {
            dateFrom.value = null
            createdAt.value = null
        } else {
            const date = new Date(inventoryStore.getLastInventoryDateTo);
            date.setDate(date.getDate() + 1);
            dateFrom.value = date;
            // createdAt.value = date
        }
    } else {
        dateFrom.value = null
        createdAt.value = null
    }
})

onBeforeRouteLeave((to, from, next) => {
    if (isChanged.value && !isEdited.value) {
        showLeaveDialog.value = true
        pendingNavigation.value = next
    } else {
        next()
    }
})

const confirmLeave = () => {
    showLeaveDialog.value = false
    if (pendingNavigation.value) {
        pendingNavigation.value()
    }
}

onMounted(async () => {
    await returnInvoiceStore.fetchReturnInvoice(route.params.id);

    apiData.value = returnInvoiceStore.getReturnInvoice;
    editableData.value = JSON.parse(JSON.stringify(returnInvoiceStore.getReturnInvoice));

    setTimeout(() => {
        returnInvoiceResetForm({
            values: {
                location: returnInvoiceStore.getReturnInvoice.orderInvoice.location,
                customer: returnInvoiceStore.getReturnInvoice.orderInvoice.customer,
                createdAt: new Date(returnInvoiceStore.getReturnInvoice.createdAt),
                returnInvoiceProducts: returnInvoiceStore.getReturnInvoice.returnInvoiceProducts,
                returnInvoiceKits: returnInvoiceStore.getReturnInvoice.returnInvoiceKits
            }
        })
    })

    isLoading.value = false;
})
</script>

<template>
    <Breadcrumb :home="home" :model="items" class="rounded-md border border-surface-300 dark:border-surface-600/50">
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
        :section-name="t('cards.returnInvoice')"
        back-route-name="warehouse-return-invoices"
    >
        <template #buttons>
            <div v-if="!isLoading" class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
                <Button
                    v-if="!editMode && isAdminOrCreatedBy(returnInvoiceStore.getReturnInvoice.createdBy.id)"
                    :disabled="!!returnInvoiceErrors.returnInvoiceProducts"
                    icon="pi pi-pencil"
                    @click="editMode = true"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.edit')"
                    :loading="returnInvoiceIsSubmitting"
                />
                <SecondaryButton
                    v-if="editMode"
                    :disabled="!!returnInvoiceErrors.returnInvoiceProducts"
                    @click="cancelEditing"
                    class="px-2 sm:px-5 whitespace-nowrap bg-surface-0! dark:bg-surface-800!"
                    :label="t('dialog.cancel')"
                />
                <Button
                    v-if="editMode"
                    :disabled="!isChanged"
                    icon="pi pi-save"
                    @click="onSubmitReturnInvoice"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="returnInvoiceIsSubmitting"
                />
            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    v-if="!editMode"
                    :disabled="!!returnInvoiceErrors.returnInvoiceProducts"
                    icon="pi pi-pencil"
                    @click="editMode = true"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.edit')"
                    :loading="returnInvoiceIsSubmitting"
                />
                <Button
                    v-if="editMode"
                    :disabled="!!returnInvoiceErrors.returnInvoiceProducts"
                    icon="pi pi-save"
                    @click="onSubmitReturnInvoice"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="returnInvoiceIsSubmitting"
                />

                <SecondaryButton
                    v-if="editMode"
                    :disabled="!!returnInvoiceErrors.returnInvoiceProducts"
                    @click="cancelEditing"
                    class="w-full px-2 sm:px-5 whitespace-nowrap bg-surface-0! dark:bg-surface-800!"
                    :label="t('dialog.cancel')"
                />

                <Button
                    v-if="editMode"
                    :disabled="!isChanged"
                    icon="pi pi-save"
                    @click="onSubmitReturnInvoice"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="returnInvoiceIsSubmitting"
                />
            </div>
        </template>

        <template #sectionBody>
            <Card
                pt:root=" overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <div class="font-medium mb-4">{{ t('returnData') }}</div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm">{{ t('labels.location') }}</p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="location"
                                :fetchFn="(query) => locationStore.fetchLocations({...query, isWarehouse: true })"
                                :options="locationStore.getLocations.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.location')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems"
                                :invalid="!!returnInvoiceErrors.location"
                                disabled
                                :show-clear="false"
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.Customer') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="customer"
                                :fetchFn="(query) => customerStore.fetchCustomers({ ...query, 'is-b2b': true})"
                                :options="customerStore.getCustomers.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.customer')"
                                :loading="customerStore.getIsLoadingCustomers"
                                :total-items="customerStore.getCustomers.totalItems"
                                :invalid="!!returnInvoiceErrors.customer"
                                disabled
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.createdAt') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <DatePicker
                                v-if="!isLoading"
                                v-model.trim="createdAt"
                                dateFormat="dd.mm.yy"
                                showIcon
                                fluid
                                iconDisplay="input"
                                :placeholder="t('placeholders.date')"
                                show-button-bar
                                :minDate="dateFrom"
                                :invalid="!!returnInvoiceErrors.createdAt"
                                showTime
                                hourFormat="24"
                                disabled
                            />
                        </div>
                    </div>
                </template>
            </Card>
            <Card
                v-if="editMode"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <Tabs v-model:value="tabVal" scrollable :showNavigators="false">
                        <TabList>
                            <Tab pt:root="font-medium dark:text-surface-0" v-for="tab of tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
                        </TabList>
                        <TabPanels pt:root="px-0 pb-0">
                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'products'"
                                value="products"
                            >
                                <div class="font-medium mb-4">{{ t('addProduct') }}</div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm">{{ t('labels.product') }}<span class="text-red-500"> *</span></p>
                                        <SearchSelect
                                            v-model="orderInvoiceProduct"
                                            :fetchFn="(query) => orderInvoiceProductStore.fetchOrderInvoiceProducts({...query, orderInvoice: returnInvoiceStore.getReturnInvoice.id})"
                                            :options="orderInvoiceProductStore.getOrderInvoiceProducts.models"
                                            :option-label="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${opt?.qty} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :option-value="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${opt?.qty} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :return-value="opt => opt"
                                            :search-value="opt => opt.id"
                                            search-key="name"
                                            :placeholder="t('placeholders.select.product')"
                                            :loading="orderInvoiceProductStore.getIsLoadingOrderInvoiceProducts"
                                            :total-items="orderInvoiceProductStore.getOrderInvoiceProducts.totalItems"
                                            :invalid="!!productErrors.orderInvoiceProduct"
                                        >
                                            <template v-if="orderInvoiceProductStore.getOrderInvoiceProducts.models.length" #header>
                                                <p class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{ t('labels.title') }} | {{ t('labels.code') }} | {{ t('labels.color') }} | {{ t('labels.qty') }}</p>
                                            </template>
                                        </SearchSelect>
                                    </div>

                                    <div>
                                        <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="qtyProduct"
                                            fluid
                                            showButtons
                                            :placeholder="t('placeholders.qty')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!productErrors.qtyProduct"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearProductForm" />
                                    <Button v-if="!isEditing" @click="onSubmitProduct" :label="t('buttons.add')" class="px-5" :loading="productIsSubmitting"/>
                                    <Button v-else @click="onEditProduct" :label="t('buttons.edit')" class="px-5"/>
                                </div>
                            </TabPanel>

                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'kits'"
                                value="kits"
                            >
                                <div class="font-medium mb-4">{{ t('addKit') }}</div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm">{{ t('labels.kit') }}<span class="text-red-500"> *</span></p>
                                        <SearchSelect
                                            v-model="orderInvoiceKit"
                                            :fetchFn="(query) => orderInvoiceKitStore.fetchOrderInvoiceKits({...query, orderInvoice: returnInvoiceStore.getReturnInvoice.id})"
                                            :options="orderInvoiceKitStore.getOrderInvoiceKits.models"
                                            :option-label="opt => `${opt?.kit?.name} | ${opt?.kit?.code} | ${opt?.qty} ${t(`labels.pcs`)}`"
                                            :option-value="opt => `${opt?.kit?.name} | ${opt?.kit?.code} | ${opt?.qty} ${t(`labels.pcs`)}`"
                                            :return-value="opt => opt"
                                            :search-value="opt => opt.id"
                                            search-key="name"
                                            :placeholder="t('placeholders.select.kit')"
                                            :loading="orderInvoiceKitStore.getIsLoadingOrderInvoiceKits"
                                            :total-items="orderInvoiceKitStore.getOrderInvoiceKits.totalItems"
                                            :invalid="!!kitErrors.orderInvoiceKit"
                                        >
                                            <template v-if="orderInvoiceKitStore.getOrderInvoiceKits.models.length" #header>
                                                <p class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{ t('labels.title') }} | {{ t('labels.code') }} | {{ t('labels.qty') }}</p>
                                            </template>
                                        </SearchSelect>
                                    </div>

                                    <div>
                                        <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="qtyKit"
                                            fluid
                                            showButtons
                                            :placeholder="t('placeholders.qty')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!kitErrors.qtyKit"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearKitForm" />
                                    <Button v-if="!isEditing" @click="onSubmitKit" :label="t('buttons.add')" class="px-5" :loading="kitIsSubmitting"/>
                                    <Button v-else @click="onEditKit" :label="t('buttons.edit')" class="px-5"/>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
            <Card
                pt:root="h-fit grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="grow flex flex-col p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <Tabs v-model:value="tabVal" scrollable :showNavigators="false">
                        <TabList v-if="!editMode">
                            <Tab pt:root="font-medium dark:text-surface-0" v-for="tab of tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
                        </TabList>
                        <TabPanels pt:root="px-0 pb-0">
                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'products'"
                                value="products"
                            >
                                <NoData v-if="!editableData?.returnInvoiceProducts?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="isLoading ? Array(10).fill({}) : editableData.returnInvoiceProducts"
                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <Column field="product" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.orderInvoiceProduct?.product?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.orderInvoiceProduct?.product?.code || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qr" :header="t('labels.qr')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.orderInvoiceProduct?.product?.qr || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="color" :header="t('labels.color')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.orderInvoiceProduct?.color?.name || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="price" :header="t('labels.price')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ (formatCurrency(data.orderInvoiceProduct?.price) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.qty }} {{t(`labels.${data.orderInvoiceProduct?.product?.category?.unit?.name}`)}}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="editMode" field="actions" :header="t('actions')">
                                        <template #body="{ data, index }">
                                            <div class="flex justify-end w-full">
                                                <Skeleton height="2rem" v-if="isLoading"/>
                                                <div v-else class="flex items-center gap-2">
                                                    <Button
                                                        @click="editProductAction(data, index)"
                                                        icon="pi pi-pencil"
                                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                                        size="small"
                                                    />
                                                    <Button
                                                        @click="deleteProductAction(data)"
                                                        icon="pi pi-trash"
                                                        pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>
                                </DataTable>
                            </TabPanel>

                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'kits'"
                                value="kits"
                            >
                                <NoData v-if="!editableData?.returnInvoiceKits?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="isLoading ? Array(10).fill({}) : editableData?.returnInvoiceKits"                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <Column field="kit" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <p>{{ data.orderInvoiceKit?.kit?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <p>{{ data.orderInvoiceKit?.kit?.code || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qr" :header="t('labels.qr')">
                                        <template #body="{ data }">
                                            <p>{{ data.orderInvoiceKit?.kit?.qr || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="price" :header="t('labels.price')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.orderInvoiceKit?.price) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <p>{{ data.qty }} {{t(`labels.pcs`)}}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="editMode" field="actions" :header="t('actions')">
                                        <template #body="{ data, index }">
                                            <div class="flex justify-end w-full">
                                                <div class="flex items-center gap-2">
                                                    <Button
                                                        @click="editKitAction(data, index)"
                                                        icon="pi pi-pencil"
                                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                                        size="small"
                                                    />
                                                    <Button
                                                        @click="deleteKitAction(data)"
                                                        icon="pi pi-trash"
                                                        pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>
                                </DataTable>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
            <!-- DELETE PRODUCT DIALOG -->
            <Dialog
                v-model:visible="deleteProductVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.deleteConfirm', { name: t('product.accusative') }) }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="deleteProductVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteProduct"
                            :loading="isDeleteProductLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
            <!-- DELETE KIT DIALOG  -->
            <Dialog
                v-model:visible="deleteKitVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.deleteConfirm', { name: t('kit.accusative') }) }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="deleteKitVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteKit()"
                            :loading="isDeleteKitLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
            <!-- CANCEL CHANGES BEFORE LEAVE CURRENT ROUTE DIALOG -->
            <Dialog
                v-model:visible="showLeaveDialog"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.leaveFromEditMessage') }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton type="button" :label="t('dialog.cancel')" @click="showLeaveDialog = false" />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="confirmLeave"
                            class="px-5"
                            :loading="isConfirmLoading"
                        />
                    </div>
                </template>
            </Dialog>
        </template>
    </Section>
</template>
