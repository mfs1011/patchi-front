<template>
    <Popover v-slot="{close: closePopover}" class="sm:relative inline-flex">
        <PopoverButton class="inline-flex relative outline-none items-center gap-x-1 text-sm/6 font-semibold text-gray-900">
            <BaseIcon icon="bell" size="24px" class="text-blackColor dark:text-surface-0 shrink-0"/>
            <span
                v-show="notificationStore.getNotifications.totalItems > 0"
                class="absolute text-white ring-1 ring-white text-[10px] font-roboto-medium flex items-center justify-center bg-red-500 rounded-full"
                :class="{
                    'size-5 -right-2 -top-2': notificationStore.getNotifications.totalItems > 99,
                    'size-4 -right-1 -top-1': notificationStore.getNotifications.totalItems <= 99
                }"
            >
                {{ notificationStore.getNotifications.totalItems > 99 ? '+99' : notificationStore.getNotifications.totalItems }}
            </span>

        </PopoverButton>

        <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
            <PopoverPanel class="absolute right-0 sm:left-1/2 z-30 mt-9 flex w-screen max-w-max sm:-translate-x-1/2 px-4">
                <div class="w-screen ml-auto max-h-[30rem] overflow-auto sm:w-screen max-w-sm flex-auto rounded-xl bg-surface-0 p-4 text-sm/6 shadow-lg ring-1 ring-gray-900/5">
                    <div
                        v-if="notificationStore.getNotifications.totalItems"
                        v-for="notification in allNotifications"
                        :key="notification.id"
                        class="relative flex items-start gap-2 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                        @click="acceptAction(notification.id, closePopover)"
                    >
                        <div class="size-2 mt-0.5 shrink-0 bg-red-500 rounded-full"></div>
                        <div class="w-full dark:text-black">
                            <div class="flex items-center justify-between">
                                <div v-if="notification.user" class="text-sm text-blackColor font-roboto-medium leading-none">
                                    <span>{{notification.user.name}}</span>
                                </div>
                                <div v-if="notification.product" class="text-sm text-blackColor font-roboto-medium leading-none">
                                    <span>{{notification.product.name}}</span>
                                </div>
                                <div v-if="notification.kit" class="text-sm text-blackColor font-roboto-medium leading-none">
                                    <span>{{notification.kit.name}}</span>
                                </div>
                                <div class="text-gray-500 leading-none text-right">{{ getFormattedDateWithTime(notification.createdAt) }}</div>
                            </div>

                            <div class="mt-2.5">
                                <div class="text-sm text-greenColor bg-greenColor/20 flex items-center justify-center w-fit rounded-md py-1.5 h-fit">
                                    {{ notification.message }}
                                </div>
                            </div>

                        </div>
                    </div>
                    <div v-else class="text-gray-500 text-center">
                        {{ t("noResults") }}
                    </div>

                    <div v-if="filterProps.page < notificationStore.getNotifications.pagesCount" class="pb-2 pt-3 flex items-center justify-center">
                        <div v-if="isLoading" class="flex">
                            <BaseIcon icon="spinner" size="24px" class="text-gray-500 animate-spin shrink-0"/>
                        </div>
                        <button v-if="!isLoading" @click="nextPage" class="rounded-full ring-2 ring-gray-700 p-1 hover:opacity-80 transition-colors">
                            <BaseIcon icon="plus" size="12px" class="text-gray-700"/>
                        </button>
                    </div>
                </div>
            </PopoverPanel>
        </transition>

        <Dialog
            v-model:visible="acceptVisible"
            modal
            :closable="false"
            class="sm:min-w-100 sm:w-fit w-9/10"
            pt:root="px-2"
        >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.acceptConfirmation', { name: t('notification.accusative'), id: currentNotificationId }) }}
                </span>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <SecondaryButton
                        type="button"
                        :label="t('dialog.cancel')"
                        @click="acceptVisible = false"
                    />
                    <Button
                        type="button"
                        :label="t('dialog.confirm')"
                        @click="acceptNotification"
                        :loading="isAcceptLoading"
                        class="px-5"
                    />
                </div>
            </template>
        </Dialog>
    </Popover>
</template>

<script setup>
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import BaseIcon from "@/components/UI/base-icon/BaseIcon.vue";
import {onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {useNotificationStore} from "@/stores/notification.js";
import {getFormattedDateWithTime} from "@/helpers/numberFormat.js";
import Dialog from "@/volt/Dialog.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import Button from "@/volt/Button.vue";
import {useToast} from "primevue/usetoast";

const toast = useToast()
const { locale } = useI18n();
const {t} = useI18n()
const route = useRoute();
const notificationStore = useNotificationStore()

const isLoading = ref(false)
const currentNotificationId = ref(null)
const acceptVisible = ref(false)
const isAcceptLoading = ref(false)
const allNotifications = ref([])

const acceptAction = async (id, closePopover) => {
    currentNotificationId.value = id
    acceptVisible.value = true

    closePopover()
}

const acceptNotification = async () => {
    isAcceptLoading.value = true;

    try {
        await notificationStore.acceptNotification(currentNotificationId.value)
        toast.add({ severity: 'success', summary: t('toast.accepted', { name: t('notification.nominativeCapitalize') }), life: 3000 })
    } catch (error) {
        toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
    } finally {
        isAcceptLoading.value = false;
        acceptVisible.value = false;
    }
}

const filterProps = reactive({
    page: 1,
    itemsPerPage: parseInt(route.query["items-per-page"]) || 20,
    locale: locale.value
})

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 21) {
            filterProps.page = 1
            await notificationStore.fetchNotifications(filterProps);
            allNotifications.value = []
            allNotifications.value.push(...notificationStore.getNotifications.models)
        }
    })
}

const nextPage = async () => {
    filterProps.page += 1;
    await notificationStore.fetchNotifications(filterProps);
    allNotifications.value.push(...notificationStore.getNotifications.models)
};

onMounted(async() => {
    connectMercure()
    await notificationStore.fetchNotifications(filterProps);
    allNotifications.value.push(...notificationStore.getNotifications.models)
})

watch(
    () => locale.value,
    async (newLocale) => {
        filterProps.page = 1
        filterProps.locale = newLocale
        await notificationStore.fetchNotifications(filterProps);
        allNotifications.value = []
        allNotifications.value.push(...notificationStore.getNotifications.models)
    }
);

onBeforeUnmount(() => {
    if (eventSource.value) {
        eventSource.value.close()
    }
})
</script>
