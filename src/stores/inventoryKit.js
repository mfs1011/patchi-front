import { defineStore } from "pinia";
import { authorizedClient } from "@/api/axios.js";

export const useInventoryKitStore = defineStore('inventoryKit', () => {
    const putInventoryKit = async (inventoryData, id) => {
        try {
            const { data } = await authorizedClient.put(`/inventory_kits/${id}`, inventoryData)
            return data
        } catch (error) {
            throw error
        }
    }

    return {
        putInventoryKit,
    }
})
