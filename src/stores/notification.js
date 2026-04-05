import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useNotificationStore = defineStore('notification', () => {
    const state = reactive({
        notifications: {
            models: [],
            totalItems: 0,
            pagesCount: 0
        },

        isLoadingNotifications: false
    })

    const fetchNotifications = async (params = { page: 1 }) => {
        try {
            state.isLoadingNotifications = true

            const { data } = await authorizedClient.get('/notifications', { params });
            state.notifications.models = data.member
            state.notifications.totalItems = data.totalItems
            state.notifications.pagesCount = data.pagesCount

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingNotifications = false
        }
    }

    const acceptNotification = async id => {
        try {
            await authorizedClient.put(`/notifications/accepted/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const acceptAllNotifications = async notifications => {
        try {
            const { data } = await authorizedClient.post('/notifications/accepted/all', notifications)

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        fetchNotifications,
        acceptNotification,
        acceptAllNotifications,
        getNotifications: computed(() => state.notifications),
        getIsLoadingNotifications: computed(() => state.isLoadingNotifications),
    }
})
