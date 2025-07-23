<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, onMounted} from "vue";
import {useI18n} from "vue-i18n";
import Message from "@/volt/Message.vue";
import Button from "@/volt/Button.vue";
import Select from "@/volt/Select.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {useField, useForm} from "vee-validate";
import * as yup from "yup";
import {useRoute, useRouter} from "vue-router";
import {useToast} from "primevue/usetoast";
import {useKpiPercentStore} from "@/stores/kpiPercent.js";
import InputNumber from "@/volt/InputNumber.vue";
import DatePicker from "@/volt/DatePicker.vue";
import {useCategoryStore} from "@/stores/category.js";

const { t } = useI18n()
const toast = useToast()

const kpiPercentStore = useKpiPercentStore();
const categoryStore = useCategoryStore();
const router = useRouter();
const route = useRoute();

const home = computed(() => ({
    icon: 'pi pi-home',
    label: t('administration'),
    route: '/administration'
}));

const items = computed(() => [{ label: t('cards.kpi'), route: { name: 'kpi'} }, { label: t('sections.kpi.add') }]);
const isCategory = computed(() => route.params.entity === 'category');

// VeeValidate formani sozlash
const schema = computed(() => yup.object({
    category: yup.number().when([], {
        is: () => route.params.entity === 'category',
        then: schema => schema.required(t('errorMessages.categoryRequired')),
        otherwise: schema => schema.notRequired(),
    }),
    kpiPercent: yup.number().required(t('errorMessages.kpiPercentRequired')),
    createdAt: yup.date().required(t('errorMessages.dateRequired'))
}))

const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
    validationSchema: schema
})

const { value: category } = useField('category');
const { value: kpiPercent } = useField('kpiPercent');
const { value: createdAt } = useField('createdAt');

const onSubmit = handleSubmit(async values => {
    const payload = {
        kpiPercent: values.kpiPercent,
        createdAt: values.createdAt,
    };

    if (isCategory.value) {
        payload.category = `/api/categories/${values.category}`
    }

    try {
        await kpiPercentStore.pushKpiPercent(payload, route.params.entity)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('kpiPercent.nominativeCapitalize') }), life: 3000 })
        resetForm()
        router.back()

    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 }) //todo
    }
})

onMounted(() => {
    if(isCategory) {
        categoryStore.fetchCategories({ page: 1, 'items-per-page': 100 })
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
        :section-name="t('sections.kpi.add')"
        back-route-name="kpi"
        without-buttons
    >
        <template #sectionBody>
            <Card
                pt:root="sm:w-fit overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:header="p-2 sm:p-4 border-b border-surface-300 dark:border-surface-600/50"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #header>
                    <h3 class="text-xl">{{t('labels.' + route.params.entity + 'KpiPercent')}}</h3>
                </template>
                <template #content>
                    <form @submit.prevent="onSubmit" class="grid grid-cols-1 sm:min-w-100 gap-2 sm:gap-4">
                        <div v-if="isCategory">
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

                        <label class="block">
                            <span>{{ t('labels.kpiPercent') }}</span><span class="text-red-500"> *</span>

                            <InputNumber
                                v-model="kpiPercent"
                                fluid
                                prefix="%"
                                showButtons
                                :placeholder="t('placeholders.kpiPercent')"
                                size="large"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :max="100"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.kpiPercent }}</Message>
                        </label>

                        <div>
                            <p>{{ t('labels.createdAt') }}<span class="text-red-500"> *</span></p>

                            <DatePicker
                                v-model.trim="createdAt"
                                dateFormat="dd.mm.yy"
                                showIcon
                                fluid
                                iconDisplay="input"
                                :placeholder="t('placeholders.date')"
                                show-button-bar
                                size="large"
                            />

                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.createdAt }}</Message>
                        </div>

                        <div class="flex justify-end gap-2 mt-5">
                            <SecondaryButton type="button" :label="t('dialog.clear')" @click="resetForm" />
                            <Button type="submit" :label="t('dialog.confirm')" class="px-5" :loading="isSubmitting"/>
                        </div>
                    </form>
                </template>
            </Card>
        </template>
    </Section>
</template>
