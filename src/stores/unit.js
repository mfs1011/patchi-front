import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useUnitStore = defineStore('unit', () => {
    const state = reactive({
        units: {
            models: [],
            totalItems: 0,
        },
        unit: {},
        isLoadingUnits: false
    })

    const fetchUnits = async (params = { page: 1 }) => {
        try {
            state.isLoadingUnits = true

            const { data } = await authorizedClient.get('/units', { params });
            state.units.models = data.member
            state.units.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingUnits = false
        }
    }

    const fetchUnit = async id => {
        try {
            const { data } = await authorizedClient.get(`/units/${id}`)
            state.category = data

            return data
        } catch (error) {
            throw error
        }
    }
    return {
        fetchUnits,
        fetchUnit,
        getUnits: computed(() => state.units),
        getUnit: computed(() => state.unit),
        getIsLoadingUnit: computed(() => state.isLoadingUnits),
    }
})
