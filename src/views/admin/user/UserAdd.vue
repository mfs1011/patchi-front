<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {computed, onMounted, ref, watch} from "vue";
import { useI18n } from "vue-i18n";
import Section from "@/components/UI/Section.vue";
import PhoneInput from "@/components/PhoneInput.vue";
import Select from "@/volt/Select.vue";
import MultiSelect from "@/volt/MultiSelect.vue";
import Card from "@/volt/Card.vue";
import Button from "@/volt/Button.vue";
import Message from "@/volt/Message.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import InputText from "@/volt/InputText.vue";
import {useField, useForm} from "vee-validate";
import * as yup from "yup";
import {useRoleStore} from "@/stores/role.js";
import {useLocationStore} from "@/stores/location.js";
import {useUserStore} from "@/stores/user.js";
import {useRouter} from "vue-router";

const { t } = useI18n();
const roleStore = useRoleStore();
const router = useRouter();
const locationStore = useLocationStore();
const userStore = useUserStore();

const home = ref({
    icon: 'pi pi-home',
    label: t('administration'),
    route: '/administration'
});

const phoneLength = ref();

const items = computed(() => [{ label: t('cards.users'), route: { name: 'users'} }, { label: t('sections.users.add') }]);

const PRETTY_ROLE_NAMES = computed(() => ({
    ROLE_ADMIN: t('roles.admin'),
    ROLE_WAREHOUSE_MANAGER: t('roles.warehouseManager'),
    ROLE_SELLER: t('roles.seller'),
    ROLE_DIRECTOR: t('roles.director'),
    ROLE_PARTNER: t('roles.partner'),
}))

const getRolesList = computed(() =>
    roleStore.getRoles.models.map(({ id, name }) => ({
        id,
        name: PRETTY_ROLE_NAMES.value[name]
    }))
);

// VeeValidate formani sozlash
const schema = computed(() => yup.object({
    fullName: yup.string().required(t('errorMessages.fullNameRequired')).max(30 , t('errorMessages.fullNameMustBeMaxCharacters', { count: 30 })),
    phoneNumber: yup.string().required().length(phoneLength.value, t('errorMessages.phoneNumberMustBeExactlyCharacters', { count: phoneLength.value })),
    password: yup.string().min(6, t('errorMessages.passwordMinLength')).required(t('errorMessages.passwordRequired')),
    role: yup.number().required(t('errorMessages.roleRequired')),
    warehouse: yup.array().when('role', {
        is: 2,
        then: (schema) => schema.min(1, t('errorMessages.warehouseRequired')).required(t('errorMessages.warehouseRequired')),
        otherwise: (schema) => schema.notRequired()
    }),
    shop: yup.string().when('role', {
        is: 3,
        then: (schema) => schema.required(t('errorMessages.shopRequired')),
        otherwise: (schema) => schema.notRequired()
    })
}))

const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
    validationSchema: schema
})

const { value: fullName } = useField('fullName');
const { value: phoneNumber } = useField('phoneNumber', undefined, { validateOnValueUpdate: false });
const { value: password } = useField('password')
const { value: role } = useField('role')
const { value: warehouse } = useField('warehouse')
const { value: shop } = useField('shop')

const onSubmit = handleSubmit(async values => {
    const payload = {
        username: values.phoneNumber.replace(/\D/g, ''),
        password: values.password,
        name: values.fullName,
        role: `/api/roles/${values.role}`,
        locations: []
    };

    if (role.value === 2) {
        payload.locations = values.warehouse.map(warehouseId => ({
                location: `/api/locations/${warehouseId}`
            }))
    }

    if (role.value === 3) {
        payload.locations = [
            {
                location: `/api/locations/${values.shop}`
            }
        ]
    }

    try {
        const response = await userStore.pushUser(payload)

        resetForm()

        await router.push({ name: "users" })

        return response;
    } catch (error) {
        throw error
    }
})

// Lifecycle hooks
onMounted(() => {
    roleStore.fetchRoles()
})

watch(role, async (newValue) => {
    switch (newValue) {
        case 2:
            await locationStore.fetchLocations({ isWarehouse: true })
            break;
        case 3:
            await locationStore.fetchLocations({ isWarehouse: false })
            break;
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
        :section-name="t('sections.users.add')"
        back-route-name="users"
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
                            <span>{{ t('labels.fullName') }}</span><span class="text-red-500"> *</span>
                            <InputText
                                v-model.trim="fullName"
                                fluid
                                :placeholder="t('placeholders.fullName')"
                                size="large"
                                :class="{ 'p-invalid': errors.fullName }"
                                autocomplete
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.fullName }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.phoneNumber') }}</span><span class="text-red-500"> *</span>
                            <PhoneInput v-model="phoneNumber" v-model:phone-length="phoneLength" />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.phoneNumber }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.password') }}</span><span class="text-red-500"> *</span>
                            <InputText
                                v-model.trim="password"
                                id="password"
                                fluid
                                :placeholder="t('placeholders.enterPassword')"
                                size="large"
                                :class="{ 'p-invalid': errors.password }"
                                autocomplete
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.password }}</Message>
                        </label>
                        <div>
                            <p>{{ t('labels.role') }}<span class="text-red-500"> *</span></p>

                            <Select
                                @change="() => {
                                    warehouse = []
                                    shop = ''
                                }"
                                v-model="role"
                                :options="getRolesList"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.role')"
                                showClear
                                size="large"
                                pt:root="w-full dark:bg-surface-700"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.role }}</Message>
                        </div>

                        <div v-if="role === 2">
                            <p>{{ t('labels.warehouse') }}<span class="text-red-500"> *</span></p>
                            <MultiSelect
                                v-model="warehouse"
                                :options="locationStore.getLocations.models"
                                :maxSelectedLabels="3"
                                size="large"
                                showClear
                                pt:root="w-full"
                                :placeholder="t('placeholders.select.warehouse')"
                                option-value="id"
                                option-label="name"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.warehouse }}</Message>
                        </div>
                        <div v-if="role === 3">
                            <p>{{ t('labels.shop') }}</p>

                            <Select
                                v-model="shop"
                                :options="locationStore.getLocations.models"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.shop')"
                                showClear
                                size="large"
                                pt:root="w-full"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.shop }}</Message>
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
