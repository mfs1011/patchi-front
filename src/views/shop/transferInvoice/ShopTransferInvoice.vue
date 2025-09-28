<script setup>
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref} from "vue";
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
import {formatCurrency, getFormattedDate} from "@/helpers/numberFormat.js";
import {useToast} from "primevue/usetoast";
import {useTransferInvoiceValidation} from "@/views/shop/transferInvoice/useShopTransferInvoiceForm.js";
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
const router = useRouter();
const toast = useToast()
const transferInvoiceStore = useTransferInvoiceStore();
const userStore = useUserStore();
const locationQuantityStore = useLocationQuantityStore();
const locationQuantityKitStore = useLocationQuantityKitStore();
const locationStore = useLocationStore();
const { t } = useI18n();
const {
    transferInvoiceHandleSubmit,
    transferInvoiceErrors,
    transferInvoiceIsSubmitting,
    transferInvoiceResetForm,
    fromLocation,
    toLocation,
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
const deletedKitData = ref([]);
const createdKitData = ref([]);
const updatedKitData = ref([]);
const editMode = ref(false);
const isLoading = ref(true);
const deleteLocationQuantityVisible = ref(false);
const deleteLocationQuantityKitVisible = ref(false);
const isDeleteLocationQuantityLoading = ref(false);
const isDeleteLocationQuantityKitLoading = ref(false);
const showLeaveDialog = ref(false);
const isEditing = ref(false);
const pendingNavigation = ref(false);
const isEdited = ref(false);
const isConfirmLoading = ref(false);
const tabVal = ref('products')

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("shop"),
    route: "/shop",
}));

const items = computed(() => [{ label: t("cards.transferInvoices"), route: { name: 'shop-transfer-invoices'} }, { label: t("cards.transferInvoice") }]);
const isAdminOrCreatedBy = createdById => (
    userStore.getAboutMe.role.name === 'ROLE_ADMIN' || userStore.getAboutMe.id === createdById
)
const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])
const isChanged = computed(() => (
    createdData.value.length ||
    updatedData.value.length ||
    deletedData.value.length ||
    createdKitData.value.length ||
    updatedKitData.value.length ||
    deletedKitData.value.length ||
    transferInvoiceStore.getTransferInvoice?.fromLocation?.id !== fromLocation.value?.id ||
    transferInvoiceStore.getTransferInvoice?.toLocation?.id !== toLocation.value?.id
));
const isAcceptedTransferInvoice = computed(() => transferInvoiceStore.getTransferInvoice.status === 2)

// functions
const onSubmitLocationQuantity = locationQuantityHandleSubmit((values) => {
    addLocationQuantity(values)
})

const onEditLocationQuantity = locationQuantityHandleSubmit(async (values) => {
    const isValid = await locationQuantityValidate()

    if (!isValid.valid) {
        return
    }

    editLocationQuantity(values)
})

const onSubmitLocationQuantityKit = locationQuantityKitHandleSubmit((values) => {
    addLocationQuantityKit(values)
})

const onEditLocationQuantityKit = locationQuantityKitHandleSubmit(async (values) => {
    const isValid = await locationQuantityKitValidate()

    if (!isValid.valid) {
        return
    }

    editLocationQuantityKit(values)
})

