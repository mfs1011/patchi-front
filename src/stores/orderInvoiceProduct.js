import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useOrderInvoiceProductStore = defineStore('orderInvoiceProduct', () => {
    const state = reactive({
        orderInvoiceProducts: {
            models: [],
            totalItems: 0
        },
        isLoadingOrderInvoiceProducts: false,
    })

    const fetchOrderInvoiceProducts = async (params = { page: 1 }) => {
        try {
            state.isLoadingOrderInvoiceProducts = true

            const { data } = await authorizedClient.get('/order_invoice_products', { params: { ...params}})
            state.orderInvoiceProducts.models = data.member
            state.orderInvoiceProducts.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingOrderInvoiceProducts = false
        }
    }

    return {
        fetchOrderInvoiceProducts,
        getOrderInvoiceProducts: computed(() => state.orderInvoiceProducts),
        getIsLoadingOrderInvoiceProducts: computed(() => state.isLoadingOrderInvoiceProducts),
    }
})
