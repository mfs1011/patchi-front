<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, onMounted, ref, useTemplateRef} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Message from "@/volt/Message.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import InputText from "@/volt/InputText.vue";
import Select from "@/volt/Select.vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import * as yup from "yup";
import {useField, useForm} from "vee-validate";
import Dialog from "@/volt/Dialog.vue";
import {useToast} from "primevue/usetoast";
import {useProductStore} from "@/stores/product.js";
import {useMediaObjectStore} from "@/stores/mediaObject.js";
import {useAssemblyStore} from "@/stores/assembly.js";
import {useCategoryStore} from "@/stores/category.js";
import InputNumber from "@/volt/InputNumber.vue";
import InputFile from "@/components/UI/InputFile.vue";
import Skeleton from "@/volt/Skeleton.vue";
import {buildChangedPayload} from "@/helpers/payloadUtils.js";

const toast = useToast();
const { t } = useI18n()

const categoryStore = useCategoryStore();
const productStore = useProductStore();
const mediaObjectStore = useMediaObjectStore();
const assemblyStore = useAssemblyStore();
const photoPreview = ref('');
const router = useRouter()
const route = useRoute()
const isLoading = ref(false)
const showLeaveDialog = ref(false)
const isEdited = ref(false)
const pendingNavigation = ref(false)
const isConfirmLoading = ref(false)
const isVisible = ref(false)
const fileInput = useTemplateRef('fileInput');
const photoName = ref('');
const initialValues = ref({})

const home = ref({
    icon: 'pi pi-home',
    label: t('administration'),
    route: '/administration'
});

const items = computed(() => [{ label: t('cards.products'), route: { name: 'products'} }, { label: t('sections.products.edit') }]);
const baseUrl = computed(() => import.meta.env.VITE_APP_API_URL);

// VeeValidate formani sozlash
const FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const schema = computed(() => yup.object({
    qr: yup.string().notRequired().max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    code: yup.string().required(t('errorMessages.codeRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    name: yup.string().required(t('errorMessages.titleRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    category: yup.number().required(t('errorMessages.categoryRequired')),
    assembly: yup.number().notRequired(),
    wholesalePrice: yup.number().notRequired(),
    retailPrice: yup.number().notRequired(),
    minQty: yup.number().notRequired(),
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
}))

const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
    validationSchema: schema,
    initialValues: {
        qr: '',
        assembly: null
    }
})

const { value: qr } = useField('qr');
const { value: code } = useField('code');
const { value: name } = useField('name');
const { value: category } = useField('category');
const { value: assembly } = useField('assembly'); // null
const { value: wholesalePrice } = useField('wholesalePrice');
const { value: retailPrice } = useField('retailPrice');
const { value: minQty } = useField('minQty');
const { value: photo } = useField('photo'); // null


const setPhoto = event => {
    if (event.target.files[0]) {
        photo.value = event.target.files[0]
        photoName.value = event.target.files[0].name
    } else {
        photo.value = ''
        photoName.value = ''
    }
}

const onSubmit = handleSubmit(async values => {
    const uriKeys = {
        category: '/api/categories/',
        assembly: '/api/assemblies/'
    };

    const payload = buildChangedPayload(values, initialValues.value, uriKeys);

    if (Object.keys(payload).length === 0) {
        return // hech narsa o'zgarmasa shunchaki to'xtatish
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

        await productStore.putProduct(payload, route.params.id)
        isEdited.value = true

        toast.add({ severity: 'success', summary: t('toast.edited', { name: t('product.nominativeCapitalize') }), life: 3000 })

        resetForm()
        router.back()

    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.already_exists_error', { field: t('code.nominativeCapitalize') }), life: 3000 })
    }
})

onMounted(async () => {
    isLoading.value = true

    await productStore.fetchProduct(route.params.id)

    const promises = []

    if (!assemblyStore.getAssemblies.models.length) {
        promises.push(assemblyStore.fetchAssemblies({ page: 1, 'items-per-page': 100 }))
    }

    if (!categoryStore.getCategories.models.length) {
        promises.push(categoryStore.fetchCategories({ page: 1, 'items-per-page': 100 }))
    }

    await Promise.allSettled(promises)

    isLoading.value = false

    initialValues.value = {
        qr : productStore.getProduct.qr,
        code : productStore.getProduct.code,
        name: productStore.getProduct.name,
        category: productStore.getProduct.category.id,
        wholesalePrice: productStore.getProduct.wholesalePrice,
        retailPrice :productStore.getProduct.retailPrice,
        minQty: productStore.getProduct.minQty,
        assembly: productStore.getProduct.assembly
    }

    photoPreview.value = productStore.getProduct.photo?.contentUrl

    if (productStore.getProduct.assembly) {
        initialValues.value.assembly = productStore.getProduct.assembly.id
    }

    resetForm({
        values: {
            ...initialValues.value
        }
    })
})