const onSubmitTransferInvoice = transferInvoiceHandleSubmit(async (values) => {
    const payload = {};

    payload.transferInvoiceProducts = [...createdData.value, ...updatedData.value, ...deletedData.value]
    payload.transferInvoiceKits = [...createdKitData.value, ...updatedKitData.value, ...deletedKitData.value]

    if (!payload.transferInvoiceProducts.length) {
        delete payload.transferInvoiceProducts
    }

    if (!payload.transferInvoiceKits.length) {
        delete payload.transferInvoiceKits
    }

    if (values.fromLocation.id !== apiData.value.fromLocation.id) {
        payload.fromLocation = values.fromLocation['@id']
    }

    if (values.toLocation.id !== apiData.value.toLocation.id) {
        payload.toLocation = values.toLocation
    }

    try {
        await transferInvoiceStore.putTransferInvoice(payload, route.params.id)
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

const clearLocationQuantityForm = () => {
    isEditing.value = false
    locationQuantityResetForm()
}

const clearLocationQuantityKitForm = () => {
    isEditing.value = false
    locationQuantityKitResetForm()
}

function addLocationQuantity(newLocationQuantity) {
    const exists = editableData.value.transferInvoiceProducts.some(p => p.locationQuantity.id === newLocationQuantity.locationQuantity.id);

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const { qtyLocationQuantity, locationQuantity } = newLocationQuantity;

    editableData.value.transferInvoiceProducts.push({ locationQuantity, qty: qtyLocationQuantity});
    createdData.value.push({ locationQuantity: `/api/location_quantities/${locationQuantity.id}`, qty: qtyLocationQuantity})

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('product.nominativeCapitalize') }),
        life: 3000
    })

    locationQuantityResetForm();
}

function addLocationQuantityKit(newLocationQuantityKit) {
    const exists = editableData.value.transferInvoiceKits.some(p => p.locationQuantityKit.id === newLocationQuantityKit.locationQuantityKit.id);

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const { qtyLocationQuantityKit, locationQuantityKit } = newLocationQuantityKit;

    editableData.value.transferInvoiceKits.push({ locationQuantityKit, qty: qtyLocationQuantityKit });
    createdKitData.value.push({ locationQuantityKit: `/api/location_quantity_kits/${locationQuantityKit.id}`, qty: qtyLocationQuantityKit})

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('kit.nominativeCapitalize') }),
        life: 3000
    })

    locationQuantityKitResetForm();
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
}

