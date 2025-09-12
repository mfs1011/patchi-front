<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import InputText from "@/volt/InputText.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {useField, useForm} from "vee-validate";
import * as yup from "yup";
import {onBeforeRouteLeave, useRouter} from "vue-router";
import {useLocationStore} from "@/stores/location.js";
import {useToast} from "primevue/usetoast";
import InputNumber from "@/volt/InputNumber.vue";
import {useSupplierStore} from "@/stores/supplier.js";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {useProductStore} from "@/stores/product.js";
import {useColorStore} from "@/stores/color.js";
import DatePicker from "@/volt/DatePicker.vue";
import {formatCurrency, getFormattedDateWithTime} from "@/helpers/numberFormat.js";
import Column from "primevue/column";
import DataTable from "@/volt/DataTable.vue";
import Dialog from "@/volt/Dialog.vue";
import {useIncomeInvoiceStore} from "@/stores/incomeInvoice.js";
import {useInventoryStore} from "@/stores/inventory.js";

const { t } = useI18n()
const toast = useToast()

const locationStore = useLocationStore();
const inventoryStore = useInventoryStore();
const supplierStore = useSupplierStore();
const productStore = useProductStore();
const colorStore = useColorStore();
const incomeInvoiceStore = useIncomeInvoiceStore();
const router = useRouter();
const currentProduct = ref({})
const deleteVisible = ref(false)
const isDeleteLoading = ref(false)
const isEditing = ref(false)
const showLeaveDialog = ref(false)
const isConfirmLoading = ref(false)
const pendingNavigation = ref(false)
const editingProductIndex = ref(null)
const dateFrom = ref();

const home = computed(() => ({
    icon: 'pi pi-home',
    label: t('warehouse'),
    route: '/warehouse'
}));

const items = computed(() => [{ label: t('cards.incomeInvoices'), route: { name: 'warehouse-income-invoices'} }, { label: t('sections.incomeInvoices.add') }]);
const hasIncomeInvoiceData = computed(() => (
    !!supplier.value &&
    !!location.value &&
    !!createdAt.value
))
const isProductTypeNonFood = computed(() => {
    if (!product.value) {
        return false
    } else {
        return product.value.category.categoryType.name === 'Non-food'
    }
})

const isChanged = computed(() => (
    !!supplier.value ||
    !!location.value ||
    !!comment.value ||
    !!createdAt.value ||
    !!incomeInvoiceProducts.value.length ||
    !!product.value ||
    !!color.value ||
    !!expiryDate.value ||
    !!qty.value ||
    !!price.value ||
    !!transportationFee.value ||
    !!customsFee.value
))

// VeeValidate formani sozlash
const incomeInvoiceInfoSchema = computed(() => yup.object({
    supplier: yup.object().required(),
    location: yup.object().required(),
    comment: yup.string().max(255).notRequired(),
    createdAt: yup.date().required(),
    incomeInvoiceProducts: yup.array().required().min(1)
}))

const productSchema = computed(() => yup.object({
    product: yup.object().required(),
    color: yup.object().notRequired(),
    expiryDate: yup
        .date()
        .nullable()
        .when("product", {
            is: (product) =>
                product?.category?.categoryType?.name &&
                product.category.categoryType.name.toLowerCase() === 'food',
            then: (schema) => schema.required("Expiry date is required for food"),
            otherwise: (schema) => schema.notRequired(),
        }),
    qty: yup.number().required(),
    price: yup.number().required(),
    transportationFee: yup.number().required(),
    customsFee: yup.number().required()
}))

const {
    handleSubmit: incomeInvoiceHandleSubmit,
    errors: incomeInvoiceErrors,
    isSubmitting: incomeInvoiceIsSubmitting,
    resetForm: incomeInvoiceResetForm,
    ...incomeInvoiceFormCtx
} = useForm({
    validationSchema: incomeInvoiceInfoSchema,
    initialValues: {
        incomeInvoiceProducts: []
    }
})

