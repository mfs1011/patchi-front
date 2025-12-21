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
import {useToast} from "primevue/usetoast";
import InputNumber from "@/volt/InputNumber.vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import {useProductStore} from "@/stores/product.js";
import Column from "primevue/column";
import DataTable from "@/volt/DataTable.vue";
import Dialog from "@/volt/Dialog.vue";
import Message from "@/volt/Message.vue";
import {useAssemblyStore} from "@/stores/assembly.js";
import {useSellerStore} from "@/stores/seller.js";
import InputFile from "@/components/UI/InputFile.vue";
import DatePicker from "@/volt/DatePicker.vue";
import {useMediaObjectStore} from "@/stores/mediaObject.js";
import {useKitStore} from "@/stores/kit.js";
import Select from "@/volt/Select.vue";
import {formatCurrency, formatDateTimeLocal} from "@/helpers/numberFormat.js";

const { t } = useI18n()
const toast = useToast()

const productStore = useProductStore();
const assemblyStore = useAssemblyStore();
const sellerStore = useSellerStore();
const mediaObjectStore = useMediaObjectStore();
const kitStore = useKitStore();
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
const isLocation = ref(false)

const home = computed(() => ({
    icon: 'pi pi-home',
    label: t('shop'),
    route: '/shop'
}));

const items = computed(() => [{ label: t('cards.kits'), route: { name: 'kits'} }, { label: t('sections.kits.add') }]);

const isChanged = computed(() => (
    !!seller.value ||
    !!qr.value ||
    !!code.value ||
    !!name.value ||
    !!assembly.value ||
    !!wholesalePrice.value ||
    !!retailPrice.value ||
    !!kitQty.value ||
    !!expiryDate.value ||
    !!photo.value ||
    !!kitProducts.value.length ||
    !!product.value ||
    !!qty.value
))

// VeeValidate formani sozlash

const FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const kitInfoSchema = computed(() => yup.object({
    qr: yup.string().notRequired().max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    code: yup.string().required(t('errorMessages.codeRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    name: yup.string().required(t('errorMessages.titleRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    wholesalePrice: yup.number().required(t('errorMessages.wholesalePriceRequired')),
    retailPrice: yup.number().required(t('errorMessages.retailPriceRequired')),
    kitQty: yup.number().required(),
    expiryDate: yup.date().required(),
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
    initialValues: {}
})

const { value: seller } = useField('seller', undefined, { form: kitFormCtx });
const { value: qr } = useField('qr', undefined, { form: kitFormCtx });
const { value: code } = useField('code', undefined, { form: kitFormCtx });
const { value: name } = useField('name', undefined, { form: kitFormCtx });
const { value: assembly } = useField('assembly', undefined, { form: kitFormCtx }); // null
const { value: wholesalePrice } = useField('wholesalePrice', undefined, { form: kitFormCtx });
const { value: retailPrice } = useField('retailPrice', undefined, { form: kitFormCtx });
const { value: kitQty } = useField('kitQty', undefined, { form: kitFormCtx });
const { value: expiryDate } = useField('expiryDate', undefined, { form: kitFormCtx });
const { value: photo } = useField('photo', undefined, { form: kitFormCtx } ); // null

const { value: kitProducts } = useField('kitProducts', undefined, { validateOnMount: true, form: kitFormCtx })
const { value: product } = useField('product', undefined, { validateOnValueUpdate: false, form: productFormCtx });
const { value: qty } = useField('qty', undefined, { form: productFormCtx });

const sumPriceOfKitProducts = computed(() => {
    return kitProducts.value.length === 0 ? 0
        : kitProducts.value.reduce((acc, kitProduct) => {
            return acc + (kitProduct?.product.retailPrice * kitProduct.qty)
        }, 0)
})

const onSubmitKit = kitHandleSubmit(async values => {
    const payload = {
        seller: values.seller['@id'],
        code: values.code,
        name: values.name,
        wholesalePrice: values.wholesalePrice,
        retailPrice: values.retailPrice,
        expiryDate: formatDateTimeLocal(values.expiryDate),
        qty: values.kitQty,

        kitProducts: values.kitProducts.map(kitProduct => {
            const obj = {
                product: `/api/products/${kitProduct.product.id}`,
                qty: kitProduct.qty
            };

            if (kitProduct.product.colorId) {
                obj.color = `/api/colors/${kitProduct.product.colorId}`;
            }

            return obj;
        })
    };

    if (qr.value) {
        payload.qr = values.qr
    }

    if (assembly.value) {
        payload.assembly = values.assembly['@id']
    }

    try {
        if (values.photo) {
            const formData = new FormData()
            formData.set('file', values.photo)

            await mediaObjectStore.pushMediaObject(formData)

            if (mediaObjectStore.getMediaObject) {
                payload.photo = mediaObjectStore.getMediaObject['@id']
            }
        }

        await kitStore.pushKit(payload)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('kit.nominativeCapitalize') }), life: 3000 })
        kitResetForm()
        productResetForm()
        router.back()
    } catch (error) {
        if (error.status === 439) {
            toast.add({ severity: 'error', summary: t('toast.already_exists_error', { field: t('code.nominativeCapitalize') }), life: 3000 })
        } else if (error.status === 412) {
            toast.add({ severity: 'error', summary: t('toast.notEnough', { field: t('code.nominativeCapitalize') }), life: 3000 })
        } else {
            toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
        }
    }
})

