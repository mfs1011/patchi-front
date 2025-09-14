<script setup>
import {onBeforeRouteLeave, useRoute} from "vue-router";
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
import SecondaryButton from "@/volt/SecondaryButton.vue";
import Button from "@/volt/Button.vue";
import NoData from "@/components/UI/NoData.vue";
import {useI18n} from "vue-i18n";
import {useLocationStore} from "@/stores/location.js";
import {useInventoryStore} from "@/stores/inventory.js";
import {formatCurrency, getFormattedDate, getFormattedDateWithTime} from "@/helpers/numberFormat.js";
import {useColorStore} from "@/stores/color.js";
import {useToast} from "primevue/usetoast";
import {useTransferInvoiceValidation} from "@/views/warehouse/transferInvoice/useWarehouseTransferInvoiceForm.js";
import {useTransferInvoiceStore} from "@/stores/transferInvoice.js";
import Tabs from "@/volt/Tabs.vue";
import TabPanels from "@/volt/TabPanels.vue";
import Tab from "@/volt/Tab.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import {useLocationQuantityStore} from "@/stores/locationQuantity.js";
import {useLocationQuantityKitStore} from "@/stores/locationQuantityKit.js";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row"
import {useUserStore} from "@/stores/user.js";

const route = useRoute();
const toast = useToast()
const transferInvoiceStore = useTransferInvoiceStore();
const userStore = useUserStore();
const locationQuantityStore = useLocationQuantityStore();
const locationQuantityKitStore = useLocationQuantityKitStore();
const locationStore = useLocationStore();
const colorStore = useColorStore();
const { t } = useI18n();
const {
    transferInvoiceHandleSubmit,
    transferInvoiceErrors,
    transferInvoiceIsSubmitting,
    transferInvoiceResetForm,
    fromLocation,
    toLocation,
    transferInvoiceProducts,
    transferInvoiceKits,
    locationQuantityHandleSubmit,
    locationQuantityErrors,
    locationQuantityIsSubmitting,
    locationQuantityResetForm,
    locationQuantityValidate,
    locationQuantity,
    qtyLocationQuantity,
    locationQuantityKitHandleSubmit,
    locationQuantityKitErrors,
    locationQuantityKitResetForm,
    locationQuantityKitValidate,
    locationQuantityKit,
    qtyLocationQuantityKit,
} = useTransferInvoiceValidation()

const apiData = ref(null);
const editableData = ref(null);
const currentLocationQuantityIndex = ref(null);
const currentLocationQuantityKitIndex = ref(null);
const currentDeleteLocationQuantity = ref(null);
const currentDeleteLocationQuantityKit = ref(null);
const deletedData = ref([]);
const createdData = ref([]);
const updatedData = ref([]);
const dateFrom = ref(null);
const editMode = ref(false);
const isLoading = ref(false);
const deleteLocationQuantityVisible = ref(false);
const deleteLocationQuantityKitVisible = ref(false);
const isDeleteLocationQuantityLoading = ref(false);
const isDeleteLocationQuantityKitLoading = ref(false);
const showLeaveDialog = ref(false);
const isEditing = ref(false);
const pendingNavigation = ref(false);
const isEdited = ref(false);
const isConfirmLoading = ref(false);
const editingProductIndex = ref(null)
const editingKitIndex = ref(null)
const tabVal = ref('products')

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("warehouse"),
    route: "/warehouse",
}));

const items = computed(() => [{ label: t("cards.transferInvoices"), route: { name: 'warehouse-transfer-invoices'} }, { label: t("cards.transferInvoice") }]);
const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])
const isChanged = computed(() => (
    createdData.value.length ||
    updatedData.value.length ||
    deletedData.value.length ||
    transferInvoiceStore.getTransferInvoice?.fromLocation?.id !== fromLocation.value?.id ||
    transferInvoiceStore.getTransferInvoice?.toLocation?.id !== toLocation.value?.id
));
const isAcceptedTransferInvoice = computed(() => transferInvoiceStore.getTransferInvoice.status === 2)

