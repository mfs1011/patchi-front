import { defineStore } from "pinia";
import { authorizedClient } from "@/api/axios.js";

export const useInventoryProductStore = defineStore('inventoryProduct', () => {
    const putInventoryProduct = async (inventoryData, id) => {
        try {
            const { data } = await authorizedClient.put(`/inventory_products/${id}`, inventoryData)
            return data
        } catch (error) {
            throw error
        }
    }

    return {
        putInventoryProduct,
    }
})
