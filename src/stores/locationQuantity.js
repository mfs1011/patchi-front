import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useLocationQuantityStore = defineStore('locationQuantity', () => {
    const state = reactive({
        locationQuantities: {
            models: [],
            totalItems: 0,
            totalCostPrice: 0,
            totalQtyKg: 0,
            totalQtyPcs: 0,
            totalRetailPrice: 0,
            totalWholesalePrice: 0,
        },
        locationQuantity: {},
        isLoadingLocationQuantities: false
    })

    const fetchLocationQuantities = async (params = { page: 1 }) => {
        try {
            state.isLoadingLocationQuantities = true

            const { data } = await authorizedClient.get('/location_quantities', { params });
            state.locationQuantities.models = data.member
            state.locationQuantities.totalItems = data.totalItems
            state.locationQuantities.totalCostPrice = data.totalCostPrice
            state.locationQuantities.totalQtyKg = data.totalQtyKg
            state.locationQuantities.totalQtyPcs = data.totalQtyPcs
            state.locationQuantities.totalRetailPrice = data.totalRetailPrice
            state.locationQuantities.totalWholesalePrice = data.totalWholesalePrice

            return data
        } catch (error) {
            console.error(error)
            throw error
        } finally {
            state.isLoadingLocationQuantities = false
        }
    }

    const fetchLocationQuantity = async id => {
        try {
            const { data } = await authorizedClient.get(`/location_quantities/${id}`)
            state.locationQuantity = data

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        fetchLocationQuantities,
        fetchLocationQuantity,
        getLocationQuantities: computed(() => state.locationQuantities),
        getLocationQuantity: computed(() => state.locationQuantity),
        getIsLoadingLocationQuantity: computed(() => state.isLoadingLocationQuantities),
    }
})