const isChanged = computed(() => {
    if (name.value !== productStore.getProduct.name) return true
    if (qr.value !== productStore.getProduct.qr) return true
    if (code.value !== productStore.getProduct.code) return true
    if (category.value !== productStore.getProduct.category.id) return true

    if(productStore.getProduct.assembly) {
        if (assembly.value !== productStore.getProduct.assembly.id) return true
    } else {
        if (assembly.value) return true
    }

    if (wholesalePrice.value !== productStore.getProduct.wholesalePrice) return true
    if (retailPrice.value !== productStore.getProduct.retailPrice) return true
    if (minQty.value !== productStore.getProduct.minQty) return true
    if (photo.value) return true

    return false
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
    isEdited.value = false
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
        :section-name="t('sections.products.edit')"
        back-route-name="products"
        without-buttons
    >
        <template #sectionBody>
            <Card
                pt:root="sm:w-fit overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <form @submit.prevent="onSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 sm:max-w-180 w-full">
                        <label class="block">
                            <span>{{ t('labels.qr') }}</span>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <InputText
                                v-if="!isLoading"
                                v-model.trim="qr"
                                fluid
                                :placeholder="t('placeholders.qr')"
                                size="large"
                                :class="{ 'p-invalid': errors.qr }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.qr }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.code') }}</span><span class="text-red-500"> *</span>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <InputText
                                v-if="!isLoading"
                                v-model.trim="code"
                                fluid
                                :placeholder="t('placeholders.code')"
                                size="large"
                                :class="{ 'p-invalid': errors.code }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.code }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.title') }}</span><span class="text-red-500"> *</span>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <InputText
                                v-if="!isLoading"
                                v-model.trim="name"
                                fluid
                                :placeholder="t('placeholders.title')"
                                size="large"
                                :class="{ 'p-invalid': errors.name }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.name }}</Message>
                        </label>

                        <div>
                            <p>{{ t('labels.category') }}<span class="text-red-500"> *</span></p>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <Select
                                v-if="!isLoading"
                                v-model="category"
                                :options="categoryStore.getCategories.models"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.category')"
                                showClear
                                size="large"
                                pt:root="w-full dark:bg-surface-700"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.category }}</Message>
                        </div>

                        <div>
                            <p>{{ t('labels.assembly') }}</p>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <Select
                                v-if="!isLoading"
                                v-model="assembly"
                                :options="assemblyStore.getAssemblies.models"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.assembly')"
                                showClear
                                size="large"
                                pt:root="w-full dark:bg-surface-700"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.assembly }}</Message>
                        </div>

                        <label class="block">
                            <span>{{ t('labels.wholesalePrice') }}</span>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <InputNumber
                                v-if="!isLoading"
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
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.wholesalePrice }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.retailPrice') }}</span>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <InputNumber
                                v-if="!isLoading"
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
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.retailPrice }}</Message>
                        </label>
                        <label class="block">
                            <span>{{ t('labels.minQty') }}</span>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <InputNumber
                                v-if="!isLoading"
                                v-model="minQty"
                                fluid
                                mode="decimal"
                                :min="0"
                                showButtons
                                :placeholder="t('placeholders.minQty')"
                                size="large"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.minQty }}</Message>
                        </label>

                        <label class="block h-fit">
                            <span>{{ t('labels.changePhoto') }}</span>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="22rem" v-if="isLoading"/>

                            <InputFile
                                v-if="!isLoading"
                                ref="fileInput"
                                @change="setPhoto"
                                :fileName="photoName"
                                :placeholder="t('changePhoto')"
                            />
                            <Message class="min:h-5" size="small" severity="error" variant="simple">{{ errors.photo }}</Message>
                        </label>

                        <div v-if="productStore.getProduct.photo?.contentUrl || isLoading" class="col-span-1 rounded">
                            <span>{{ t('labels.photoPreview') }}</span>

                            <Skeleton class="sm:hidden" height="20rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="14rem" width="22rem" v-if="isLoading"/>

                            <Button
                                v-if="!isLoading"
                                @click="isVisible = true"
                                pt:root="bg-transparent p-0 border-none enabled:hover:bg-transparent w-full"
                            >
                                <img class="rounded-lg w-full object-cover" :src="baseUrl + photoPreview" :alt="name" />
                            </Button>
                        </div>

                        <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                            <Button type="submit" :label="t('dialog.confirm')" :disabled="!isChanged" class="px-5" :loading="isSubmitting || isSubmitting"/>
                        </div>
                    </form>
                </template>
            </Card>
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

            <Dialog v-model:visible="isVisible" maximizable modal :header="name" class="md:w-200 w-9/10 ">
                <div class="w-full h-fit">
                    <img class="object-cover w-full sm:h-full" :src="baseUrl + photoPreview" :alt="name">
                </div>
            </Dialog>
        </template>
    </Section>
</template>
