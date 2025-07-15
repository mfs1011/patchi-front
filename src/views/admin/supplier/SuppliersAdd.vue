<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import Message from "@/volt/Message.vue";
import Button from "@/volt/Button.vue";
import Textarea from "@/volt/Textarea.vue";
import Card from "@/volt/Card.vue";
import InputText from "@/volt/InputText.vue";
import PhoneInput from "@/components/PhoneInput.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {useField, useForm} from "vee-validate";
import * as yup from "yup";
import {useRouter} from "vue-router";
import {useCustomerStore} from "@/stores/customer.js";
import {useToast} from "primevue/usetoast";
import {useSupplierStore} from "@/stores/supplier.js";

const { t } = useI18n()
const toast = useToast()

const phoneLength = ref();
const supplierStore = useSupplierStore();
const router = useRouter();

const home = computed(() => ({
    icon: 'pi pi-home',
    label: t('administration'),
    route: '/administration'
}));

const items = computed(() => [{ label: t('cards.suppliers'), route: { name: 'suppliers'} }, { label: t('sections.suppliers.add') }]);

// VeeValidate formani sozlash
const schema = computed(() => yup.object({
    name: yup.string().required(t('errorMessages.supplierRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    telephone: yup.string().required().length(phoneLength.value, t('errorMessages.phoneNumberMustBeExactlyCharacters', { count: phoneLength.value })),
}))

const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
    validationSchema: schema
})

const { value: name } = useField('name');
const { value: telephone } = useField('telephone', undefined, { validateOnValueUpdate: false });

const onSubmit = handleSubmit(async values => {
    const payload = {
        name: values.name,
        telephone: values.telephone.replace(/\D/g, ''),
    };

    try {
        const response = await supplierStore.pushSupplier(payload)
        toast.add({ severity: 'success', summary: t('toast.created', { name: t('supplier.nominativeCapitalize') }), life: 3000 })

        resetForm()
        router.back()

        return response;
    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.already_exists_error', { field: t('phone.nominativeCapitalize') }), life: 3000 })
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
        :section-name="t('sections.suppliers.add')"
        back-route-name="suppliers"
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
                            <span>{{ t('labels.supplierName') }}</span><span class="text-red-500"> *</span>
                            <InputText
                                v-model.trim="name"
                                fluid
                                :placeholder="t('placeholders.supplierName')"
                                size="large"
                                :class="{ 'p-invalid': errors.name }"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.name }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.phoneNumber') }}</span><span class="text-red-500"> *</span>
                            <PhoneInput v-model="telephone" v-model:phone-length="phoneLength" />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.telephone }}</Message>
                        </label>


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