const {
    handleSubmit: productHandleSubmit,
    errors: productErrors,
    isSubmitting: productIsSubmitting,
    resetForm: productResetForm,
    ...productFormCtx
} = useForm({
    validationSchema: productSchema,
    initialValues: {
        transportationFee: 0,
        customsFee: 0
    }
})

const { value: supplier } = useField('supplier', undefined, { form: incomeInvoiceFormCtx });
const { value: location } = useField('location', undefined, { form: incomeInvoiceFormCtx })
const { value: comment } = useField('comment', undefined, { form: incomeInvoiceFormCtx })
const { value: createdAt } = useField('createdAt', undefined, { form: incomeInvoiceFormCtx})
const { value: incomeInvoiceProducts } = useField('incomeInvoiceProducts', undefined, { validateOnMount: true, form: incomeInvoiceFormCtx })
const { value: product } = useField('product', undefined, { validateOnValueUpdate: false, form: productFormCtx });
const { value: color } = useField('color', undefined, { form: productFormCtx });
const { value: expiryDate } = useField('expiryDate', undefined, { form: productFormCtx });
const { value: qty } = useField('qty', undefined, { form: productFormCtx });
const { value: price } = useField('price', undefined, { form: productFormCtx });
const { value: transportationFee } = useField('transportationFee', undefined, { form: productFormCtx });
const { value: customsFee } = useField('customsFee', undefined, { form: productFormCtx });

const sumPriceOfIncomeInvoiceProducts = computed(() => {
    return incomeInvoiceProducts.value.length === 0
        ? 0
        : incomeInvoiceProducts.value.reduce((acc, incomeInvoiceProduct) => {
            return acc
                + (incomeInvoiceProduct?.price * incomeInvoiceProduct.qty)
                + (incomeInvoiceProduct?.transportationFee * incomeInvoiceProduct.qty)
                + (incomeInvoiceProduct?.customsFee * incomeInvoiceProduct.qty)
        }, 0)
})

const onSubmitIncomeInvoice = incomeInvoiceHandleSubmit(async values => {
    const payload = {
        supplier: values.supplier['@id'],
        location: values.location['@id'],
        comment: values.comment,
        createdAt: values.createdAt,

        incomeInvoiceProducts: values.incomeInvoiceProducts.map(incomeInvoiceProduct => {
            const obj = {
                product: incomeInvoiceProduct.product['@id'],
                expiryDate: incomeInvoiceProduct.expiryDate,
                qty: incomeInvoiceProduct.qty,
                price: incomeInvoiceProduct.price,
                transportationFee: incomeInvoiceProduct.transportationFee,
                customsFee: incomeInvoiceProduct.customsFee
            };

            if (incomeInvoiceProduct.color) {
                obj.color = incomeInvoiceProduct.color['@id']
            }

            return obj;
        })
    };

    try {
        await incomeInvoiceStore.pushIncomeInvoice(payload)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('incomeInvoice.nominativeCapitalize') }), life: 3000 })
        incomeInvoiceResetForm()
        productResetForm()
        router.back()

    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
    }
})

const onSubmitProduct = productHandleSubmit(async values => {
    const normalizeDate = date => date ? new Date(date).getTime() : null

    const isInclude = incomeInvoiceProducts.value.some(incomeInvoiceProduct => {
        return (
            incomeInvoiceProduct.color?.id === values.color?.id &&
            incomeInvoiceProduct.product.id === values.product.id &&
            normalizeDate(incomeInvoiceProduct.expiryDate) === normalizeDate(values.expiryDate)
        )
    })

    if (isInclude) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })
    } else {
        incomeInvoiceProducts.value = [...incomeInvoiceProducts.value, values]
        currentProduct.value = values
        productResetForm()
        product.value = undefined
        color.value = undefined
    }
})

const deleteAction = data => {
    deleteVisible.value = true
    currentProduct.value = data
}

const deleteProduct = () => {
    isDeleteLoading.value = true;

    incomeInvoiceProducts.value = incomeInvoiceProducts.value.filter(p => p.product.id !== currentProduct.value.product.id);
    currentProduct.value = {}
    isDeleteLoading.value = false;
    deleteVisible.value = false;
}

