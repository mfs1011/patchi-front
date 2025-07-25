<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {computed, onMounted} from "vue";
import Button from "@/volt/Button.vue";
import NoData from "@/components/UI/NoData.vue";
import Card from "@/volt/Card.vue";
import DataTable from "@/volt/DataTable.vue";
import Column from "primevue/column";
import {useRouter} from "vue-router";
import Skeleton from "@/volt/Skeleton.vue";
import {useNotificationDayStore} from "@/stores/expiryDateNotificationDay.js";

const router = useRouter();
const { t } = useI18n();

const notificationDayStore = useNotificationDayStore()

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("administration"),
    route: "/administration",
}));
const items = computed(() => [{ label: t("cards.expiryDateNotificationDay") }]);

onMounted(() => {
    notificationDayStore.fetchNotificationDays();
})
</script>

<template>
    <Breadcrumb
        :home="home"
        :model="items"
        class="mb-2 sm:mb-4 rounded-md border border-surface-300 dark:border-surface-600/50"
    >
        <template #item="{ item, props }">
            <router-link
                v-if="item.route"
                v-slot="{ href, navigate }"
                :to="item.route"
                custom
                class="group"
            >
                <a :href="href" v-bind="props.action" @click="navigate">
                    <span class="text-surface-700 dark:text-surface-0 group-hover:text-main dark:group-hover:text-green transition-all">
                        {{ item.label }}
                    </span>
                </a>
            </router-link>
            <a v-else :href="item.url" :target="item.target" v-bind="props.action">
                <span class="text-main dark:text-green font-semibold">{{ item.label }}</span>
            </a>
        </template>
        <template #separator>
            <span class="text-primary">/</span>
        </template>
    </Breadcrumb>

    <Section
        without-buttons
        :section-name="t('cards.expiryDateNotificationDay')"
        back-route-name="notification-day"
    >
        <template #sectionBody>
            <NoData v-if="!notificationDayStore.getNotificationDays.totalItems && !notificationDayStore.getIsLoadingNotificationDays" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                v-if="notificationDayStore.getIsLoadingNotificationDays || notificationDayStore.getNotificationDays.totalItems > 0"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        :value="notificationDayStore.getIsLoadingNotificationDays ?  Array(10).fill({}) : notificationDayStore.getNotificationDays.models"
                        :total-records="notificationDayStore.getNotificationDays.totalItems"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="notificationDayStore.getIsLoadingNotificationDays"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="day" :header="t('labels.notificationDay')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="notificationDayStore.getIsLoadingNotificationDays"/>
                                <p v-else>{{ data.day }} {{ t('day') }}</p>
                            </template>
                        </Column>
                        <Column field="id" class="flex justify-end">
                            <template #header>
                                <p class="font-semibold">{{ t('actions') }}</p>
                            </template>
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="notificationDayStore.getIsLoadingNotificationDays"/>
                                <div v-else>
                                    <div class="flex items-center gap-2">
                                        <Button
                                            @click="router.push({
                                                name: 'edit-expiry-date-notification-day',
                                                params: { id: data.id },
                                            })"
                                            icon="pi pi-pencil"
                                            pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
