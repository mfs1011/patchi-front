<script setup>
import Button from "@/volt/Button.vue";
import DataTable from "@/volt/DataTable.vue";
import Paginator from "@/volt/Paginator.vue";
import Column from 'primevue/column';
import { computed, onMounted, ref, watch } from "vue";
import { useUserStore } from "@/stores/user.js";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import Select from "@/volt/Select.vue";
import InputText from "@/volt/InputText.vue";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import { useRoleStore } from "@/stores/role.js";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import Dialog from "@/volt/Dialog.vue";
import NoData from "@/components/UI/NoData.vue";
import Loader from "@/components/Loader.vue";
import Section from "@/components/UI/Section.vue";
import PhoneInput from "@/components/PhoneInput.vue";
import Message from "@/volt/Message.vue";
import * as yup from "yup";
import {useField, useForm} from "vee-validate";
import {useLocationStore} from "@/stores/location.js";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();
const roleStore = useRoleStore();
const locationStore = useLocationStore();


// Refs
const visible = ref({
    addAndEdit: false,
    edit: false,
    deleteVisible: false,
})
const isAddModal = ref(false)
const isDeleteLoading = ref(false)
const currentUserId = ref()
const debouncedFilter = useDebouncedRef(null, 500)
const filters = ref({
    page: parseInt(route.query.page) || 2,
    itemsPerPage: parseInt(route.query['items-per-page']) || 10,
    role: null
});
const phoneLength = ref();

console.log(filters.value)
// Computed
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

// Watchers
watch([() => debouncedFilter.value, () => filters.value], async () => {
    const queryFilter = {
        page: filters.value.page,
        'items-per-page': filters.value.itemsPerPage,
    }

    if(debouncedFilter.value !== null) {
        queryFilter.name = debouncedFilter.value;
    }

    if(debouncedFilter.value === '') {
        delete queryFilter.name
    }

    if(filters.value.role !== null) {
        queryFilter.role = filters.value.role;
    } else {
        delete queryFilter.role
    }

    await updateQuery(queryFilter);

    await userStore.fetchUsers(route.query)
}, { immediate: true, deep: true });

// Functions
async function updateQuery(newParams) {
    await router.push({
        query: {
            ...newParams,
        },
    })
}

const editAction = async user => {
    await userStore.fetchUser(user.id);
    isAddModal.value = false;
    visible.value.addAndEdit = true

    fullName.value = userStore.getUser.name
    phoneNumber.value = userStore.getUser.username
    password.value = ''
    role.value = userStore.getUser.role.id
    // todo bir nechta location tanlash imkoni bormi yoki yo'q? Bu yaratguncha ham selectga tegishli
    // warehouse.value = userStore.getUser.locations.filter(location => location.isWarehouse)
    // shop.value = userStore.getUser
}

const deleteAction = id => {
    currentUserId.value = id
    visible.value.deleteVisible = true
    console.log(id)
}


const deleteUser = async () => {
    isDeleteLoading.value = true
    await userStore.deleteUser(currentUserId.value)
    await userStore.fetchUsers(route.query)
    isDeleteLoading.value = false
    visible.value.deleteVisible = false
}

const hasAccessDelete = data => (userStore.getAboutMeFromToken.id !== data.id) && data.id !== 1;

// Lifecycle hooks
onMounted(() => {
    roleStore.fetchRoles()
})