// functions
const onSubmitLocationQuantity = locationQuantityHandleSubmit((values) => {
    addProduct(values)
})

const onEditLocationQuantity = locationQuantityHandleSubmit((values) => {
    editProduct(values)
})

const onSubmitLocationQuantityKit = locationQuantityKitHandleSubmit((values) => {
    addKit(values)
})

const onEditLocationQuantityKit = locationQuantityKitHandleSubmit((values) => {
    editKit(values)
})

const onSubmitIncomeInvoice = transferInvoiceHandleSubmit((values) => {
    const payload = {};

    payload.transferInvoiceProducts = [...createdData.value, ...updatedData.value, ...deletedData.value]

    if (values.supplier.id !== apiData.value.supplier.id) {
        payload.supplier = values.supplier['@id']
    }

    if (values.comment !== apiData.value.comment) {
        payload.comment = values.comment
    }

    if (new Date(values.createdAt).toISOString() !== new Date(apiData.value.createdAt).toISOString()) {
        payload.createdAt = values.createdAt
    }

    transferInvoiceStore.putTransferInvoice(payload, route.params.id)
    isEditing.value = false
    editMode.value = false
    isEdited.value = true
    toast.add({
        severity: 'success',
        summary: t('toast.successEditingSave'),
        life: 3000
    })
})

const normalizeDate = date => date ? new Date(date).getTime() : null

const clearLocationQuantityForm = () => {
    isEditing.value = false
    locationQuantityResetForm()
}

function addProduct(newProduct) {
    const exists = editableData.value.transferInvoiceProducts.some(p => p.id === newProduct.id);

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    editableData.value.transferInvoiceProducts.push(newProduct);

    createdData.value.push(newProduct)

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('product.nominativeCapitalize') }),
        life: 3000
    })

    locationQuantityResetForm();
}

function deleteLocationQuantityAction(product) {
    deleteLocationQuantityVisible.value = true
    currentDeleteLocationQuantity.value = product
}

function deleteLocationQuantityKitAction(product) {
    deleteLocationQuantityKitVisible.value = true
    currentDeleteLocationQuantityKit.value = product
}

