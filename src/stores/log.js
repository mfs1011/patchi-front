import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useLogStore = defineStore('log', () => {
    const state = reactive({
        logs: {
            models: [],
            totalItems: 0,
        },
        log: {},
        isLoadingLogs: false
    })

    const fetchLogs = async (params = { page: 1 }) => {
        try {
            state.isLoadingLogs = true

            const { data } = await authorizedClient.get('/logs', { params });
            state.logs.models = data.member
            state.logs.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingLogs = false
        }
    }

    const fetchLog = async id => {
        try {
            const { data } = await authorizedClient.get(`/logs/${id}`)
            state.log = data

            return data
        } catch (error) {
            throw error
        }
    }
    return {
        fetchLogs,
        fetchLog,
        getLogs: computed(() => state.logs),
        getLog: computed(() => state.log),
        getIsLoadingLogs: computed(() => state.isLoadingLogs),
    }
})
