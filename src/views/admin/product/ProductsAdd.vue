<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, onMounted, ref, useTemplateRef} from "vue";
import {useI18n} from "vue-i18n";
import Message from "@/volt/Message.vue";
import Button from "@/volt/Button.vue";
import Select from "@/volt/Select.vue";
import Card from "@/volt/Card.vue";
import InputText from "@/volt/InputText.vue";
import InputNumber from "@/volt/InputNumber.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {useField, useForm} from "vee-validate";
import * as yup from "yup";
import {useRouter} from "vue-router";
import {useToast} from "primevue/usetoast";
import {useProductStore} from "@/stores/product.js";
import {useCategoryStore} from "@/stores/category.js";
import {useAssemblyStore} from "@/stores/assembly.js";
import {useMediaObjectStore} from "@/stores/mediaObject.js";
import InputFile from "@/components/UI/InputFile.vue";

const { t } = useI18n()
const toast = useToast()

const categoryStore = useCategoryStore();
const mediaObjectStore = useMediaObjectStore();
const productStore = useProductStore();
const assemblyStore = useAssemblyStore();
const router = useRouter();
const fileInput = useTemplateRef('fileInput');
const photoName = ref('');

const home = computed(() => ({
    icon: 'pi pi-home',
    label: t('administration'),
    route: '/administration'
}));

const items = computed(() => [{ label: t('cards.products'), route: { name: 'products'} }, { label: t('sections.products.add') }]);

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
    validationSchema: schema
})

const { value: qr } = useField('qr');
const { value: code } = useField('code');
const { value: name } = useField('name');
const { value: category } = useField('category');
const { value: assembly } = useField('assembly'); // null
const { value: wholesalePrice } = useField('wholesalePrice');
const { value: retailPrice } = useField('retailPrice');
const { value: minQty } = useField('minQty');
const { value: photo } = useField('photo' ); // null

const setPhoto = event => {
    photo.value = event.target.files[0]
    photoName.value = event.target.files[0].name
}

const onSubmit = handleSubmit(async values => {
    const payload = {
        qr: values.qr,
        code: values.code,
        name: values.name,
        category: `/api/categories/${values.category}`,
        wholesalePrice: values.wholesalePrice,
        retailPrice: values.retailPrice,
        minQty: values.minQty,
    };

    if (assembly.value) {
        payload.assembly = `/api/assemblies/${assembly.value}`
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

        await productStore.pushProduct(payload)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('product.nominativeCapitalize') }), life: 3000 })
        resetForm()
        router.back()

    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.already_exists_error', { field: t('product.nominativeCapitalize') }), life: 3000 })
    }
})

const reset = () => {
    resetForm();
    photo.value = null
    fileInput.value?.resetFileInput()
    photoName.value = ''
}

onMounted(async () => {
    if(!categoryStore.getCategories.models.length) {
        await categoryStore.fetchCategories()
    }

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
        :section-name="t('sections.sellers.add')"
        back-route-name="sellers"
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
                            <InputText
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
                            <InputText
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
                            <InputText
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

                            <Select
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

                            <Select
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
                            <InputNumber
                                v-model="wholesalePrice"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.wholesalePrice')"
                                size="large"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.wholesalePrice }}</Message>
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
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.retailPrice }}</Message>
                        </label>
                        <label class="block">
                            <span>{{ t('labels.minQty') }}</span>
                            <InputNumber
                                v-model="minQty"
                                fluid
                                mode="decimal"
                                :min="0"
                                showButtons
                                :placeholder="t('placeholders.minQty')"
                                size="large"
                                :minFractionDigits="1"
                                :maxFractionDigits="5"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.minQty }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.photo') }}</span>
                            <InputFile ref="fileInput" @change="setPhoto" :fileName="photoName"/>
                            <Message class="min:h-5" size="small" severity="error" variant="simple">{{ errors.photo }}</Message>
                        </label>


                        <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                            <SecondaryButton type="button" :label="t('dialog.clear')" @click="reset" />
                            <Button type="submit" :label="t('dialog.confirm')" class="px-5" :loading="isSubmitting"/>
                        </div>
                    </form>
                </template>
            </Card>
        </template>
    </Section>
</template>
