import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useNotificationDayStore = defineStore('notificationDay', () => {
    const state = reactive({
        notificationDays: {
            models: [],
            totalItems: 0,
        },
        notificationDay: {},
        isLoadingNotificationDays: false,
    })

    const pushNotificationDay = async notificationDayData => {
        try {
            const { data } = await authorizedClient.post('/notification_days', notificationDayData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putNotificationDay = async (notificationDayData, id) => {
        try {
            const { data } = await authorizedClient.put(`/notification_days/${id}`, notificationDayData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchNotificationDays = async (params = { page: 1 }) => {
        try {
            state.isLoadingNotificationDays = true

            const { data } = await authorizedClient.get('/notification_days', { params })
            state.notificationDays.models = data.member
            state.notificationDays.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingNotificationDays = false
        }
    }

    const fetchNotificationDay = async id => {
        try {
            const { data } = await authorizedClient.get(`/notification_days/${id}`)
            state.notificationDay = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteNotificationDay = async id => {
        try {
            await authorizedClient.put(`/notification_days/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const restoreNotificationDay = async id => {
        try {
            await authorizedClient.put(`/notification_days/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushNotificationDay,
        putNotificationDay,
        fetchNotificationDays,
        fetchNotificationDay,
        deleteNotificationDay,
        restoreNotificationDay,
        getNotificationDays: computed(() => state.notificationDays),
        getNotificationDay: computed(() => state.notificationDay),
        getIsLoadingNotificationDays: computed(() => state.isLoadingNotificationDays),
    }
})