function deleteLocationQuantity() {
    const index = editableData.value.transferInvoiceProducts.findIndex(p => p.id === currentDeleteLocationQuantity.value.id);
    console.log('deleteLocationQuantity', editableData.value)

    if (index === -1) return;

    const current = editableData.value.transferInvoiceProducts[index];

    if (current.id) {
        // API’dan kelgan
        editableData.value.transferInvoiceProducts.splice(index, 1);

        deletedData.value.push({
            transferInvoiceProduct: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        editableData.value.transferInvoiceProducts.splice(index, 1);
    }
    deleteLocationQuantityVisible.value = false
    console.log(editableData.value.transferInvoiceProducts)
}

function deleteLocationQuantityKit() {
    const index = editableData.value.transferInvoiceProducts.findIndex(p => p.id === currentDeleteLocationQuantityKit.value.id);

    if (index === -1) return;

    const current = editableData.value.transferInvoiceProducts[index];

    if (current.id) {
        // API’dan kelgan
        editableData.value.transferInvoiceProducts.splice(index, 1);

        deletedData.value.push({
            transferInvoiceKit: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        editableData.value.transferInvoiceProducts.splice(index, 1);
    }
    deleteLocationQuantityKitVisible.value = false
}

function edit(data, index) {
    console.log(data)
    isEditing.value = true;
    currentProductIndex.value = index
    locationQuantity.value = data.locationQuantity;
    qtyLocationQuantity.value = data.qty;
}

async function fetchLocation(query) {
    console.log('fetch')
    const params = {
        ...query,
        isWarehouse: true
    }

    if (userStore.getAboutMeFromToken.role === 'ROLE_WAREHOUSE_MANAGER') {
        params.user = userStore.getAboutMeFromToken.id
    }

    await locationStore.fetchLocations(params)
}

function editProduct(updatedProduct) {
    // Duplicate check
    const exists = editableData.value.transferInvoiceProducts.some((p, i) =>
        i !== currentProductIndex.value &&
        p.product.id === updatedProduct.product.id &&
        p.color?.id === updatedProduct.color?.id &&
        normalizeDate(p.expiryDate) === normalizeDate(updatedProduct.expiryDate)
    );

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const current = editableData.value.transferInvoiceProducts[currentProductIndex.value];

    const payload = {};

    if (updatedProduct.product.id !== current.product.id) {
        payload.product = updatedProduct.product
    }

    if (updatedProduct.color?.id !== current.color?.id) {
        payload.color = updatedProduct.color
    }

    if (normalizeDate(updatedProduct.expiryDate) !== normalizeDate(current.expiryDate)) {
        payload.expiryDate = updatedProduct.expiryDate
    }

    if (updatedProduct.qty !== current.qty) {
        payload.qty = updatedProduct.qty
    }

    if (updatedProduct.price !== current.price) {
        payload.price = updatedProduct.price
    }

    if (updatedProduct.customsFee !== current.customsFee) {
        payload.customsFee = updatedProduct.customsFee
    }

    if (updatedProduct.transportationFee !== current.transportationFee) {
        payload.transportationFee = updatedProduct.transportationFee
    }

    if (current.id) {
        payload.transferInvoiceProduct = current['@id']
        const indexFromUpdatedData = updatedData.value.findIndex(data => data.incomeInvoiceProduct['@id'] === payload.incomeInvoiceProduct['@id'])

        if (indexFromUpdatedData !== -1) {
            updatedData.value[indexFromUpdatedData] = {
                payload
            }
        } else {
            updatedData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.transferInvoiceProducts[currentProductIndex.value] = {
            incomeInvoiceProduct: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.transferInvoiceProducts[currentProductIndex.value] = {
            ...current,
            ...payload
        };

        const index = createdData.value.findIndex(p => (
            p.product.id === current.product.id &&
            p.color?.id === current.color?.id &&
            normalizeDate(p.expiryDate) === normalizeDate(current.expiryDate)
        ))

        if (index !== -1) {
            // Agar mavjud bo‘lsa yangilash
            createdData.value[index] = { ...createdData.value[index], ...updatedProduct }
        } else {
            // Aks holda push qilish
            createdData.value.push(updatedProduct)
        }
    }

    clearLocationQuantityForm()
}

function cancelEditing() {
    editMode.value = false;
    transferInvoiceResetForm()
}

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
    isLoading.value = true;
    await transferInvoiceStore.fetchTransferInvoice(route.params.id);

    apiData.value = transferInvoiceStore.getTransferInvoice;
    editableData.value = JSON.parse(JSON.stringify(transferInvoiceStore.getTransferInvoice));

    setTimeout(() => {
        transferInvoiceResetForm({
            values: {
                fromLocation: transferInvoiceStore.getTransferInvoice.fromLocation,
                toLocation: transferInvoiceStore.getTransferInvoice.toLocation,
                transferInvoiceProducts: transferInvoiceStore.getTransferInvoice.transferInvoiceProducts,
                transferInvoiceKits: transferInvoiceStore.getTransferInvoice.transferInvoiceKits
            }
        })
    })

    isLoading.value = false;
})
</script>

<template>
    <pre class="text-surface-0">{{editableData?.transferInvoiceProducts}}</pre>
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
        :section-name="t('sections.sellers.add')"
        back-route-name="warehouse-transfer-invoices"
    >
        <template #buttons>
            <div v-if="!isLoading && !isAcceptedTransferInvoice" class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
                <Button
                    v-if="!editMode"
                    :disabled="!!transferInvoiceErrors.transferInvoiceProducts"
                    icon="pi pi-pencil"
                    @click="editMode = true"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.edit')"
                    :loading="transferInvoiceIsSubmitting"
                />
                <SecondaryButton
                    v-if="editMode"
                    :disabled="!!transferInvoiceErrors.transferInvoiceProducts"
                    @click="cancelEditing"
                    class="px-2 sm:px-5 whitespace-nowrap bg-surface-0! dark:bg-surface-800!"
                    :label="t('dialog.cancel')"
                    :loading="transferInvoiceIsSubmitting"
                />
                <Button
                    v-if="editMode"
                    :disabled="!isChanged"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="transferInvoiceIsSubmitting"
                />

            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    v-if="!editMode"
                    :disabled="!!transferInvoiceErrors.incomeInvoiceProducts"
                    icon="pi pi-pencil"
                    @click="editMode = true"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.edit')"
                    :loading="transferInvoiceIsSubmitting"
                />
                <Button
                    v-if="editMode"
                    :disabled="!!transferInvoiceErrors.incomeInvoiceProducts"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="transferInvoiceIsSubmitting"
                />

                <SecondaryButton
                    v-if="editMode"
                    :disabled="!!transferInvoiceErrors.incomeInvoiceProducts"
                    @click="cancelEditing"
                    class="w-full px-2 sm:px-5 whitespace-nowrap bg-surface-0! dark:bg-surface-800!"
                    :label="t('dialog.cancel')"
                    :loading="transferInvoiceIsSubmitting"
                />

                <Button
                    v-if="editMode"
                    :disabled="!isChanged"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="transferInvoiceIsSubmitting"
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
                    <div class="font-medium mb-4">{{ t('incomingData') }}</div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm">{{ t('labels.fromLocation') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>
                            <SearchSelect
                                v-if="!isLoading"
                                v-model="fromLocation"
                                :fetchFn="fetchLocation"
                                :options="locationStore.getLocations.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt?.id"
                                :placeholder="t('placeholders.search.byLocation')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems"
                                :disabled="!editMode"
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.toLocation') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="toLocation"
                                :fetchFn="(query) => locationStore.fetchLocations({ ...query })"
                                :options="locationStore.getLocations.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt?.id"
                                :placeholder="t('placeholders.search.byLocation')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems"
                                :disabled="!editMode"
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
                                            v-model="locationQuantity"
                                            :fetchFn="(query) => locationQuantityStore.fetchLocationQuantities({...query, location: fromLocation.id})"
                                            :options="locationQuantityStore.getLocationQuantities.models"
                                            :option-label="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${opt.expiryDate ? getFormattedDate(opt?.expiryDate) : '-'} | ${opt?.qty} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :option-value="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${opt.expiryDate ? getFormattedDate(opt?.expiryDate) : '-'} | ${opt?.qty} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :return-value="opt => opt"
                                            search-key="product"
                                            :search-value="opt => opt.product.id"
                                            :placeholder="t('placeholders.select.product')"
                                            :loading="locationQuantityStore.getIsLoadingLocationQuantity"
                                            :total-items="locationQuantityStore.getLocationQuantities.totalItems"
                                            :invalid="!!locationQuantityErrors.locationQuantity"
                                        >
                                            <template v-if="locationQuantityStore.getLocationQuantities.models.length" #header>
                                                <div class="px-4 py-2 bg-surface-100 dark:bg-surface-900 grid grid-cols-5 gap-4">
                                                    <div>{{t('labels.title')}}</div>
                                                    <div>{{t('labels.code') }}</div>
                                                    <div>{{t('labels.color')}}</div>
                                                    <div>{{t('labels.expiryDate')}}</div>
                                                    <div>{{t('labels.qty')}}</div>
                                                </div>
                                            </template>
                                            <template #option="{ option }">
                                                <div class="grid grid-cols-5 w-full gap-4">
                                                    <div>{{ option?.product?.name }}</div>
                                                    <div>{{ option?.product?.code }}</div>
                                                    <div>{{ option?.color?.name ?? '-' }}</div>
                                                    <div>{{ getFormattedDate(option?.expiryDate) }}</div>
                                                    <div>{{ formatCurrency(option?.qty) }} {{ t(`labels.${option?.product?.category?.unit?.name}`) }}</div>
                                                </div>
                                            </template>
                                        </SearchSelect>
                                    </div>

                                    <div>
                                        <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="qtyLocationQuantity"
                                            fluid
                                            showButtons
                                            :placeholder="t('placeholders.qty')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!locationQuantityErrors.qtyLocationQuantity"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearLocationQuantityForm" />
                                    <Button v-if="!isEditing" @click="onSubmitLocationQuantity" :label="t('buttons.add')" class="px-5" :loading="locationQuantityIsSubmitting"/>
                                    <Button v-else @click="onEditLocationQuantity" :label="t('buttons.edit')" class="px-5"/>
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
                                            v-model="locationQuantityKit"
                                            :fetchFn="(query) => locationQuantityKitStore.fetchLocationQuantityKits({...query, location: fromLocation.id})"
                                            :options="locationQuantityKitStore.getLocationQuantityKits.models"
                                            :option-label="opt => `${opt?.kit?.name} | ${opt?.kit?.code} | ${getFormattedDate(opt?.expiryDate)} | ${opt?.qty} ${t(`labels.pcs`)}`"
                                            :option-value="opt => `${opt?.kit?.name} | ${opt?.kit?.code} | ${getFormattedDate(opt?.expiryDate)} | ${opt?.qty} ${t(`labels.pcs`)}`"
                                            :return-value="opt => opt"
                                            :placeholder="t('placeholders.select.kit')"
                                            :loading="locationQuantityKitStore.getIsLoadingLocationQuantityKit"
                                            :total-items="locationQuantityKitStore.getLocationQuantityKits.totalItems"
                                            :invalid="!!locationQuantityKitErrors.locationQuantityKit"
                                        >
                                            <template v-if="locationQuantityKitStore.getLocationQuantityKits.models.length" #header>
                                                <div class="px-4 py-2 bg-surface-100 dark:bg-surface-900 grid grid-cols-4 gap-4">
                                                    <div>{{t('labels.title')}}</div>
                                                    <div>{{t('labels.code') }}</div>
                                                    <div>{{t('labels.expiryDate')}}</div>
                                                    <div>{{t('labels.qty')}}</div>
                                                </div>
                                            </template>
                                            <template #option="{ option }">
                                                <div class="grid grid-cols-4 w-full gap-4">
                                                    <div>{{ option?.kit?.name }}</div>
                                                    <div>{{ option?.kit?.code }}</div>
                                                    <div>{{ getFormattedDate(option?.expiryDate) }}</div>
                                                    <div>{{ formatCurrency(option?.qty) }} {{ t(`labels.pcs`) }}</div>
                                                </div>
                                            </template>
                                        </SearchSelect>
                                    </div>

                                    <div>
                                        <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="qtyLocationQuantityKit"
                                            fluid
                                            showButtons
                                            :placeholder="t('placeholders.qty')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!locationQuantityKitErrors.qtyLocationQuantityKit"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearLocationQuantityForm" />
                                    <Button v-if="!isEditing" @click="onSubmitLocationQuantityKit" :label="t('buttons.add')" class="px-5" :loading="locationQuantityIsSubmitting"/>
                                    <Button v-else @click="onEditLocationQuantityKit" :label="t('buttons.edit')" class="px-5"/>
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
                                <NoData v-if="!editableData?.transferInvoiceProducts?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="isLoading ? Array(10).fill({}) : editableData.transferInvoiceProducts"
                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <ColumnGroup type="header">
                                        <Row>
                                            <Column :header="t('labels.product')" :rowspan="1" :colspan="5"/>
                                            <Column :header="t('labels.expiryDate')" :rowspan="2" :colspan="1" />
                                            <Column :header="t('labels.qty')" :rowspan="2" :colspan="1" />
                                            <Column v-if="editMode" :header="t('actions')" :rowspan="2" :colspan="1" />
                                        </Row>
                                        <Row>
                                            <Column field="kit" :header="t('labels.title')" />
                                            <Column field="code" :header="t('labels.code')" />
                                            <Column field="color" :header="t('labels.color')" />
                                            <Column field="qr" :header="t('labels.qr')" />
                                            <Column field="costPrice" :header="t('labels.costPrice')" />
                                        </Row>
                                    </ColumnGroup>
                                    <Column field="product" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.locationQuantity?.product?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.locationQuantity?.product?.code || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="color" :header="t('labels.color')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.locationQuantity?.color?.name || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qr" :header="t('labels.qr')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.locationQuantity?.product?.qr || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="costPrice" :header="t('labels.costPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ (formatCurrency(data.locationQuantity?.product?.costPrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.locationQuantity?.expiryDate ? getFormattedDateWithTime(data.locationQuantity?.expiryDate) : '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.qty }} {{t(`labels.${data.locationQuantity?.product?.category?.unit?.name}`)}}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="editMode" field="actions" :header="t('actions')">
                                        <template #body="{ data, index }">
                                            <div class="flex justify-end w-full">
                                                <Skeleton height="2rem" v-if="isLoading"/>
                                                <div v-else class="flex items-center gap-2">
                                                    <Button
                                                        @click="edit(data, index)"
                                                        icon="pi pi-pencil"
                                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                                        size="small"
                                                    />
                                                    <Button
                                                        @click="deleteLocationQuantityAction(data)"
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
                                <NoData v-if="!editableData?.transferInvoiceKits?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="isLoading ? Array(10).fill({}) : editableData?.transferInvoiceKits"                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <ColumnGroup type="header">
                                        <Row>
                                            <Column :header="t('labels.kit')" :rowspan="1" :colspan="6" class="text-center!"/>
                                            <Column :header="t('labels.expiryDate')" :rowspan="2" :colspan="1" />
                                            <Column :header="t('labels.qty')" :rowspan="2" :colspan="1" />
                                            <Column :header="t('labels.transferQty')" :rowspan="2" :colspan="1" />
                                            <Column v-if="editMode" :header="t('actions')" :rowspan="2" :colspan="1" />
                                        </Row>
                                        <Row>
                                            <Column field="kit" :header="t('labels.title')" />
                                            <Column field="code" :header="t('labels.code')" />
                                            <Column field="qr" :header="t('labels.qr')" />
                                            <Column field="costPrice" :header="t('labels.costPrice')" />
                                            <Column field="wholesalePrice" :header="t('labels.wholesalePrice')" />
                                            <Column field="retailPrice" :header="t('labels.retailPrice')" />
                                        </Row>
                                    </ColumnGroup>
                                    <Column field="kit" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantityKit?.kit?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantityKit?.kit?.code || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qr" :header="t('labels.qr')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantityKit?.kit?.qr || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="costPrice" :header="t('labels.costPrice')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.locationQuantityKit?.kit?.costPrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="wholesalePrice" :header="t('labels.wholesalePrice')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.locationQuantityKit?.kit?.wholesalePrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="retailPrice" :header="t('labels.retailPrice')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.locationQuantityKit?.kit?.retailPrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantityKit?.expiryDate ? getFormattedDateWithTime(data.locationQuantityKit?.expiryDate) : '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantityKit.qty }} {{t(`labels.pcs`)}}</p>
                                        </template>
                                    </Column>
                                    <Column field="qtyLocationQuantityKit" :header="t('labels.transferQty')">
                                        <template #body="{ data }">
                                            <p>{{ data.qtyLocationQuantityKit }} {{t(`labels.pcs`)}}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="editMode" field="actions" :header="t('actions')">
                                        <template #body="{ data, index }">
                                            <div class="flex justify-end w-full">
                                                <div class="flex items-center gap-2">
                                                    <Button
                                                        @click="editKit(data, index)"
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
            <!-- DELETE LOCATION_QUANTITY DIALOG -->
            <Dialog
                v-model:visible="deleteLocationQuantityVisible"
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
                            @click="deleteLocationQuantityVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteLocationQuantity"
                            :loading="isDeleteLocationQuantityLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
            <!-- DELETE LOCATION_QUANTITY_KIT DIALOG  -->
            <Dialog
                v-model:visible="deleteLocationQuantityKitVisible"
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
                            @click="deleteLocationQuantityKitVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteLocationQuantityKit(currentLocationQuantityKitIndex)"
                            :loading="isDeleteLocationQuantityKitLoading"
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
