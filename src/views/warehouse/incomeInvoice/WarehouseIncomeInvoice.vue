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
import InputText from "@/volt/InputText.vue";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import DatePicker from "@/volt/DatePicker.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import Button from "@/volt/Button.vue";
import NoData from "@/components/UI/NoData.vue";
import {useIncomeInvoiceStore} from "@/stores/incomeInvoice.js";
import {useIncomeInvoiceValidation} from "@/views/warehouse/incomeInvoice/useWarehouseIncomeInvoiceForm.js";
import {useI18n} from "vue-i18n";
import {useSupplierStore} from "@/stores/supplier.js";
import {useLocationStore} from "@/stores/location.js";
import {useProductStore} from "@/stores/product.js";
import {useInventoryStore} from "@/stores/inventory.js";
import {formatCurrency, formatDateTimeLocal, getFormattedDate} from "@/helpers/numberFormat.js";
import {useColorStore} from "@/stores/color.js";
import {useToast} from "primevue/usetoast";
import Message from "@/volt/Message.vue";
import {useUserStore} from "@/stores/user.js";
import {exportIncomeInvoice} from "@/helpers/xlsx.js";

const route = useRoute();
const router = useRouter();
const toast = useToast()
const incomeInvoiceStore = useIncomeInvoiceStore();
const inventoryStore = useInventoryStore();
const supplierStore = useSupplierStore();
const locationStore = useLocationStore();
const productStore = useProductStore();
const colorStore = useColorStore();
const userStore = useUserStore()
const { t } = useI18n();
const {
    productHandleSubmit,
    productErrors,
    productIsSubmitting,
    productResetForm,
    product,
    color,
    expiryDate,
    qty,
    price,
    transportationFee,
    customsFee,
    incomeInvoiceHandleSubmit,
    incomeInvoiceErrors,
    incomeInvoiceIsSubmitting,
    incomeInvoiceResetForm,
    supplier,
    location,
    comment,
    createdAt,
} = useIncomeInvoiceValidation();

const apiData = ref(null);
const editableData = ref(null);
const currentProductIndex = ref(null);
const currentDeleteProduct = ref(null);
const deletedData = ref([]);
const createdData = ref([]);
const updatedData = ref([]);
const dateFrom = ref(null);
const editMode = ref(false);
const isLoading = ref(true);
const deleteVisible = ref(false);
const isDeleteLoading = ref(false);
const showLeaveDialog = ref(false);
const isEditing = ref(false);
const pendingNavigation = ref(false);
const isEdited = ref(false);
const isConfirmLoading = ref(false);
const hasInventory = computed(() => inventoryStore.getHasInventory)

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("warehouse"),
    route: "/warehouse",
}));

const exportCSV = () => {
    exportIncomeInvoice(editableData.value.incomeInvoiceProducts, supplier.value, location.value, createdAt.value, comment.value)
};

const items = computed(() => [{ label: t("cards.incomeInvoices"), route: { name: 'warehouse-income-invoices'} }, { label: t("cards.incomeInvoice") }]);
const isAdminOrCreatedBy = createdById => (
    userStore.getAboutMe.role.name === 'ROLE_ADMIN' || userStore.getAboutMe.id === createdById
)

const sumPriceOfIncomeInvoiceProducts = computed(() => {
    return editableData.value.incomeInvoiceProducts.length === 0
        ? 0
        : editableData.value.incomeInvoiceProducts.reduce((acc, incomeInvoiceProduct) => {
            return acc
                + incomeInvoiceProduct?.price
                + incomeInvoiceProduct?.transportationFee
                + incomeInvoiceProduct?.customsFee
        }, 0)
})

const isProductTypeNonFood = computed(() => {
    if (!product.value) {
        return false
    }

    return product.value.category.categoryType.name === 'Non-food'
})

const isChanged = computed(() => (
    createdData.value.length ||
    updatedData.value.length ||
    deletedData.value.length ||
    normalizeDate(incomeInvoiceStore.getIncomeInvoice.createdAt) !== normalizeDate(createdAt.value) ||
    incomeInvoiceStore.getIncomeInvoice?.comment !== comment.value ||
    incomeInvoiceStore.getIncomeInvoice?.supplier?.id !== supplier.value?.id
));
// functions
const onSubmitProduct = productHandleSubmit((values) => {
    addProduct(values)
})

