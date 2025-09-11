<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Card from "@/volt/Card.vue";
import InputText from "@/volt/InputText.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {useField, useForm} from "vee-validate";
import * as yup from "yup";
import {onBeforeRouteLeave, useRouter} from "vue-router";
import {useToast} from "primevue/usetoast";
import InputNumber from "@/volt/InputNumber.vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {useProductStore} from "@/stores/product.js";
import {useColorStore} from "@/stores/color.js";
import {formatCurrency} from "@/helpers/numberFormat.js";
import Column from "primevue/column";
import DataTable from "@/volt/DataTable.vue";
import Dialog from "@/volt/Dialog.vue";
import Message from "@/volt/Message.vue";
import {useAssemblyStore} from "@/stores/assembly.js";
import {useSellerStore} from "@/stores/seller.js";
import InputFile from "@/components/UI/InputFile.vue";
import DatePicker from "@/volt/DatePicker.vue";

const { t } = useI18n()
const toast = useToast()

const productStore = useProductStore();
const assemblyStore = useAssemblyStore();
const sellerStore = useSellerStore();
const router = useRouter();
const currentProduct = ref({})
const deleteVisible = ref(false)
const isDeleteLoading = ref(false)
const isEditing = ref(false)
const showLeaveDialog = ref(false)
const isConfirmLoading = ref(false)
const pendingNavigation = ref(false)
const editingProductIndex = ref(null)
const photoName = ref('');

const home = computed(() => ({
    icon: 'pi pi-home',
    label: t('shop'),
    route: '/shop'
}));

const items = computed(() => [{ label: t('cards.kits'), route: { name: 'kits'} }, { label: t('sections.kits.add') }]);
const hasKitData = computed(() => (
    !!seller.value
))

const isChanged = computed(() => (
    !!seller.value ||
    !!location.value ||
    !!comment.value ||
    !!createdAt.value ||
    !!kitProducts.value.length ||
    !!product.value ||
    !!color.value ||
    !!expiryDate.value ||
    !!qty.value ||
    !!price.value ||
    !!transportationFee.value ||
    !!customsFee.value
))

// VeeValidate formani sozlash

const FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const kitInfoSchema = computed(() => yup.object({
    qr: yup.string().notRequired().max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    code: yup.string().required(t('errorMessages.codeRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    name: yup.string().required(t('errorMessages.titleRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    assembly: yup.number().notRequired(),
    wholesalePrice: yup.number().notRequired(),
    retailPrice: yup.number().notRequired(),
    kitQty: yup.number().notRequired(),
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
    photo: yup
        .mixed()
        .test(
            'fileSize',
            t('errorMessages.maxSizePhoto', { size: FILE_SIZE / 1024 / 1024 }),
            (value) => !value ? true : value && value.size <= FILE_SIZE
        )
        .test(
            'fileType',
            t('errorMessages.availablePhotoFormat', { formats: SUPPORTED_FORMATS.join(', ')}),
            (value) => !value ? true : value && SUPPORTED_FORMATS.includes(value.type)
        )
        .nullable(),

    kitProducts: yup.array().required().min(1)
}))

const productSchema = computed(() => yup.object({
    product: yup.object().required(),
    qty: yup.number().required()
}))

const {
    handleSubmit: kitHandleSubmit,
    errors: kitErrors,
    isSubmitting: kitIsSubmitting,
    resetForm: kitResetForm,
    ...kitFormCtx
} = useForm({
    validationSchema: kitInfoSchema,
    initialValues: {
        kitProducts: []
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

const { value: qr } = useField('qr');
const { value: code } = useField('code');
const { value: name } = useField('name');
const { value: assembly } = useField('assembly'); // null
const { value: wholesalePrice } = useField('wholesalePrice');
const { value: retailPrice } = useField('retailPrice');
const { value: kitQty } = useField('kitQty');
const { value: expiryDate } = useField('expiryDate', undefined, { form: productFormCtx });
const { value: photo } = useField('photo' ); // null

const { value: seller } = useField('seller', undefined, { form: kitFormCtx });
const { value: kitProducts } = useField('kitProducts', undefined, { validateOnMount: true, form: kitFormCtx })
const { value: product } = useField('product', undefined, { validateOnValueUpdate: false, form: productFormCtx });
const { value: qty } = useField('qty', undefined, { form: productFormCtx });

const sumPriceOfKitProducts = computed(() => {
    return kitProducts.value.length === 0
        ? 0
        : kitProducts.value.reduce((acc, kitProduct) => {
            return acc
                + (kitProduct?.price * kitProduct.qty)
                + (kitProduct?.transportationFee * kitProduct.qty)
                + (kitProduct?.customsFee * kitProduct.qty)
        }, 0)
})

const onSubmitIncomeInvoice = kitHandleSubmit(async values => {
    const payload = {
        seller: values.seller['@id'],

        kitProducts: values.kitProducts.map(kitProduct => ({
            product: kitProduct.product['@id'],
            qty: kitProduct.qty
        }))
    };

    try {
        // await incomeInvoiceStore.pushIncomeInvoice(payload)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('incomeInvoice.nominativeCapitalize') }), life: 3000 })
        kitResetForm()
        productResetForm()
        router.back()

    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
    }
})

const onSubmitProduct = productHandleSubmit(async values => {
    const normalizeDate = date => date ? new Date(date).getTime() : null

    const isInclude = kitProducts.value.some(incomeInvoiceProduct => {
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
        kitProducts.value = [...kitProducts.value, values]
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

    kitProducts.value = kitProducts.value.filter(p => p.product.id !== currentProduct.value.product.id);
    currentProduct.value = {}
    isDeleteLoading.value = false;
    deleteVisible.value = false;
}

const editProduct = (data, index) => {
    isEditing.value = true
    editingProductIndex.value = index
    product.value = data.product
    qty.value = data.qty
}

const clearProductForm = () => {
    isEditing.value = false
    productResetForm()
}

const saveEditing = () => {
    const editedData = {
        product: product.value,
        qty: qty.value
    }

    kitProducts.value = kitProducts.value.map((kitProduct, index) => (
        index === editingProductIndex.value ? editedData : kitProduct
    ))
    productResetForm()
    editingProductIndex.value = null
    isEditing.value = false
}

const setPhoto = event => {
    photo.value = event.target.files[0]
    photoName.value = event.target.files[0].name
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

onMounted(async () => {
    if(!assemblyStore.getAssemblies.models.length) {
        await assemblyStore.fetchAssemblies()
    }
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
        :section-name="t('sections.kits.add')"
        back-route-name="kits"
    >
        <template #buttons>
            <div class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
                <Button
                    :disabled="!!kitErrors.kitProducts"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="kitIsSubmitting"
                />
            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    :disabled="!!kitErrors.kitProducts"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="w-full px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="kitIsSubmitting"
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
                            <p class="text-sm">{{ t('labels.Seller') }}<span class="text-red-500"> *</span></p>
                            <SearchSelect
                                v-model="seller"
                                :fetchFn="sellerStore.fetchSellers"
                                :options="sellerStore.getSellers.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.seller')"
                                :loading="sellerStore.getIsLoadingSellers"
                                :total-items="sellerStore.getSellers.totalItems"
                                :invalid="!!kitErrors.seller"
                            />
                        </div>

                        <label class="block">
                            <span>{{ t('labels.qr') }}</span>
                            <InputText
                                v-model.trim="qr"
                                fluid
                                :placeholder="t('placeholders.qr')"
                                size="large"
                                :class="{ 'p-invalid': kitErrors.qr }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ kitErrors.qr }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.code') }}</span><span class="text-red-500"> *</span>
                            <InputText
                                v-model.trim="code"
                                fluid
                                :placeholder="t('placeholders.code')"
                                size="large"
                                :class="{ 'p-invalid': kitErrors.code }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ kitErrors.code }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.title') }}</span><span class="text-red-500"> *</span>
                            <InputText
                                v-model.trim="name"
                                fluid
                                :placeholder="t('placeholders.title')"
                                size="large"
                                :class="{ 'p-invalid': kitErrors.name }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ kitErrors.name }}</Message>
                        </label>

                        <div>
                            <p class="text-sm">{{ t('labels.collection') }}</p>
                            <SearchSelect
                                v-model="assembly"
                                :fetchFn="assemblyStore.fetchAssemblies"
                                :options="assemblyStore.getAssemblies.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.seller')"
                                :loading="assemblyStore.getIsLoadingAssembly"
                                :total-items="assemblyStore.getAssemblies.totalItems"
                                :invalid="!!kitErrors.assembly"
                            />
                        </div>

                        <label class="block">
                            <span>{{ t('labels.wholesalePrice') }}</span>
                            <InputNumber
                                v-model="wholesalePrice"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.wholesalePrice')"
                                size="large"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ kitErrors.wholesalePrice }}</Message>
                        </label>
                        <label class="block">
                            <span>{{ t('labels.retailPrice') }}</span>
                            <InputNumber
                                v-model="retailPrice"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.retailPrice')"
                                size="large"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ kitErrors.retailPrice }}</Message>
                        </label>

                        <div>
                            <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="kitQty"
                                fluid
                                showButtons
                                :placeholder="t('placeholders.qty')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!kitErrors.kitQty"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.expiryDate') }}<span class="text-red-500"> *</span></p>

                            <DatePicker
                                v-model="expiryDate"
                                dateFormat="dd.mm.yy"
                                showIcon
                                fluid
                                iconDisplay="input"
                                :placeholder="t('placeholders.expiryDate')"
                                show-button-bar
                                :invalid="!!kitErrors.expiryDate"
                                :minDate="new Date()"
                            />

                        </div>

                        <label class="block">
                            <span>{{ t('labels.photo') }}</span>
                            <InputFile ref="fileInput" @change="setPhoto" :fileName="photoName"/>
                            <Message class="min:h-5" size="small" severity="error" variant="simple">{{ kitErrors.photo }}</Message>
                        </label>
                    </div>
                </template>
            </Card>
            <Card
                v-if="hasKitData"
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
                                :fetchFn="productStore.fetchAvailableProducts"
                                :options="productStore.getAvailableProducts.models"
                                :option-label="opt => `${opt?.name} | ${opt?.code}`"
                                :option-value="opt => `${opt?.name} | ${opt?.code}`"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.product')"
                                :loading="productStore.getIsLoadingProducts"
                                :total-items="productStore.getAvailableProducts.totalItems"
                                :invalid="!!productErrors.product"
                            >
                                <template #header>
                                    <div class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{t('labels.title')}} | {{t('labels.code') }}</div>
                                </template>
                            </SearchSelect>
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
                    </div>

                    <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                        <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearProductForm" />
                        <Button v-if="!isEditing" @click="onSubmitProduct" :label="t('buttons.add')" class="px-5" :loading="productIsSubmitting"/>
                        <Button v-else @click="saveEditing" :label="t('buttons.edit')" class="px-5"/>
                    </div>

                </template>
            </Card>
            <Card
                v-if="kitProducts.length > 0"
                pt:root="h-fit grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="grow flex flex-col p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        :value="kitProducts"
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
                        <Column field="qty" :header="t('labels.qty')">
                            <template #body="{ data }">
                                <p>{{ data.qty }} {{t(`labels.${data.product.category.unit.name}`)}}</p>
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
                            <div class="mt-auto col-span-full flex justify-end font-medium">{{ t('labels.totals') }}: {{ formatCurrency(sumPriceOfKitProducts) }} $</div>
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
