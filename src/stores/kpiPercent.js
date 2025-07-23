import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useKpiPercentStore = defineStore('kpiPercent', () => {
    const state = reactive({
        kpiPercents: {
            models: [],
            totalItems: 0,
        },
        kpiPercent: {},
        isLoadingKpiPercents: false,
    })

    const pushKpiPercent = async (kpiPercentData, entity) => {
        try {
            const { data } = await authorizedClient.post(`/${entity}_kpi_percents`, kpiPercentData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putKpiPercent = async (kpiPercentData, id, entity) => {
        try {
            const { data } = await authorizedClient.put(`/${entity}_kpi_percents/${id}`, kpiPercentData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchKpiPercents = async (params = { page: 1 }, entity) => {
        try {
            state.isLoadingKpiPercents = true

            const { data } = await authorizedClient.get(`/${entity}_kpi_percents`, { params })
            state.kpiPercents.models = data.member
            state.kpiPercents.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingKpiPercents = false
        }
    }

    const fetchKpiPercent = async (id, entity) => {
        try {
            const { data } = await authorizedClient.get(`/${entity}_kpi_percents/${id}`)
            state.kpiPercent = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteKpiPercent = async (id, entity) => {
        try {
            await authorizedClient.put(`/${entity}_kpi_percents/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const restoreKpiPercent = async (id, entity) => {
        try {
            await authorizedClient.put(`/${entity}_kpi_percents/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushKpiPercent,
        putKpiPercent,
        fetchKpiPercents,
        fetchKpiPercent,
        deleteKpiPercent,
        restoreKpiPercent,
        getKpiPercents: computed(() => state.kpiPercents),
        getKpiPercent: computed(() => state.kpiPercent),
        getIsLoadingKpiPercents: computed(() => state.isLoadingKpiPercents),
    }
})