function deleteLocationQuantityKit() {
    const index = editableData.value.transferInvoiceKits.findIndex(p => p.id === currentDeleteLocationQuantityKit.value.id);

    if (index === -1) return;

    const current = editableData.value.transferInvoiceKits[index];

    if (current.id) {
        // API’dan kelgan
        editableData.value.transferInvoiceKits.splice(index, 1);

        deletedKitData.value.push({
            transferInvoiceKit: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        editableData.value.transferInvoiceKits.splice(index, 1);
    }

    deleteLocationQuantityKitVisible.value = false
}

function editLocationQuantityAction(data, index) {
    isEditing.value = true;
    currentLocationQuantityIndex.value = index
    locationQuantity.value = data.locationQuantity
    qtyLocationQuantity.value = data.qty;
}

function editLocationQuantityKitAction(data, index) {
    isEditing.value = true;
    currentLocationQuantityKitIndex.value = index
    locationQuantityKit.value = data.locationQuantityKit
    qtyLocationQuantityKit.value = data.qty;
}

async function fetchLocation(query) {
    const params = {
        ...query
    }

    if (userStore.getAboutMeFromToken.role === 'ROLE_WAREHOUSE_MANAGER') {
        params.user = userStore.getAboutMeFromToken.id
    }

    await locationStore.fetchLocations(params)
}

function editLocationQuantity(updatedLocationQuantity) {
    // Duplicate check
    const exists = editableData.value.transferInvoiceProducts.some((p, i) =>
        i !== currentLocationQuantityIndex.value &&
        p.locationQuantity.id === updatedLocationQuantity.locationQuantity.id
    );

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const current = editableData.value.transferInvoiceProducts[currentLocationQuantityIndex.value];

    const payload = {};

    if (updatedLocationQuantity.locationQuantity.id !== current.locationQuantity.id) {
        payload.locationQuantity = updatedLocationQuantity.locationQuantity
    }

    if (updatedLocationQuantity.qtyLocationQuantity !== current.qty) {
        payload.qty = updatedLocationQuantity.qtyLocationQuantity
    }

    if (current.id) {
        payload.transferInvoiceProduct = current['@id']
        const indexFromUpdatedData = updatedData.value.findIndex(data => data.transferInvoiceProduct['@id'] === payload.transferInvoiceProduct['@id'])

        if (indexFromUpdatedData !== -1) {
            updatedData.value[indexFromUpdatedData] = {
                ...payload
            }
        } else {
            updatedData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.transferInvoiceProducts[currentLocationQuantityIndex.value] = {
            transferInvoiceProduct: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.transferInvoiceProducts[currentLocationQuantityIndex.value] = {
            ...current,
            ...payload
        };

        const index = createdData.value.findIndex(p => p.locationQuantity.id === current.locationQuantity.id)

        if (index !== -1) {
            // Agar mavjud bo‘lsa yangilash
            createdData.value[index] = { ...createdData.value[index], ...current, ...payload }
        } else {
            // Aks holda push qilish
            const { qtyLocationQuantity, locationQuantity } = updatedLocationQuantity;
            createdData.value.push({ locationQuantity, qty: qtyLocationQuantity})
        }
    }

    clearLocationQuantityForm()
}

function editLocationQuantityKit(updatedLocationQuantityKit) {
    // Duplicate check
    const exists = editableData.value.transferInvoiceKits.some((p, i) =>
        i !== currentLocationQuantityKitIndex.value &&
        p.locationQuantityKit.id === updatedLocationQuantityKit.locationQuantityKit.id
    );

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('kit.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const current = editableData.value.transferInvoiceKits[currentLocationQuantityKitIndex.value];

    const payload = {};

    if (updatedLocationQuantityKit.locationQuantityKit.id !== current.locationQuantityKit.id) {
        payload.locationQuantityKit = updatedLocationQuantityKit.locationQuantityKit
    }

    if (updatedLocationQuantityKit.qtyLocationQuantityKit !== current.qty) {
        payload.qty = updatedLocationQuantityKit.qtyLocationQuantityKit
    }

    if (current.id) {
        payload.transferInvoiceKit = current['@id']
        const indexFromUpdatedData = updatedData.value.findIndex(data => data.transferInvoiceKit['@id'] === payload.transferInvoiceKit['@id'])

        if (indexFromUpdatedData !== -1) {
            updatedKitData.value[indexFromUpdatedData] = {
                ...payload
            }
        } else {
            updatedKitData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.transferInvoiceKits[currentLocationQuantityKitIndex.value] = {
            transferInvoiceKit: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.transferInvoiceKits[currentLocationQuantityKitIndex.value] = {
            ...current,
            ...payload
        };

        const index = createdKitData.value.findIndex(p => p.locationQuantityKit.id === current.locationQuantityKit.id)

        if (index !== -1) {
            // Agar mavjud bo‘lsa yangilash
            createdKitData.value[index] = { ...createdData.value[index], ...current, ...payload }
        } else {
            // Aks holda push qilish
            const { qtyLocationQuantityKit, locationQuantityKit } = updatedLocationQuantityKit;
            createdKitData.value.push({ locationQuantityKit, qty: qtyLocationQuantityKit})
        }
    }

    clearLocationQuantityKitForm()
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
        :section-name="t('cards.transferInvoice')"
        back-route-name="shop-transfer-invoices"
    >
        <template #buttons>
            <div v-if="!isLoading && !isAcceptedTransferInvoice" class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
                <Button
                    v-if="!editMode && isAdminOrCreatedBy(transferInvoiceStore.getTransferInvoice.createdBy.id)"
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
                />
                <Button
                    v-if="editMode"
                    :disabled="!isChanged"
                    icon="pi pi-save"
                    @click="onSubmitTransferInvoice"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="transferInvoiceIsSubmitting"
                />

            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    v-if="!editMode"
                    :disabled="!!transferInvoiceErrors.transferInvoiceProducts"
                    icon="pi pi-pencil"
                    @click="editMode = true"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.edit')"
                    :loading="transferInvoiceIsSubmitting"
                />
                <Button
                    v-if="editMode"
                    :disabled="!!transferInvoiceErrors.transferInvoiceProducts"
                    icon="pi pi-save"
                    @click="onSubmitTransferInvoice"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="transferInvoiceIsSubmitting"
                />

                <SecondaryButton
                    v-if="editMode"
                    :disabled="!!transferInvoiceErrors.transferInvoiceProducts"
                    @click="cancelEditing"
                    class="w-full px-2 sm:px-5 whitespace-nowrap bg-surface-0! dark:bg-surface-800!"
                    :label="t('dialog.cancel')"
                    :loading="transferInvoiceIsSubmitting"
                />

                <Button
                    v-if="editMode"
                    :disabled="!isChanged"
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
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.search.byLocation')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems"
                                disabled
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.toLocation') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="toLocation"
                                :fetchFn="(query) => locationStore.fetchLocations({ ...query, toLocation: true })"
                                :options="locationStore.getLocations.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
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
                                            :fetchFn="(query) => locationQuantityStore.fetchLocationQuantities({...query, location: fromLocation.id, isZero: true})"
                                            :options="locationQuantityStore.getLocationQuantities.models"
                                            :option-label="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${opt.expiryDate ? getFormattedDate(opt?.expiryDate) : '-'} | ${opt?.qty} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :option-value="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${opt.expiryDate ? getFormattedDate(opt?.expiryDate) : '-'} | ${opt?.qty} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :return-value="opt => opt"
                                            :search-value="opt => opt.id"
                                            search-key="name"
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
                                            :fetchFn="(query) => locationQuantityKitStore.fetchLocationQuantityKits({...query, location: fromLocation.id, isZero: true})"
                                            :options="locationQuantityKitStore.getLocationQuantityKits.models"
                                            :option-label="opt => `${opt?.kit?.name} | ${opt?.kit?.code} | ${getFormattedDate(opt?.expiryDate)} | ${opt?.qty} ${t(`labels.pcs`)}`"
                                            :option-value="opt => `${opt?.kit?.name} | ${opt?.kit?.code} | ${getFormattedDate(opt?.expiryDate)} | ${opt?.qty} ${t(`labels.pcs`)}`"
                                            :return-value="opt => opt"
                                            :search-value="opt => opt.id"
                                            search-key="name"
                                            :placeholder="t('placeholders.select.kit')"
                                            :loading="locationQuantityKitStore.getIsLoadingLocationQuantityKit"
                                            :total-items="locationQuantityKitStore.getLocationQuantityKits.totalItems"
                                            :invalid="!!locationQuantityKitErrors.locationQuantityKit"
                                        >
                                            <template v-if="locationQuantityKitStore.getLocationQuantityKits.models.length" #header>
                                                <p class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{ t('labels.title') }} | {{ t('labels.code') }} | {{ t('labels.expiryDate') }} | {{ t('labels.qty') }}</p>
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
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearLocationQuantityKitForm" />
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
                                    <Column field="retailPrice" :header="t('labels.retailPrice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ (formatCurrency(data.locationQuantity?.product?.retailPrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.locationQuantity?.expiryDate ? getFormattedDate(data.locationQuantity?.expiryDate) : '-' }}</p>
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
                                                        @click="editLocationQuantityAction(data, index)"
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
                                    <Column field="retailPrice" :header="t('labels.retailPrice')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.locationQuantityKit?.kit?.retailPrice) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="expiryDate" :header="t('labels.expiryDate')">
                                        <template #body="{ data }">
                                            <p>{{ data.locationQuantityKit?.expiryDate ? getFormattedDate(data.locationQuantityKit?.expiryDate) : '-' }}</p>
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
                                                        @click="editLocationQuantityKitAction(data, index)"
                                                        icon="pi pi-pencil"
                                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                                        size="small"
                                                    />
                                                    <Button
                                                        @click="deleteLocationQuantityKitAction(data)"
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
                    {{ t('dialog.deleteConfirm', { name: t('kit.accusative') }) }}
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
