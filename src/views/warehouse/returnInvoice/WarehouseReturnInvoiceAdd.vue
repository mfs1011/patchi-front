<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {onBeforeRouteLeave, useRouter} from "vue-router";
import {useToast} from "primevue/usetoast";
import InputNumber from "@/volt/InputNumber.vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {formatCurrency} from "@/helpers/numberFormat.js";
import Column from "primevue/column";
import DataTable from "@/volt/DataTable.vue";
import Dialog from "@/volt/Dialog.vue";
import TabPanels from "@/volt/TabPanels.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import NoData from "@/components/UI/NoData.vue";
import Tabs from "@/volt/Tabs.vue";
import Tab from "@/volt/Tab.vue";
import {useReturnInvoiceStore} from "@/stores/returnInvoice.js";
import {useOrderInvoiceProductStore} from "@/stores/orderInvoiceProduct.js";
import {useReturnInvoiceValidation} from "@/views/warehouse/returnInvoice/useWarehouseReturnInvoiceForm.js";
import {useOrderInvoiceKitStore} from "@/stores/orderInvoiceKit.js";

const { t } = useI18n()
const toast = useToast()
const {
    returnInvoiceHandleSubmit,
    returnInvoiceIsSubmitting,
    returnInvoiceResetForm,
    returnInvoiceProducts,
    returnInvoiceKits,
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

const orderInvoiceProductStore = useOrderInvoiceProductStore();
const orderInvoiceKitStore = useOrderInvoiceKitStore();
const returnInvoiceStore = useReturnInvoiceStore();
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

const items = computed(() => [{ label: t('cards.returnInvoices'), route: { name: 'warehouse-return-invoices'} }, { label: t('sections.returnInvoices.add') }]);

const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
])

const isChanged = computed(() => (
    !!returnInvoiceProducts.value.length ||
    !!returnInvoiceKits.value.length
))

const isSetAllData = computed(() => (
    !!returnInvoiceProducts.value.length ||
    !!returnInvoiceKits.value.length
))

const getReturnQtyProduct = (orderInvoiceProduct) => {
    if (!orderInvoiceProduct?.orderInvoiceProductQuantities) return 0;

    return orderInvoiceProduct.orderInvoiceProductQuantities.reduce(
        (sum, q) => sum + (q.returnQty || 0),
        0
    );
};

const getReturnQtyKit = (orderInvoiceKit) => {
    if (!orderInvoiceKit?.orderInvoiceKitQuantities) return 0;

    return orderInvoiceKit.orderInvoiceKitQuantities.reduce(
        (sum, q) => sum + (q.returnQty || 0),
        0
    );
};

const onSubmitReturnInvoice = returnInvoiceHandleSubmit(async values => {
    const payload = {
        orderInvoice: 'api/order_invoices/1',
        returnInvoiceProducts: values.returnInvoiceProducts.map(returnInvoiceProduct => ({
            orderInvoiceProduct: `api/order_invoice_products/${returnInvoiceProduct.orderInvoiceProduct.id}`,
            qty: returnInvoiceProduct.qtyProduct,
        })),
        returnInvoiceKits: values.returnInvoiceKits.map(returnInvoiceKit => ({
            orderInvoiceKit: `api/order_invoice_kits/${returnInvoiceKit.orderInvoiceKit.id}`,
            qty: returnInvoiceKit.qtyKit,
        }))
    };

    try {
        await returnInvoiceStore.pushReturnInvoice(payload)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('returnInvoice.nominativeCapitalize') }), life: 3000 })
        returnInvoiceResetForm()
        productResetForm()
        kitResetForm()
        router.back()

    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
    }
})

const onSubmitProduct = productHandleSubmit(async values => {
    const isInclude = returnInvoiceProducts.value.some(returnInvoiceProduct => returnInvoiceProduct.orderInvoiceProduct?.id === values.orderInvoiceProduct?.id)

    if (isInclude) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })
    } else {
        returnInvoiceProducts.value = [...returnInvoiceProducts.value, values]
        currentProduct.value = values
        productResetForm()
    }
})

const onSubmitKit = kitHandleSubmit(async values => {
    const isInclude = returnInvoiceKits.value.some(returnInvoiceKit => returnInvoiceKit.orderInvoiceKit?.id === values.orderInvoiceKit?.id)

    if (isInclude) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('kit.nominativeCapitalize') }),
            life: 3000
        })
    } else {
        returnInvoiceKits.value = [...returnInvoiceKits.value, values]
        currentKit.value = values
        kitResetForm()
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

    returnInvoiceProducts.value = returnInvoiceProducts.value.filter(p => p.orderInvoiceProduct.product.id !== currentProduct.value.orderInvoiceProduct.product.id);
    currentProduct.value = {}
    isDeleteLoading.value = false;
    deleteProductVisible.value = false;
}

const deleteKit = () => {
    isDeleteLoading.value = true;

    returnInvoiceKits.value = returnInvoiceKits.value.filter(k => k.orderInvoiceKit.kit.id !== currentKit.value.orderInvoiceKit.kit.id);
    currentKit.value = {}
    isDeleteLoading.value = false;
    deleteKitVisible.value = false;
}

