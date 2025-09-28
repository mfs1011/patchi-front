import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useInventoryStore = defineStore('inventory', () => {
    const state = reactive({
        inventories: {
            models: [],
            totalItems: 0,
            isAccept: false
        },
        inventory: {
            inventoryProducts: [],
            inventoryKits: []
        },
        isLoadingInventories: false,
        lastInventoryDateTo: null,
        hasInventory: false
    })

    const pushInventory = async inventoryData => {
        try {
            const { data } = await authorizedClient.post('/inventories', inventoryData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putInventory = async (inventoryData, id) => {
        try {
            const { data } = await authorizedClient.put(`/inventories/${id}`, inventoryData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putInventoryStatus = async (inventoryData, id) => {
        try {
            const { data } = await authorizedClient.put(`/inventories/status/${id}`, inventoryData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchInventories = async (params = { page: 1 }) => {
        try {
            state.isLoadingInventories = true

            const { data } = await authorizedClient.get('/inventories', { params })
            state.inventories.models = data.member
            state.inventories.totalItems = data.totalItems
            state.inventories.isAccept = data.isAccept

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingInventories = false
        }
    }

    const fetchInventory = async id => {
        try {
            state.isLoadingInventories = true

            const { data } = await authorizedClient.get(`/inventories/${id}`)
            state.inventory = data

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingInventories = false
        }
    }

    const fetchLastDateToByLocation = async location => {
        try {
            const { data } = await authorizedClient.post(`/inventories/check`, location)
            state.lastInventoryDateTo = data

            return data
        } catch (error) {
            throw error
        }
    }

    const fetchHasInventory = async location => {
        try {
            const { data } = await authorizedClient.post(`/inventories/has_inventory`, location)
            state.hasInventory = data.hasInventory

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        pushInventory,
        putInventory,
        putInventoryStatus,
        fetchInventories,
        fetchInventory,
        fetchLastDateToByLocation,
        fetchHasInventory,
        getInventories: computed(() => state.inventories),
        getInventory: computed(() => state.inventory),
        getIsLoadingInventories: computed(() => state.isLoadingInventories),
        getLastInventoryDateTo: computed(() => state.lastInventoryDateTo),
        getHasInventory: computed(() => state.hasInventory)
    }
})