const editProduct = (data, index) => {
    isEditing.value = true
    editingProductIndex.value = index
    product.value = data.product
    color.value = data.color
    expiryDate.value = data.expiryDate
    qty.value = data.qty
    price.value = data.price
    transportationFee.value = data.transportationFee
    customsFee.value = data.customsFee
}

const clearProductForm = () => {
    isEditing.value = false
    productResetForm()
}

const saveEditing = () => {
    const editedData = {
        product: product.value,
        color: color.value,
        expiryDate: expiryDate.value,
        qty: qty.value,
        price: price.value,
        transportationFee: transportationFee.value,
        customsFee: customsFee.value
    }

    incomeInvoiceProducts.value = incomeInvoiceProducts.value.map((incomeInvoiceProduct, index) => (
        index === editingProductIndex.value ? editedData : incomeInvoiceProduct
    ))
    productResetForm()
    editingProductIndex.value = null
    isEditing.value = false
}

watch(location, async () => {
    if (location.value) {
        await inventoryStore.fetchLastDateToByLocation({ location: `/api/locations/${location.value.id}`})

        if (inventoryStore.getLastInventoryDateTo === null) {
            dateFrom.value = null
            createdAt.value = null
        } else {
            const date = new Date(inventoryStore.getLastInventoryDateTo);
            date.setDate(date.getDate());
            dateFrom.value = date;
            createdAt.value = date
        }
    } else {
        dateFrom.value = null
        createdAt.value = null
    }
})

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
        :section-name="t('sections.incomeInvoices.add')"
        back-route-name="warehouse-income-invoices"
    >
        <template #buttons>
            <div class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
                <Button
                    :disabled="!!incomeInvoiceErrors.incomeInvoiceProducts"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="incomeInvoiceIsSubmitting"
                />
            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    :disabled="!!incomeInvoiceErrors.incomeInvoiceProducts"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="incomeInvoiceIsSubmitting"
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
                            <p class="text-sm">{{ t('labels.Supplier') }}<span class="text-red-500"> *</span></p>
                            <SearchSelect
                                v-model="supplier"
                                :fetchFn="supplierStore.fetchSuppliers"
                                :options="supplierStore.getSuppliers.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.supplier')"
                                :loading="supplierStore.getIsLoadingSuppliers"
                                :total-items="supplierStore.getSuppliers.totalItems"
                                :invalid="!!incomeInvoiceErrors.supplier"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.location') }}<span class="text-red-500"> *</span></p>

                            <SearchSelect
                                v-model="location"
                                :fetchFn="(query) => locationStore.fetchLocations({...query, isWarehouse: true })"
                                :options="locationStore.getLocations.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.location')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems"
                                :invalid="!!incomeInvoiceErrors.location"
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.createdAt') }}<span class="text-red-500"> *</span></p>

                            <DatePicker
                                v-model.trim="createdAt"
                                dateFormat="dd.mm.yy"
                                showIcon
                                fluid
                                iconDisplay="input"
                                :placeholder="t('placeholders.date')"
                                show-button-bar
                                :minDate="dateFrom"
                                :invalid="!!incomeInvoiceErrors.createdAt"
                                showTime
                                hourFormat="24"
                            />

                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.comment') }}</p>
                            <InputText
                                v-model.trim="comment"
                                fluid
                                :placeholder="t('placeholders.comment')"
                                :class="{ 'p-invalid': incomeInvoiceErrors.comment }"
                                :invalid="!!incomeInvoiceErrors.comment"
                            />
                        </div>
                    </div>
                </template>
            </Card>
            <Card
                v-if="hasIncomeInvoiceData"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <div class="font-medium mb-4">{{ t('addProduct') }}</div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm">{{ t('labels.product') }}<span class="text-red-500"> *</span></p>
                            <SearchSelect
                                v-model="product"
                                :fetchFn="productStore.fetchProducts"
                                :options="productStore.getProducts.models"
                                :option-label="opt => `${opt?.name} | ${opt?.code}`"
                                :option-value="opt => `${opt?.name} | ${opt?.code}`"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.product')"
                                :loading="productStore.getIsLoadingProducts"
                                :total-items="productStore.getProducts.totalItems"
                                :invalid="!!productErrors.product"
                            >
                                <template #header>
                                    <div class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{t('labels.title')}} | {{t('labels.code') }}</div>
                                </template>
                            </SearchSelect>
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.color') }}</p>

                            <SearchSelect
                                v-model="color"
                                :fetchFn="colorStore.fetchColors"
                                :options="colorStore.getColors.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.color')"
                                :loading="colorStore.getIsLoadingColor"
                                :total-items="colorStore.getColors.totalItems"
                                :invalid="!!productErrors.color"
                            />
                        </div>

                        <div v-if="!isProductTypeNonFood">
                            <p class="text-sm">{{ t('labels.expiryDate') }}<span class="text-red-500"> *</span></p>

                            <DatePicker
                                v-model="expiryDate"
                                dateFormat="dd.mm.yy"
                                showIcon
                                fluid
                                iconDisplay="input"
                                :placeholder="t('placeholders.expiryDate')"
                                show-button-bar
                                :invalid="!!productErrors.expiryDate"
                                :minDate="new Date()"
                            />

                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="qty"
                                fluid
                                showButtons
                                :placeholder="t('placeholders.qty')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!productErrors.qty"
                            />
                        </div>

                        <div class="block">
                            <p class="text-sm">{{ t('labels.price') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="price"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.price')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!productErrors.price"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.transportationFee') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="transportationFee"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.transportationFee')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!productErrors.transportationFee"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.customsFee') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="customsFee"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.customsFee')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!productErrors.customsFee"
                            />
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                        <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearProductForm" />
                        <Button v-if="!isEditing" @click="onSubmitProduct" :label="t('buttons.add')" class="px-5" :loading="productIsSubmitting"/>
                        <Button v-else @click="saveEditing" :label="t('buttons.edit')" class="px-5"/>
                    </div>

                </template>
            </Card>
            <Card
                v-if="incomeInvoiceProducts.length > 0"
                pt:root="h-fit grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="grow flex flex-col p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        :value="incomeInvoiceProducts"
                        scrollable
                        scroll-height="700px"
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                    >
                        <Column field="product" :header="t('labels.product')">
                            <template #body="{ data }">
                                <p>{{ data.product?.name }}</p>
                            </template>
                        </Column>
                        <Column field="color" :header="t('labels.color')">
                            <template #body="{ data }">
                                <p>{{ data.color?.name || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="expiryDate" :header="t('labels.expiryDate')">
                            <template #body="{ data }">
                                <p>{{ data.expiryDate ? getFormattedDateWithTime(data.expiryDate) : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="qty" :header="t('labels.qty')">
                            <template #body="{ data }">
                                <p>{{ data.qty }} {{t(`labels.${data.product.category.unit.name}`)}}</p>
                            </template>
                        </Column>
                        <Column field="price" :header="t('labels.price')">
                            <template #body="{ data }">
                                <p>{{ formatCurrency(data.price) }}$</p>
                            </template>
                        </Column>
                        <Column field="transportationFee" :header="t('labels.transportationFee')">
                            <template #body="{ data }">
                                <p>{{ formatCurrency(data.transportationFee) }}$</p>
                            </template>
                        </Column>
                        <Column field="customsFee" :header="t('labels.customsFee')">
                            <template #body="{ data }">
                                <p>{{ formatCurrency(data.customsFee) }}$</p>
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
                                            @click="deleteAction(data)"
                                            icon="pi pi-trash"
                                            pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <template #footer>
                            <div class="mt-auto col-span-full flex justify-end font-medium">{{ t('labels.totals') }}: {{ formatCurrency(sumPriceOfIncomeInvoiceProducts) }} $</div>
                        </template>
                    </DataTable>
                </template>
            </Card>
            <!-- DELETE DIALOG -->
            <Dialog
                v-model:visible="deleteVisible"
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
                            @click="deleteVisible = false"
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
