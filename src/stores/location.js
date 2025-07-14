import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useLocationStore = defineStore('location', () => {
    const state = reactive({
        locations: {
            models: [],
            totalItems: 0,
        },
        location: {},
        isLoadingLocations: false
    })

    const pushLocation = async (locationData) => {
        try {
            const { data } = await authorizedClient.post('/locations', locationData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putLocation = async (locationData, id) => {
        try {
            const { data } = await authorizedClient.put(`/locations/${id}`, locationData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchLocations = async (params = { page: 1 }) => {
        try {
            const { data } = await authorizedClient.get('/locations', { params });
            state.locations.models = data.member
            state.locations.totalItems = data.totalItems

            return data
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    const fetchLocation = async id => {
        try {
            const { data } = await authorizedClient.get(`/locations/${id}`)
            state.location = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteLocation = async id => {
        try {
            const { data } = await authorizedClient.put(`/locations/delete/${id}`, JSON.stringify({}))
            return data
        } catch (error) {
            throw error
        }
    }

    const restoreLocation = async id => {
        try {
            await authorizedClient.put(`/locations/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushLocation,
        putLocation,
        fetchLocations,
        fetchLocation,
        deleteLocation,
        restoreLocation,
        getLocations: computed(() => state.locations),
        getLocation: computed(() => state.location),
        getIsLoadingLocation: computed(() => state.isLoadingLocations),
    }
})