const onSubmitProduct = productHandleSubmit(async values => {
    const isInclude = kitProducts.value.some(kitProduct => {
        return (
            kitProduct.product.id === values.product.id && kitProduct.product.colorId === values.product.colorId
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

const reversedKitProducts = computed(() => {
    return [...kitProducts.value].reverse()
})

watch(seller, async (newVal) => {
    isLocation.value = false

    if (newVal) {
        await productStore.fetchAvailableProducts({location: newVal.location.id })
        kitProducts.value = []

        isLocation.value = true
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
        :section-name="t('sections.kits.add')"
        back-route-name="kits"
    >
        <template #buttons>
            <div class="hidden sm:flex grow gap-2 sm:gap-4 justify-end mt-4">
                <Button
                    :disabled="!!kitErrors.kitProducts"
                    icon="pi pi-save"
                    @click="onSubmitKit"
                    class="px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="kitIsSubmitting"
                />
            </div>
            <div class="sm:hidden flex grow gap-2 sm:gap-4">
                <Button
                    :disabled="!!kitErrors.kitProducts"
                    icon="pi pi-save"
                    @click="onSubmitKit"
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

                        <div>
                            <p class="text-sm">{{ t('labels.qr') }}</p>
                            <InputText
                                v-model.trim="qr"
                                fluid
                                :placeholder="t('placeholders.qr')"
                                :class="{ 'p-invalid': kitErrors.qr }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ kitErrors.qr }}</Message>
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.code') }}<span class="text-red-500"> *</span></p>
                            <InputText
                                v-model.trim="code"
                                fluid
                                :placeholder="t('placeholders.code')"
                                :class="{ 'p-invalid': kitErrors.code }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ kitErrors.code }}</Message>
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.title') }}<span class="text-red-500"> *</span></p>
                            <InputText
                                v-model.trim="name"
                                fluid
                                :placeholder="t('placeholders.title')"
                                :class="{ 'p-invalid': kitErrors.name }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ kitErrors.name }}</Message>
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
                            <p class="text-sm">{{ t('priceInDollar') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="wholesalePrice"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.price')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!kitErrors.wholesalePrice"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('priceInSoum') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="retailPrice"
                                fluid
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.price')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!kitErrors.retailPrice"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.collection') }}</p>
                            <SearchSelect
                                v-model="assembly"
                                :fetchFn="assemblyStore.fetchAssemblies"
                                :options="assemblyStore.getAssemblies.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.collection')"
                                :loading="assemblyStore.getIsLoadingAssembly"
                                :total-items="assemblyStore.getAssemblies.totalItems"
                                :invalid="!!kitErrors.assembly"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.photo') }}</p>
                            <InputFile ref="fileInput" @change="setPhoto" :fileName="photoName"/>
                            <Message class="min:h-5" size="small" severity="error" variant="simple">{{ kitErrors.photo }}</Message>
                        </div>
                    </div>
                </template>
            </Card>
            <Card
                v-if="isLocation"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <div class="font-medium mb-4">{{ t('addProduct') }}</div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm">{{ t('labels.product') }}<span class="text-red-500"> *</span></p>
                            <SearchSelect
                                v-model="product"
                                :fetchFn="(query) => productStore.fetchAvailableProducts({...query, location: seller.location.id })"
                                :options="productStore.getAvailableProducts.models"
                                :option-label="opt => `${opt?.name} | ${opt?.code} | ${opt?.color ?? '-'} | ${opt?.totalQty} ${t(`labels.${opt?.unit}`)}`"
                                :option-value="opt => `${opt?.name} | ${opt?.code} | ${opt?.color ?? '-'} | ${opt?.totalQty} ${t(`labels.${opt?.unit}`)}`"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.product')"
                                :loading="productStore.getIsLoadingProducts"
                                :total-items="productStore.getAvailableProducts.totalItems"
                                :invalid="!!productErrors.product"
                            >
                                <template #header>
                                    <div
                                        class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{t('labels.title')}} |
                                        {{t('labels.code') }} | {{t('labels.color') }} | {{t('labels.qty') }}
                                    </div>
                                </template>
                            </SearchSelect>
                        </div>

                        <div>
                            <div class="grid grid-cols-2 gap-4">
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
                        :value="reversedKitProducts"
                        scrollable
                        scroll-height="700px"
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                    >
                        <Column field="id" header="№">
                            <template #body="{ index }">
                                <p>{{ kitProducts.length - index }}</p>
                            </template>
                        </Column>
                        <Column field="product" :header="t('labels.product')">
                            <template #body="{ data }">
                                <p>{{ data.product?.name }}</p>
                            </template>
                        </Column>
                        <Column field="code" :header="t('labels.code')">
                            <template #body="{ data }">
                                <p>{{ data.product?.code }}</p>
                            </template>
                        </Column>
                        <Column field="color" :header="t('labels.color')">
                            <template #body="{ data }">
                                <p>{{ data.product?.color }}</p>
                            </template>
                        </Column>
                        <Column field="retailPrice" :header="t('priceInSoum')">
                            <template #body="{ data }">
                                <p>{{ formatCurrency(data.product?.retailPrice) }} {{t('soum')}}</p>
                            </template>
                        </Column>
                        <Column field="qty" :header="t('labels.qty')">
                            <template #body="{ data }">
                                <p>{{ data.qty }} {{t(`labels.${data.product.unit}`)}}</p>
                            </template>
                        </Column>
                        <Column
                            field="actions" :header="t('actions')"
                            bodyClass="text-center"
                            headerClass="text-center"
                            style="width: 120px"
                        >
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