const onEditProduct = productHandleSubmit((values) => {
    editProduct(values)
})

const onSubmitIncomeInvoice = incomeInvoiceHandleSubmit(async values => {
    const payload = {};

    payload.incomeInvoiceProducts = [...createdData.value, ...updatedData.value, ...deletedData.value]

    if (values.supplier.id !== apiData.value.supplier.id) {
        payload.supplier = values.supplier['@id']
    }

    if (values.comment !== apiData.value.comment) {
        payload.comment = values.comment
    }

    if (new Date(values.createdAt).toISOString() !== new Date(apiData.value.createdAt).toISOString()) {
        payload.createdAt = values.createdAt
        payload.createdAt = formatDateTimeLocal(payload.createdAt)
    }

    try {
        await incomeInvoiceStore.putIncomeInvoice(payload, route.params.id)
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
    }
})

const normalizeDate = date => date ? new Date(date).getTime() : null

const clearProductForm = () => {
    isEditing.value = false
    productResetForm()
}

function addProduct(newProduct) {
    const exists = editableData.value.incomeInvoiceProducts.some((p, i) => {
        const sameProduct = p.product.id === newProduct.product.id;

        // color faqat mavjud bo‘lsa taqqoslanadi
        const sameColor =
            (!p.color && !newProduct.color) ||
            (p.color?.id === newProduct.color?.id);

        // expiryDate faqat mavjud bo‘lsa taqqoslanadi
        const sameExpiry =
            (!p.expiryDate && !newProduct.expiryDate) ||
            (normalizeDate(p.expiryDate) === normalizeDate(newProduct.expiryDate));

        return sameProduct && sameColor && sameExpiry;
    });

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    if (newProduct.expiryDate) {
        newProduct.expiryDate = formatDateTimeLocal(newProduct.expiryDate)
    }

    editableData.value.incomeInvoiceProducts.push(newProduct);

    createdData.value.push(newProduct)

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('product.nominativeCapitalize') }),
        life: 3000
    })

    productResetForm();
}

function deleteAction(product) {
    deleteVisible.value = true
    currentDeleteProduct.value = product
}

