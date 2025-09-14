<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {onBeforeRouteLeave, useRouter} from "vue-router";
import {useLocationStore} from "@/stores/location.js";
import {useToast} from "primevue/usetoast";
import InputNumber from "@/volt/InputNumber.vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {formatCurrency, getFormattedDate, getFormattedDateWithTime} from "@/helpers/numberFormat.js";
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

const { t } = useI18n()
const toast = useToast()
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

const locationStore = useLocationStore();
const userStore = useUserStore();
const locationQuantityStore = useLocationQuantityStore();
const locationQuantityKitStore = useLocationQuantityKitStore();
const transferInvoiceStore = useTransferInvoiceStore();
const router = useRouter();
const currentProduct = ref({})
const currentKit = ref({})
const deleteProductVisible = ref(false)
const deleteKitVisible = ref(false)
const isDeleteLoading = ref(false)
const isEditing = ref(false)
const showLeaveDialog = ref(false)
const isConfirmLoading = ref(false)
const pendingNavigation = ref(false)
const editingProductIndex = ref(null)
const editingKitIndex = ref(null)
const tabVal = ref('products')

const home = computed(() => ({
    icon: 'pi pi-home',
    label: t('warehouse'),
    route: '/warehouse'
}));

const items = computed(() => [{ label: t('cards.transferInvoices'), route: { name: 'warehouse-transfer-invoices'} }, { label: t('sections.transferInvoices.add') }]);
const hasTransferInvoiceData = computed(() => !!toLocation.value && !!fromLocation.value)
const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])

const isChanged = computed(() => (
    !!fromLocation.value ||
    !!toLocation.value ||
    !!transferInvoiceProducts.value.length ||
    !!transferInvoiceKits.value.length
))

const isSetAllData = computed(() => (
    !!fromLocation.value &&
    !!toLocation.value &&
    (!!transferInvoiceProducts.value.length ||
    !!transferInvoiceKits.value.length)
))

const onSubmitTransferInvoice = transferInvoiceHandleSubmit(async values => {
    const payload = {
        fromLocation: values.fromLocation['@id'],
        toLocation: values.toLocation['@id'],
        transferInvoiceProducts: values.transferInvoiceProducts.map(transferInvoiceProduct => ({
            locationQuantity: `api/location_quantities/${transferInvoiceProduct.locationQuantity.id}`,
            qty: transferInvoiceProduct.qtyLocationQuantity,
        })),
        transferInvoiceKits: values.transferInvoiceKits.map(transferInvoiceKit => ({
            locationQuantityKit: `api/location_quantity_kits/${transferInvoiceKit.locationQuantityKit.id}`,
            qty: transferInvoiceKit.qtyLocationQuantityKit,
        }))
    };

    try {
        await transferInvoiceStore.pushTransferInvoice(payload)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('transferInvoice.nominativeCapitalize') }), life: 3000 })
        transferInvoiceResetForm()
        locationQuantityResetForm()
        locationQuantityKitResetForm()
        router.back()

    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
    }
})

const onSubmitLocationQuantity = locationQuantityHandleSubmit(async values => {
    const isInclude = transferInvoiceProducts.value.some(transferInvoiceProduct => transferInvoiceProduct.locationQuantity?.id === values.locationQuantity?.id)

    if (isInclude) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })
    } else {
        transferInvoiceProducts.value = [...transferInvoiceProducts.value, values]
        currentProduct.value = values
        locationQuantityResetForm()
    }
})

const onSubmitLocationQuantityKit = locationQuantityKitHandleSubmit(async values => {
    const isInclude = transferInvoiceKits.value.some(transferInvoiceKit => transferInvoiceKit.locationQuantityKit?.id === values.locationQuantityKit?.id)

    if (isInclude) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('kit.nominativeCapitalize') }),
            life: 3000
        })
    } else {
        transferInvoiceKits.value = [...transferInvoiceKits.value, values]
        currentProduct.value = values
        locationQuantityKitResetForm()
    }
})

const deleteProductAction = data => {
    deleteProductVisible.value = true
    currentProduct.value = data
}

const deleteKitAction = data => {
    deleteKitVisible.value = true
    currentKit.value = data
}

const deleteProduct = () => {
    isDeleteLoading.value = true;

    transferInvoiceProducts.value = transferInvoiceProducts.value.filter(p => p.locationQuantity.product.id !== currentProduct.value.locationQuantity.product.id);
    currentProduct.value = {}
    isDeleteLoading.value = false;
    deleteProductVisible.value = false;
}