// VeeValidate formani sozlash
const schema = computed(() => yup.object({
    fullName: yup.string().required().max(30 , t('errorMessages.fullNameMustBeMaxCharacters', { count: 30 })),
    phoneNumber: yup.string().required().length(phoneLength.value, t('errorMessages.phoneNumberMustBeExactlyCharacters', { count: phoneLength.value })),
    password: yup.string().required(t('errorMessages.passwordRequired')),
    role: yup.number().required(t('errorMessages.roleRequired')),
    warehouse: yup.string().when('role', {
        is: 2,
        then: (schema) => schema.required(t('errorMessages.warehouseRequired')),
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

    if (role.value === 2 || role.value === 3) {
        payload.locations = [
            {
                location: `/api/locations/${values.warehouse || values.shop}`
            }
        ]
    }

    try {
        const response = await userStore.pushUser(payload)

        if(isAddModal.value) {
            await userStore.fetchUsers(route.query)
        } else {
            // await userStore.editUser(payload)
        }

        visible.value.addAndEdit = false
        resetForm()

        return response;
    } catch (error) {
        throw error
    }
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
    <Section
        :add-button-name="t('buttons.newUser')"
        :section-name="t('cards.users')"
        back-route-name="administration"
        @on-click-add="args => {
            isAddModal = true
            visible.addAndEdit = args
        }"
    >
        <template #sectionBody>
            <!-- FILTERS OF TABLE ITEMS -->
            <div class="flex flex-wrap gap-2 sm:gap-4 items-center">
                <label class="relative min-w-50 max-w-90 w-full">
                    <i class="pi pi-search absolute top-1/2 -mt-2 text-surface-400 leading-none start-3 z-1" />
                    <InputText
                        pt:root="dark:bg-surface-800 ps-10"
                        v-model="debouncedFilter"
                        class="w-full"
                        :placeholder="t('placeholders.search.byNameAndPhone')"
                    />
                </label>
                <Select
                    v-model="filters.role"
                    :options="getRolesList"
                    option-label="name"
                    option-value="id"
                    :placeholder="t('placeholders.search.byRole')"
                    showClear
                />
            </div>

<!--            <Loader v-if="userStore.getIsLoadingUsers" class="my-auto"/>-->

            <NoData v-if="!userStore.getUsers.totalItems" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t('noResults') }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <DataTable
                :value="userStore.getUsers.models"
                :total-records="userStore.getUsers.totalItems"
                :rows="filters.itemsPerPage"
                scrollable
                pt:footer="border-none dark:bg-surface-800"
                pt:root="border border-surface-200 dark:border-surface-700"
                :loading="userStore.getIsLoadingUsers"
            >
                <Column field="id" :header="t('labels.id')"></Column>
                <Column field="name" :header="t('labels.name')" class="whitespace-nowrap"></Column>
                <Column field="username" :header="t('labels.phoneNumber')" class="whitespace-nowrap"></Column>
                <Column field="role" :header="t('labels.role')" class="whitespace-nowrap">
                    <template #body="{ data }">
                        <p> {{PRETTY_ROLE_NAMES[data.role.name]}}</p>
                    </template>
                </Column>
                <Column field="id" class="flex justify-end">
                    <template #header>
                        <p class="font-semibold">Actions</p>
                    </template>
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <Button
                                @click="editAction(data)"
                                icon="pi pi-pencil"
                                pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                size="small"
                            />
                            <Button
                                v-if="hasAccessDelete(data)"
                                @click="deleteAction(data.id)"
                                icon="pi pi-trash"
                                pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                size="small"
                            />
                        </div>
                    </template>
                </Column>

                <template #footer>
                    <div class="flex flex-wrap items-center justify-end gap-5">
                        <Select
                            v-model="filters.itemsPerPage"
                            :options="[5,10,15,20,25,30,40,50,75,100]"
                            placeholder="Select a Country"
                            size="small"
                            class="w-fit"
                            pt:root="w-44"
                            pt:label="dark:bg-surface-950 rounded-s-md dark:bg-surface-800"
                            pt:dropdown="dark:bg-surface-950 dark:bg-surface-800"
                        />
                        <!-- TODO Paginator xato ekan uni qo'lda yozish kerak -->
                        <Paginator
                            pt:root="dark:bg-surface-800"
                            v-model="filters.page"
                            :total-records="userStore.getUsers.totalItems"
                            :rows="filters.itemsPerPage"
                        />
                    </div>
                </template>
            </DataTable>

            <!-- ADD USER DIALOG -->
            <Dialog v-model:visible="visible.addAndEdit" modal :closable="false" class="sm:w-120 w-9/10" pt:header="py-0 pt-4">
                <template #header>
                    <span class="text-xl text-surface-500 dark:text-surface-400 block mb-4 capitalize">
                        {{ isAddModal
                            ? t('dialog.addConfirmation', { name: t('user.nominative') })
                            : t('dialog.editConfirmation', { name: t('user.accusative') })
                        }}
                    </span>
                </template>

                <template #default>
                    <form @submit.prevent="onSubmit">
                        <label class="mb-2 block">
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

                        <label class="mb-2 block">
                            <span>{{ t('labels.phoneNumber') }}</span><span class="text-red-500"> *</span>
                            <PhoneInput v-model="phoneNumber" v-model:phone-length="phoneLength" />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.phoneNumber }}</Message>
                        </label>

                        <label class="mb-2 block mt-1">
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

                        <div class="mb-2 mt-1">
                            <p>{{ t('labels.role') }}<span class="text-red-500"> *</span></p>

                            <Select
                                v-model="role"
                                :options="getRolesList"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.role')"
                                showClear
                                size="large"
                                pt:root="w-full"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.role }}</Message>
                        </div>

                        <div v-if="role === 2" class="mb-2 mt-1">
                            <p>{{ t('labels.warehouse') }}<span class="text-red-500"> *</span></p>

                            <Select
                                v-model="warehouse"
                                :options="locationStore.getLocations.models"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.warehouse')"
                                showClear
                                size="large"
                                pt:root="w-full"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.warehouse }}</Message>
                        </div>

                        <div v-if="role === 3" class="mb-2 mt-1">
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
                            <SecondaryButton type="button" :label="t('dialog.cancel')" @click="visible.addAndEdit = false" />
                            <Button type="submit" :label="t('dialog.confirm')" class="px-5" :loading="isSubmitting"/>
                        </div>
                    </form>
                </template>
            </Dialog>

            <!-- EDIT USER DIALOG -->
            <Dialog v-model:visible="visible.edit" modal :closable="false" class="sm:w-100 w-9/10">
                <template #header>
                <span class="text-surface-500 dark:text-surface-400 block">
                    {{ t('dialog.editConfirmation') }}
                </span>
                </template>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton type="button" :label="t('dialog.cancel')" @click="visible.edit = false" />
                        <Button type="button" :label="t('dialog.confirm')" class="px-5"/>
                    </div>
                </template>
            </Dialog>

            <!-- DELETE USER DIALOG -->
            <Dialog
                v-model:visible="visible.deleteVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
            <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                {{ t('dialog.deleteConfirmation', { name: t('user.accusative'), id: currentUserId }) }}
            </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton type="button" :label="t('dialog.cancel')" @click="visible.deleteVisible = false" />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteUser"
                            :loading="isDeleteLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
        </template>
    </Section>
</template>
