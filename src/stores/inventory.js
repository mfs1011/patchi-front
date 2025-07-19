import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useInventoryStore = defineStore('inventory', () => {
    const state = reactive({
        inventories: {
            models: [],
            totalItems: 0,
        },
        inventory: {},
        isLoadingInventories: false,
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

    const fetchInventories = async (params = { page: 1 }) => {
        try {
            state.isLoadingInventories = true

            const { data } = await authorizedClient.get('/inventories', { params })
            state.inventories.models = data.member
            state.inventories.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingInventories = false
        }
    }

    const fetchInventory = async id => {
        try {
            const { data } = await authorizedClient.get(`/inventories/${id}`)
            state.inventory = data

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        pushInventory,
        putInventory,
        fetchInventories,
        fetchInventory,
        getInventories: computed(() => state.inventories),
        getInventory: computed(() => state.inventory),
        getIsLoadingInventories: computed(() => state.isLoadingInventories),
    }
})