const deleteKit = () => {
    isDeleteLoading.value = true;

    transferInvoiceKits.value = transferInvoiceKits.value.filter(k => k.locationQuantityKit.kit.id !== currentKit.value.locationQuantityKit.kit.id);
    currentKit.value = {}
    isDeleteLoading.value = false;
    deleteKitVisible.value = false;
}

const editProduct = (data, index) => {
    isEditing.value = true
    editingProductIndex.value = index
    locationQuantity.value = data.locationQuantity
    qtyLocationQuantity.value = data.qtyLocationQuantity
}

const editKit = (data, index) => {
    isEditing.value = true
    editingKitIndex.value = index
    locationQuantityKit.value = data.locationQuantityKit
    qtyLocationQuantityKit.value = data.qtyLocationQuantityKit
}

const clearProductForm = () => {
    isEditing.value = false
    locationQuantityResetForm()
    locationQuantityKitResetForm()
}

const saveEditingProduct = async () => {
    const isValid = await locationQuantityValidate()

    if (!isValid.valid) {
        return
    }

    const editedData = {
        locationQuantity: locationQuantity.value,
        qtyLocationQuantity: qtyLocationQuantity.value,
    }

    transferInvoiceProducts.value = transferInvoiceProducts.value.map((transferInvoiceProduct, index) => (
        index === editingProductIndex.value ? editedData : transferInvoiceProduct
    ))

    toast.add({
        severity: 'success',
        summary: t('toast.edited', { name: t('product.nominativeCapitalize') }),
        life: 3000
    })

    locationQuantityResetForm()
    editingProductIndex.value = null
    isEditing.value = false
}

const saveEditingKit = async () => {
    const isValid = await locationQuantityKitValidate()

    if (!isValid.valid) {
        return
    }

    const editedData = {
        locationQuantityKit: locationQuantityKit.value,
        qtyLocationQuantityKit: qtyLocationQuantityKit.value,
    }

    transferInvoiceKits.value = transferInvoiceKits.value.map((transferInvoiceKit, index) => (
        index === editingKitIndex.value ? editedData : transferInvoiceKit
    ))

    toast.add({
        severity: 'success',
        summary: t('toast.edited', { name: t('kit.nominativeCapitalize') }),
        life: 3000
    })

    locationQuantityKitResetForm()
    editingKitIndex.value = null
    isEditing.value = false
}

async function fetchLocation(query) {
    const params = {
        ...query,
        isWarehouse: true
    }

    if (userStore.getAboutMeFromToken.role === 'ROLE_WAREHOUSE_MANAGER') {
        params.user = userStore.getAboutMeFromToken.id
    }

    console.log(params)

    await locationStore.fetchLocations(params)
}

