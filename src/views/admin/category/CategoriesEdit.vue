<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Message from "@/volt/Message.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import InputText from "@/volt/InputText.vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import * as yup from "yup";
import {useField, useForm} from "vee-validate";
import Dialog from "@/volt/Dialog.vue";
import {useToast} from "primevue/usetoast";
import Skeleton from "@/volt/Skeleton.vue";
import {useCategoryStore} from "@/stores/category.js";
import Select from "@/volt/Select.vue";
import {useCategoryTypeStore} from "@/stores/categoryType.js";
import {useUnitStore} from "@/stores/unit.js";

const { t, locale } = useI18n()
const toast = useToast()

const categoryStore = useCategoryStore();
const categoryTypeStore = useCategoryTypeStore();
const unitStore = useUnitStore();
const router = useRouter()
const route = useRoute()
const isLoading = ref(false)
const showLeaveDialog = ref(false)
const isEdited = ref(false)
const pendingNavigation = ref(false)
const isConfirmLoading = ref(false)

const home = ref({
    icon: 'pi pi-home',
    label: t('administration'),
    route: '/administration'
});

const items = computed(() => [{ label: t('cards.categories'), route: { name: 'categories'} }, { label: t('sections.categories.edit') }]);
const units = computed(() => unitStore.getUnits.models.map(unit => {
    return {
        ...unit,
        name: t(`labels.${unit.name}`)
    }
}))

// VeeValidate formani sozlash
const schema = computed(() => yup.object({
    name: yup.string().required(t('errorMessages.categoryNameRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    categoryType: yup.number().required(t('errorMessages.categoryTypeRequired')),
    unit: yup.number().required(t('errorMessages.unitRequired')),
}))

const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
    validationSchema: schema
})

const { value: name } = useField('name');
const { value: categoryType } = useField('categoryType');
const { value: unit } = useField('unit');

const onSubmit = handleSubmit(async values => {
    const payload = {
        name: values.name,
        unit: `/api/units/${values.unit}`,
        categoryType: `/api/category_types/${values.categoryType}`,
    };

    try {
        const response = await categoryStore.putCategory(payload, route.params.id)
        isEdited.value = true

        resetForm()
        router.back()

        toast.add({ severity: 'success', summary: t('toast.edited', { name: t('categories.nominativeCapitalize') }), life: 3000 })
        return response;
    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.already_exists_error_named', { name: locale.value === 'uz' ? t('category_name.nominative') : t('category_name.nominativeCapitalize') }), life: 3000 })
    }
})

onMounted(async () => {
    isLoading.value = true

    await Promise.allSettled([
        categoryStore.fetchCategory(route.params.id),
        categoryTypeStore.fetchCategoryTypes(),
        unitStore.fetchUnits()
    ])

    isLoading.value = false

    name.value = categoryStore.getCategory.name
    categoryType.value = categoryStore.getCategory.categoryType.id
    unit.value = categoryStore.getCategory.unit.id
})

const isChanged = computed(() => {
    if (name.value !== categoryStore.getCategory.name) return true
    if (categoryType.value !== categoryStore.getCategory.categoryType?.id) return true
    return unit.value !== categoryStore.getCategory.unit?.id;

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
        :section-name="t('sections.warehouses.edit')"
        back-route-name="warehouses"
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
                    <form @submit.prevent="onSubmit" class="grid grid-cols-1 sm:w-fit gap-2 sm:gap-4">
                        <label class="block">
                            <span>{{ t('labels.warehouseName') }}</span><span class="text-red-500"> *</span>
                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="20.8rem" v-if="isLoading"/>

                            <InputText
                                v-show="!isLoading"
                                v-model.trim="name"
                                fluid
                                :placeholder="t('placeholders.warehouseName')"
                                size="large"
                                :class="{ 'p-invalid': errors.name }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.name }}</Message>
                        </label>
                        <div>
                            <p class="inline">{{ t('labels.categoryType') }}</p><span class="text-red-500"> *</span>

                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="20.8rem" v-if="isLoading"/>

                            <Select
                                v-show="!isLoading"
                                v-model="categoryType"
                                :options="categoryTypeStore.getCategoryTypes.models"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.categoryType')"
                                showClear
                                size="large"
                                pt:root="w-full"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.categoryType }}</Message>
                        </div>

                        <div>
                            <p class="inline">{{ t('labels.unit') }}</p><span class="text-red-500"> *</span>

                            <Skeleton class="sm:hidden" height="3.1rem"  v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="3.1rem" width="20.8rem" v-if="isLoading"/>

                            <Select
                                v-show="!isLoading"
                                v-model="unit"
                                :options="units"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.unit')"
                                showClear
                                size="large"
                                pt:root="w-full"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.categoryType }}</Message>
                        </div>
                        <div class="flex justify-end gap-2 mt-5">
                            <Skeleton height="2.7rem" width="6.5rem" v-if="isLoading"/>
                            <Button v-else type="submit" :label="t('dialog.confirm')" class="px-5" :loading="isSubmitting" :disabled="!isChanged"/>
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
        </template>
    </Section>
</template>
