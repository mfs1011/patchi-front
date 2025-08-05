import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useLocationQuantityKitStore = defineStore('locationQuantityKit', () => {
    const state = reactive({
        locationQuantityKits: {
            models: [],
            totalItems: 0,
            totalCostPrice: 0,
            totalQty: 0,
            totalRetailPrice: 0,
            totalWholesalePrice: 0,
        },
        locationQuantityKit: {},
        isLoadingLocationQuantityKits: false
    })

    const fetchLocationQuantityKits = async (params = { page: 1 }) => {
        try {
            state.isLoadingLocationQuantityKits = true

            const { data } = await authorizedClient.get('/location_quantity_kits', { params });
            state.locationQuantityKits.models = data.member
            state.locationQuantityKits.totalItems = data.totalItems
            state.locationQuantityKits.totalCostPrice = data.totalCostPrice
            state.locationQuantityKits.totalQty = data.totalQty
            state.locationQuantityKits.totalRetailPrice = data.totalRetailPrice
            state.locationQuantityKits.totalWholesalePrice = data.totalWholesalePrice

            return data
        } catch (error) {
            console.error(error)
            throw error
        } finally {
            state.isLoadingLocationQuantityKits = false
        }
    }

    const fetchLocationQuantityKit = async id => {
        try {
            const { data } = await authorizedClient.get(`/location_quantity_kits/${id}`)
            state.locationQuantityKit = data

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        fetchLocationQuantityKits,
        fetchLocationQuantityKit,
        getLocationQuantityKits: computed(() => state.locationQuantityKits),
        getLocationQuantityKit: computed(() => state.locationQuantityKit),
        getIsLoadingLocationQuantityKit: computed(() => state.isLoadingLocationQuantityKits),
    }
})
