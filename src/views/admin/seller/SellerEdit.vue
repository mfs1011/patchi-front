<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import PhoneInput from "@/components/PhoneInput.vue";
import Section from "@/components/UI/Section.vue";
import {computed, onMounted, ref, useTemplateRef} from "vue";
import {useI18n} from "vue-i18n";
import Button from "@/volt/Button.vue";
import Message from "@/volt/Message.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import InputText from "@/volt/InputText.vue";
import Select from "@/volt/Select.vue";
import {useLocationStore} from "@/stores/location.js";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import * as yup from "yup";
import {useSellerStore} from "@/stores/seller.js";
import {useField, useForm} from "vee-validate";
import Dialog from "@/volt/Dialog.vue";
import Loader from "@/components/Loader.vue";

const { t } = useI18n()

const phoneLength = ref();
const sellerStore = useSellerStore();
const locationStore = useLocationStore()
const router = useRouter()
const route = useRoute()
const isLoading = ref(false)
const showLeaveDialog = ref(false)
const isEdited = ref(false)
const pendingNavigation = ref(false)
const isConfirmLoading = ref(false)
const phoneInput = useTemplateRef('phoneInput')

const home = ref({
    icon: 'pi pi-home',
    label: t('administration'),
    route: '/administration'
});

const items = computed(() => [{ label: t('cards.sellers'), route: { name: 'sellers'} }, { label: t('sections.sellers.edit') }]);

// VeeValidate formani sozlash
const schema = computed(() => yup.object({
    name: yup.string().required(t('errorMessages.nameRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
    telephone: yup.string().required().length(phoneLength.value, t('errorMessages.phoneNumberMustBeExactlyCharacters', { count: phoneLength.value })),
    shop: yup.number().required(t('errorMessages.shopRequired'))
}))

const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
    validationSchema: schema
})

const { value: name } = useField('name');
const { value: telephone } = useField('telephone', undefined, { validateOnValueUpdate: false });
const { value: shop } = useField('shop')

const onSubmit = handleSubmit(async values => {
    const payload = {
        name: values.name,
        telephone: values.telephone.replace(/\D/g, ''),
        location: `/api/locations/${values.shop}`
    };

    try {
        const response = await sellerStore.putSeller(payload, route.params.id)
        isEdited.value = true

        resetForm()
        router.back()

        return response;
    } catch (error) {
        throw error
    }
})

onMounted(async () => {
    isLoading.value = true

    await Promise.allSettled([
        locationStore.fetchLocations({ page: 1, isWarehouse: false }),
        sellerStore.fetchSeller(route.params.id)
    ])

    isLoading.value = false

    name.value = sellerStore.getSeller.name
    phoneInput.value.setPhone(await sellerStore.getSeller.telephone.slice(0, 3), await sellerStore.getSeller.telephone.slice(3))
    shop.value = 3
})

const isChanged = computed(() => {
    if (name.value !== sellerStore.getSeller.name) return true
    if (telephone.value?.replace(/\D/g, '') !== sellerStore.getSeller.telephone) return true
    return sellerStore.getSeller.location?.id !== shop.value;
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
        :section-name="t('sections.sellers.edit')"
        back-route-name="users"
        without-buttons
    >
        <template #sectionBody>
            <Loader v-if="isLoading"/>
            <Card
                v-show="!isLoading"
                pt:root="sm:w-fit overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <form @submit.prevent="onSubmit" class="grid grid-cols-1 sm:w-fit gap-2 sm:gap-4">
                        <label class="block">
                            <span>{{ t('labels.name') }}</span><span class="text-red-500"> *</span>
                            <InputText
                                v-model.trim="name"
                                fluid
                                :placeholder="t('placeholders.fullName')"
                                size="large"
                                :class="{ 'p-invalid': errors.name }"
                                autocomplete
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.fullName }}</Message>
                        </label>

                        <label class="block">
                            <span>{{ t('labels.phoneNumber') }}</span><span class="text-red-500"> *</span>
                            <PhoneInput ref="phoneInput" v-model="telephone" v-model:phone-length="phoneLength" />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.telephone }}</Message>
                        </label>

                        <div>
                            <p>{{ t('labels.shop') }}<span class="text-red-500"> *</span></p>

                            <Select
                                v-model="shop"
                                :options="locationStore.getLocations.models"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.shop')"
                                showClear
                                size="large"
                                pt:root="w-full dark:bg-surface-700"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.shop }}</Message>
                        </div>

                        <div class="flex justify-end gap-2 mt-5">
                            <Button type="submit" :label="t('dialog.confirm')" class="px-5" :loading="isSubmitting" :disabled="!isChanged"/>
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

<style scoped>

</style>