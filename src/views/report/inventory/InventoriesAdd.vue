<script setup>
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Section from "@/components/UI/Section.vue";
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import Message from "@/volt/Message.vue";
import Button from "@/volt/Button.vue";
import Select from "@/volt/Select.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {useField, useForm} from "vee-validate";
import * as yup from "yup";
import {useRouter} from "vue-router";
import {useToast} from "primevue/usetoast";
import {useInventoryStore} from "@/stores/inventory.js";
import {useLocationStore} from "@/stores/location.js";
import DatePicker from "@/volt/DatePicker.vue";

const { t } = useI18n()
const toast = useToast()

const locationStore = useLocationStore();
const inventoryStore = useInventoryStore();
const router = useRouter();
const dateFrom = ref();

const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("reports"),
    route: "/reports",
}));

const items = computed(() => [{ label: t('cards.inventories'), route: { name: 'inventories'} }, { label: t('sections.inventories.add') }]);

// VeeValidate formani sozlash

const schema = computed(() => yup.object({
    location: yup.number().required(t('errorMessages.locationRequired')),
    dateTo: yup.date().required(t('errorMessages.dateRequired')),
}))

const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
    validationSchema: schema
})

const { value: location } = useField('location');
const { value: dateTo } = useField('dateTo');

const onSubmit = handleSubmit(async values => {
    const date = new Date(values.dateTo);
    date.setHours(date.getHours() + 5);

    const payload = {
        location: `/api/locations/${values.location}`,
        dateTo: date
    };

    try {
        await inventoryStore.pushInventory(payload)

        toast.add({ severity: 'success', summary: t('toast.created', { name: t('inventory.nominativeCapitalize') }), life: 3000 })
        resetForm()
        router.back()

    } catch (error) {
        if (error.status === 400) {
            toast.add({ severity: 'error', summary: t('toast.unconfirmedExists'), life: 3000 })
        }

        if (error.status === 404) {
            toast.add({ severity: 'error', summary: t('toast.noIncomingToLocation'), life: 3000 })
        }
    }
})

watch(location, async () => {
    if (location.value) {
        await inventoryStore.fetchLastDateToByLocation({ location: `/api/locations/${location.value}`})

        if (inventoryStore.getLastInventoryDateTo === null) {
            dateFrom.value = null
        } else {
            const date = new Date(inventoryStore.getLastInventoryDateTo);
            date.setDate(date.getDate() + 1);
            dateFrom.value = date;
        }
    } else {
        dateFrom.value = null
    }
})

onMounted(async () => {
    if(!locationStore.getLocations.models.length) {
        await locationStore.fetchLocations({ page: 1, 'items-per-page': 100 })
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
                    <form @submit.prevent="onSubmit" class="grid grid-cols-1  gap-2 sm:gap-4 md:min-w-100 w-full">
                        <div>
                            <p>{{ t('labels.locations') }}<span class="text-red-500"> *</span></p>

                            <Select
                                v-model="location"
                                :options="locationStore.getLocations.models"
                                option-label="name"
                                option-value="id"
                                :placeholder="t('placeholders.select.location')"
                                showClear
                                size="large"
                                pt:root="w-full dark:bg-surface-700"
                            />
                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.location }}</Message>
                        </div>
                        <div>
                            <p>{{ t('labels.dateTo') }}<span class="text-red-500"> *</span></p>

                            <DatePicker
                                v-model.trim="dateTo"
                                dateFormat="dd.mm.yy"
                                showIcon
                                fluid
                                iconDisplay="input"
                                :placeholder="t('placeholders.date')"
                                show-button-bar
                                size="large"
                                :minDate="dateFrom"
                                showTime
                                hourFormat="24"
                            />

                            <Message class="h-5" size="small" severity="error" variant="simple">{{ errors.dateTo }}</Message>
                        </div>

                        <div class="flex justify-end gap-2 mt-5 col-span-1">
                            <SecondaryButton type="button" :label="t('dialog.clear')" @click="resetForm" />
                            <Button type="submit" :label="t('dialog.confirm')" class="px-5" :loading="isSubmitting"/>
                        </div>
                    </form>
                </template>
            </Card>
        </template>
    </Section>
</template>
