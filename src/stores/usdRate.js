import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useUSDRateStore = defineStore('usdRate', () => {
    const state = reactive({
        usdRates: {
            models: [],
            totalItems: 0,
        },
        usdRate: {},
        isLoadingUSDRates: false
    })

    const fetchUSDRates = async (params = { page: 1 }) => {
        try {
            state.isLoadingUSDRates = true

            const { data } = await authorizedClient.get('/usd_rates', { params });
            state.usdRates.models = data.member
            state.usdRates.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingUSDRates = false
        }
    }

    const fetchUSDRate = async id => {
        try {
            const { data } = await authorizedClient.get(`/usd_rates/${id}`)
            state.usdRate = data

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        fetchUSDRates,
        fetchUSDRate,
        getUSDRates: computed(() => state.usdRates),
        getUSDRate: computed(() => state.usdRate),
        getIsLoadingUSDRate: computed(() => state.isLoadingUSDRates),
    }
})