const editProduct = (data, index) => {
    isEditing.value = true
    editingProductIndex.value = index
    orderInvoiceProduct.value = data.orderInvoiceProduct
    qtyProduct.value = data.qtyProduct
}

const editKit = (data, index) => {
    isEditing.value = true
    editingKitIndex.value = index
    orderInvoiceKit.value = data.orderInvoiceKit
    qtyKit.value = data.qtyKit
}

const clearProductForm = () => {
    isEditing.value = false
    productResetForm()
    kitResetForm()
}

const saveEditingProduct = async () => {
    const isValid = await productValidate()

    if (!isValid.valid) {
        return
    }

    const editedData = {
        orderInvoiceProduct: orderInvoiceProduct.value,
        qtyProduct: qtyProduct.value,
    }

    returnInvoiceProducts.value = returnInvoiceProducts.value.map((returnInvoiceProduct, index) => (
        index === editingProductIndex.value ? editedData : returnInvoiceProduct
    ))

    toast.add({
        severity: 'success',
        summary: t('toast.edited', { name: t('product.nominativeCapitalize') }),
        life: 3000
    })

    productResetForm()
    editingProductIndex.value = null
    isEditing.value = false
}

const saveEditingKit = async () => {
    const isValid = await kitValidate()

    if (!isValid.valid) {
        return
    }

    const editedData = {
        orderInvoiceKit: orderInvoiceKit.value,
        qtyKit: qtyKit.value,
    }

    returnInvoiceKits.value = returnInvoiceKits.value.map((returnInvoiceKit, index) => (
        index === editingKitIndex.value ? editedData : returnInvoiceKit
    ))

    toast.add({
        severity: 'success',
        summary: t('toast.edited', { name: t('kit.nominativeCapitalize') }),
        life: 3000
    })

    kitResetForm()
    editingKitIndex.value = null
    isEditing.value = false
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
        :section-name="t('sections.returnInvoices.add')"
        back-route-name="warehouse-return-invoices"
    >
        <template #buttons>
            <div class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
                <Button
                    :disabled="!isSetAllData"
                    icon="pi pi-save"
                    @click="onSubmitReturnInvoice"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="returnInvoiceIsSubmitting"
                />
            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    :disabled="!isSetAllData"
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
                                            :fetchFn="(query) => orderInvoiceProductStore.fetchOrderInvoiceProducts({...query, orderInvoice: 1})"
                                            :options="orderInvoiceProductStore.getOrderInvoiceProducts.models"
                                            :option-label="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${opt?.qty - getReturnQtyProduct(opt)} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
                                            :option-value="opt => `${opt?.product?.name} | ${opt?.product?.code} | ${opt?.color?.name ?? '-'} | ${opt?.qty - getReturnQtyProduct(opt)} ${t(`labels.${opt?.product?.category?.unit?.name}`)}`"
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
                                            v-model="orderInvoiceKit"
                                            :fetchFn="(query) => orderInvoiceKitStore.fetchOrderInvoiceKits({...query, orderInvoice: 1})"
                                            :options="orderInvoiceKitStore.getOrderInvoiceKits.models"
                                            :option-label="opt => `${opt?.kit?.name} | ${opt?.kit?.code} | ${opt?.qty - getReturnQtyKit(opt)} ${t(`labels.pcs`)}`"
                                            :option-value="opt => `${opt?.kit?.name} | ${opt?.kit?.code} | ${opt?.qty - getReturnQtyKit(opt)} ${t(`labels.pcs`)}`"
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
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearProductForm" />
                                    <Button v-if="!isEditing" @click="onSubmitKit" :label="t('buttons.add')" class="px-5" :loading="kitIsSubmitting"/>
                                    <Button v-else @click="saveEditingKit" :label="t('buttons.edit')" class="px-5"/>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
            <Card
                v-if="returnInvoiceProducts.length > 0 || returnInvoiceKits.length > 0"
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
                                <NoData v-if="!returnInvoiceProducts?.length" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="returnInvoiceProducts"
                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <Column field="product" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <p>{{ data.orderInvoiceProduct?.product?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <p>{{ data.orderInvoiceProduct?.product?.code || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qr" :header="t('labels.qr')">
                                        <template #body="{ data }">
                                            <p>{{ data.orderInvoiceProduct?.product?.qr || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="color" :header="t('labels.color')">
                                        <template #body="{ data }">
                                            <p>{{ data.orderInvoiceProduct?.color?.name || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="price" :header="t('labels.price')">
                                        <template #body="{ data }">
                                            <p>{{ (formatCurrency(data.orderInvoiceProduct?.price) + '$') || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <p>{{ data.qtyProduct }} {{t(`labels.${data.orderInvoiceProduct?.product?.category?.unit?.name}`)}}</p>
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
                                <NoData v-if="!returnInvoiceKits?.length" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="returnInvoiceKits"
                                    scrollable
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
                                            <p>{{ data.qtyKit }} {{t(`labels.pcs`)}}</p>
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