onBeforeRouteLeave((to, from, next) => {
    if (isChanged.value) {
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
        :section-name="t('sections.warehouseTransferInvoices.add')"
        back-route-name="warehouse-transfer-invoices"
    >
        <template #buttons>
            <div class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
                <Button
                    :disabled="!isSetAllData"
                    icon="pi pi-save"
                    @click="onSubmitTransferInvoice"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="transferInvoiceIsSubmitting"
                />
            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    :disabled="!isSetAllData"
                    icon="pi pi-save"
                    @click="onSubmitTransferInvoice"
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
                    <div class="font-medium mb-4">{{ t('transferData') }}</div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm">{{ t('labels.fromLocation') }}<span class="text-red-500"> *</span></p>
                            <SearchSelect
                                v-model="fromLocation"
                                :fetchFn="fetchLocation"
                                :options="locationStore.getLocations.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.search.byLocation')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems"
                                :invalid="!!transferInvoiceErrors.fromLocation"
                                @update:model-value="() => toLocation = null"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.toLocation') }}<span class="text-red-500"> *</span></p>

                            <SearchSelect
                                v-model="toLocation"
                                :fetchFn="(query) => locationStore.fetchLocations({...query })"
                                :options="locationStore.getLocations.models.filter(l => l.id !== fromLocation)"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.search.byLocation')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems - 1"
                                :invalid="!!transferInvoiceErrors.toLocation"
                            />
                        </div>
                    </div>
                </template>
            </Card>
            <Card
                v-if="hasTransferInvoiceData"
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
                                            :option-label="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${getFormattedDate(opt?.expiryDate)} | ${opt?.qty} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :option-value="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${getFormattedDate(opt?.expiryDate)} | ${opt?.qty} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :return-value="opt => opt"
                                            :placeholder="t('placeholders.select.product')"
                                            :loading="locationQuantityStore.getIsLoadingLocationQuantity"
                                            :total-items="locationQuantityStore.getLocationQuantities.totalItems"
                                            :invalid="!!locationQuantityErrors.locationQuantity"
                                        >
                                            <template v-if="locationQuantityStore.getLocationQuantities.models.length" #header>
                                                <p class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{ t('labels.title') }} | {{ t('labels.code') }} | {{ t('labels.color') }} | {{ t('labels.expiryDate') }} | {{ t('labels.qty') }}</p>
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
                                            :min="0"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!locationQuantityErrors.qtyLocationQuantity"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearProductForm" />
                                    <Button v-if="!isEditing" @click="onSubmitLocationQuantity" :label="t('buttons.add')" class="px-5" :loading="locationQuantityIsSubmitting"/>
                                    <Button v-else @click="saveEditingProduct" :label="t('buttons.edit')" class="px-5"/>
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
                                            :min="0"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!locationQuantityKitErrors.qtyLocationQuantityKit"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearProductForm" />
                                    <Button v-if="!isEditing" @click="onSubmitLocationQuantityKit" :label="t('buttons.add')" class="px-5" :loading="locationQuantityIsSubmitting"/>
                                    <Button v-else @click="saveEditingKit" :label="t('buttons.edit')" class="px-5"/>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
            <Card
                v-if="transferInvoiceProducts.length > 0 || transferInvoiceKits.length > 0"
                pt:root="h-fit grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="grow flex flex-col p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>

                    <Tabs v-model:value="tabVal" scrollable :showNavigators="false">
                        <TabPanels pt:root="px-0 pb-0">
                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'products'"
                                value="products"
                            >
                                <NoData v-if="!transferInvoiceProducts?.length" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="transferInvoiceProducts"
                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <ColumnGroup type="header">
                                        <Row>
                                            <Column :header="t('labels.product')" :rowspan="1" :colspan="7"/>
                                            <Column :header="t('labels.expiryDate')" :rowspan="2" :colspan="1" />
                                            <Column :header="t('labels.qty')" :rowspan="2" :colspan="1" />
                                            <Column :header="t('labels.transferQty')" :rowspan="2" :colspan="1" />
                                            <Column :header="t('actions')" :rowspan="2" :colspan="1" />
                                        </Row>
                                        <Row>
                                            <Column field="kit" :header="t('labels.title')" />
                                            <Column field="code" :header="t('labels.code')" />
                                            <Column field="qr" :header="t('labels.color')" />
                                            <Column field="qr" :header="t('labels.qr')" />
                                            <Column field="qr" :header="t('labels.costPrice')" />
                                            <Column field="qr" :header="t('labels.wholesalePrice')" />
                                            <Column field="qr" :header="t('labels.retailPrice')" />
                                        </Row>
                                    </ColumnGroup>
                                    <Column field="product" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantity?.product?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantity?.product?.code || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="color" :header="t('labels.color')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantity?.color?.name || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qr" :header="t('labels.qr')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantity?.product?.qr || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="costPrice" :header="t('labels.costPrice')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.locationQuantity?.product?.costPrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="wholesalePrice" :header="t('labels.wholesalePrice')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.locationQuantity?.product?.wholesalePrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="retailPrice" :header="t('labels.retailPrice')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.locationQuantity?.product?.retailPrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantity?.expiryDate ? getFormattedDateWithTime(data.locationQuantity?.expiryDate) : '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantity.qty }} {{t(`labels.${data.locationQuantity?.product?.category?.unit?.name}`)}}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.transferQty')">
                                        <template #body="{ data }">
                                            <p>{{ data.qtyLocationQuantity }} {{t(`labels.${data.locationQuantity?.product?.category?.unit?.name}`)}}</p>
                                        </template>
                                    </Column>
                                    <Column field="actions" :header="t('actions')">
                                        <template #body="{ data, index }">
                                            <div class="flex justify-end w-full">
                                                <div class="flex items-center gap-2">
                                                    <Button
                                                        @click="editProduct(data, index)"
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
                                <NoData v-if="!transferInvoiceKits?.length" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="transferInvoiceKits"
                                    scrollable
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
                                            <Column :header="t('actions')" :rowspan="2" :colspan="1" />
                                        </Row>
                                        <Row>
                                            <Column field="kit" :header="t('labels.title')" />
                                            <Column field="code" :header="t('labels.code')" />
                                            <Column field="qr" :header="t('labels.qr')" />
                                            <Column field="qr" :header="t('labels.costPrice')" />
                                            <Column field="qr" :header="t('labels.wholesalePrice')" />
                                            <Column field="qr" :header="t('labels.retailPrice')" />
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
                                    <Column field="actions" :header="t('actions')">
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
                            :loading="isDeleteLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
            <!-- DELETE KIT DIALOG -->
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
                            @click="deleteKit"
                            :loading="isDeleteLoading"
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