function deleteProduct() {
    const index = editableData.value.incomeInvoiceProducts.findIndex(p =>
        p.product.id === currentDeleteProduct.value.product.id &&
        p.color?.id === currentDeleteProduct.value.color?.id &&
        normalizeDate(p.expiryDate) === normalizeDate(currentDeleteProduct.value.expiryDate)
    );

    if (index === -1) return;

    const current = editableData.value.incomeInvoiceProducts[index];

    if (current.id) {
        // API’dan kelgan
        editableData.value.incomeInvoiceProducts.splice(index, 1);

        deletedData.value.push({
            incomeInvoiceProduct: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        editableData.value.incomeInvoiceProducts.splice(index, 1);
    }
    deleteVisible.value = false
}

function edit(data, index) {
    isEditing.value = true;
    currentProductIndex.value = index
    product.value = data.product;
    color.value = data.color;
    expiryDate.value = data.expiryDate;
    qty.value = data.qty;
    price.value = data.price;
    customsFee.value = data.customsFee;
    transportationFee.value = data.transportationFee;
}

function editProduct(updatedProduct) {
    // Duplicate check
    const exists = editableData.value.incomeInvoiceProducts.some((p, i) => {
        if (i === currentProductIndex.value) return false;

        const sameProduct = p.product.id === updatedProduct.product.id;

        // color faqat mavjud bo‘lsa taqqoslanadi
        const sameColor =
            (!p.color && !updatedProduct.color) ||
            (p.color?.id === updatedProduct.color?.id);

        // expiryDate faqat mavjud bo‘lsa taqqoslanadi
        const sameExpiry =
            (!p.expiryDate && !updatedProduct.expiryDate) ||
            (normalizeDate(p.expiryDate) === normalizeDate(updatedProduct.expiryDate));

        return sameProduct && sameColor && sameExpiry;
    });


    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const current = editableData.value.incomeInvoiceProducts[currentProductIndex.value];

    const payload = {};

    if (updatedProduct.product.id !== current.product.id) {
        payload.product = updatedProduct.product
    }

    if (updatedProduct.color?.id !== current.color?.id) {
        payload.color = updatedProduct.color
    }

    if (updatedProduct.expiryDate !== null && (normalizeDate(updatedProduct.expiryDate) !== normalizeDate(current.expiryDate))) {
        payload.expiryDate = updatedProduct.expiryDate
        payload.expiryDate = formatDateTimeLocal(payload.expiryDate)
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
        payload.incomeInvoiceProduct = current['@id']
        const indexFromUpdatedData = updatedData.value.findIndex(
            data => data.incomeInvoiceProduct === payload.incomeInvoiceProduct
        )

        if (indexFromUpdatedData !== -1) {
            updatedData.value[indexFromUpdatedData] = {
                ...payload
            }
        } else {
            updatedData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.incomeInvoiceProducts[currentProductIndex.value] = {
            incomeInvoiceProduct: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.incomeInvoiceProducts[currentProductIndex.value] = {
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

    clearProductForm()
}

function cancelEditing() {
    editMode.value = false;
    incomeInvoiceResetForm()
}

watch(isProductTypeNonFood, (newVal) => {
    if (newVal) {
        expiryDate.value = null; // agar non_food bo‘lsa, qiymatni tozalaymiz
    }
});

watch(location, async () => {
    if (location.value) {
        await inventoryStore.fetchLastDateToByLocation({ location: `/api/locations/${location.value.id}`})

        if (inventoryStore.getLastInventoryDateTo === null) {
            dateFrom.value = null
            createdAt.value = null
        } else {
            const date = new Date(inventoryStore.getLastInventoryDateTo);
            date.setDate(date.getDate());
            date.setMinutes(date.getMinutes() + 1);
            dateFrom.value = date;
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
    await incomeInvoiceStore.fetchIncomeInvoice(route.params.id);
    await inventoryStore.fetchHasInventory({
        location: `/api/locations/${incomeInvoiceStore.getIncomeInvoice.location.id}`,
        createdAt: incomeInvoiceStore.getIncomeInvoice.createdAt
    })

    apiData.value = incomeInvoiceStore.getIncomeInvoice;
    editableData.value = JSON.parse(JSON.stringify(incomeInvoiceStore.getIncomeInvoice));

    setTimeout(() => {
        incomeInvoiceResetForm({
            values: {
                supplier: incomeInvoiceStore.getIncomeInvoice.supplier,
                location: incomeInvoiceStore.getIncomeInvoice.location,
                createdAt: new Date(incomeInvoiceStore.getIncomeInvoice.createdAt),
                comment: incomeInvoiceStore.getIncomeInvoice.comment,
                incomeInvoiceProducts: incomeInvoiceStore.getIncomeInvoice.incomeInvoiceProducts
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
        :section-name="t('cards.incomeInvoice')"
        back-route-name="warehouse-income-invoices"
        :withoutButtons="(isLoading || hasInventory)"
    >
        <template #buttons>
            <div class="flex sm:justify-end grow gap-2 sm:gap-4 sm:mt-4">
                <Button
                    v-if="!editMode && isAdminOrCreatedBy(incomeInvoiceStore.getIncomeInvoice.createdBy.id)"
                    :disabled="!!incomeInvoiceErrors.incomeInvoiceProducts"
                    icon="pi pi-pencil"
                    @click="editMode = true"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.edit')"
                    :loading="incomeInvoiceIsSubmitting"
                />

                <SecondaryButton
                    v-if="editMode"
                    :disabled="!!incomeInvoiceErrors.incomeInvoiceProducts"
                    @click="cancelEditing"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap bg-surface-0! dark:bg-surface-800!"
                    :label="t('dialog.cancel')"
                />

                <Button
                    v-if="editMode"
                    :disabled="!isChanged"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap"
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
                <template #header>
                    <div class="pt-5 px-5">
                        <Button
                            @click="exportCSV"
                            icon="pi pi-file-excel"
                            pt:root="bg-teal-500 dark:bg-teal-500 enabled:hover:bg-teal-400 dark:enabled:hover:bg-teal-400 border-teal-500 dark:border-teal-500 enabled:hover:border-teal-400 dark:enabled:hover:border-teal-400 focus-visible:outline-teal-500 dark:focus-visible:outline-teal-500"
                            size="small"
                            label="Export"
                        />
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm">{{ t('labels.Supplier') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="supplier"
                                :fetchFn="supplierStore.fetchSuppliers"
                                :options="supplierStore.getSuppliers.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.supplier')"
                                :loading="supplierStore.getIsLoadingSuppliers"
                                :total-items="supplierStore.getSuppliers.totalItems"
                                :invalid="!!incomeInvoiceErrors.supplier"
                                :disabled="!editMode"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.location') }}</p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="location"
                                :fetchFn="(query) => locationStore.fetchLocations({...query})"
                                :options="locationStore.getLocations.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.location')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems"
                                :invalid="!!incomeInvoiceErrors.location"
                                disabled
                                :show-clear="false"
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
                                :invalid="!!incomeInvoiceErrors.createdAt"
                                showTime
                                hourFormat="24"
                                :disabled="!editMode"
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.comment') }}</p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <InputText
                                v-if="!isLoading"
                                v-model.trim="comment"
                                fluid
                                :placeholder="t('placeholders.comment')"
                                :class="{ 'p-invalid': incomeInvoiceErrors.comment }"
                                :invalid="!!incomeInvoiceErrors.comment"
                                :disabled="!editMode"
                            />

                            <Message class="h-fit mt-2" size="small" severity="error" variant="simple">{{ incomeInvoiceErrors.comment }}</Message>
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
                                :search-value="opt => opt.name"
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
                                :search-value="opt => opt.name"
                                :placeholder="t('placeholders.select.color')"
                                :loading="colorStore.getIsLoadingColor"
                                :total-items="colorStore.getColors.totalItems"
                                :invalid="!!productErrors.color"
                            />
                        </div>

                        <div >
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
                            <p class="text-sm">{{ t('labels.totalPrice') }}<span class="text-red-500"> *</span></p>
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
                        <Button v-else @click="onEditProduct" :label="t('buttons.edit')" class="px-5"/>
                    </div>

                </template>
            </Card>
            <Card
                pt:root="h-fit grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="grow flex flex-col p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <NoData v-if="!editableData?.incomeInvoiceProducts.length && !isLoading" class="text-surface-400 mx-auto my-auto">
                        <p class="text-xl font-normal">{{ t("noResults") }}</p>
                    </NoData>

                    <DataTable
                        v-else
                        :value="isLoading ? Array(10).fill({}) : editableData.incomeInvoiceProducts"
                        scrollable
                        scroll-height="700px"
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                    >
                        <Column field="id" header="№">
                            <template #body="{ index }">
                                <p>{{ index + 1 }}</p>
                            </template>
                        </Column>
                        <Column field="product" :header="t('labels.product')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.product?.name }}</p>
                            </template>
                        </Column>
                        <Column field="color" :header="t('labels.color')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.color?.name || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="expiryDate" :header="t('labels.expiryDate')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.expiryDate ? getFormattedDate(data.expiryDate) : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="qty" :header="t('labels.qty')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.qty }} {{t(`labels.${data.product?.category.unit.name}`)}}</p>
                            </template>
                        </Column>
                        <Column field="price" :header="t('labels.totalPrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.price) }}$</p>
                            </template>
                        </Column>
                        <Column field="transportationFee" :header="t('labels.transportationFee')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.transportationFee) }}$</p>
                            </template>
                        </Column>
                        <Column field="customsFee" :header="t('labels.customsFee')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.customsFee) }}$</p>
                            </template>
                        </Column>
                        <Column v-if="editMode" field="actions" :header="t('actions')">
                            <template #body="{ data, index }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <div v-else class="flex justify-end w-full">
                                    <div class="flex items-center gap-2">
                                        <Button
                                            @click="edit(data, index)"
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
                            <Skeleton height="2rem" width="10rem" class="ml-auto" v-if="isLoading"/>
                            <div v-else class="mt-auto col-span-full flex justify-end font-medium">{{ t('labels.totals') }}: {{ formatCurrency(sumPriceOfIncomeInvoiceProducts) }} $</div>
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
                            @click="deleteProduct(currentProductIndex)"
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
