import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useLocationStore = defineStore('location', () => {
    const state = reactive({
        locations: {
            models: [],
            totalItems: 0,
        }
    })

    const fetchLocations = async (params = { page: 1 }) => {
        try {
            const { data } = await authorizedClient.get('/locations', { params });
            state.locations.models = data['hydra:member']
            state.locations.totalItems = data['hydra:totalItems']

            return data
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    return {
        fetchLocations,
        getLocations: computed(() => state.locations),
    }
})
