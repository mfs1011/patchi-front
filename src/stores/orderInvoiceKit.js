import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useOrderInvoiceKitStore = defineStore('orderInvoiceKit', () => {
    const state = reactive({
        orderInvoiceKits: {
            models: [],
            totalItems: 0
        },
        isLoadingOrderInvoiceKits: false,
    })

    const fetchOrderInvoiceKits = async (params = { page: 1 }) => {
        try {
            state.isLoadingOrderInvoiceKits = true

            const { data } = await authorizedClient.get('/order_invoice_kits', { params: { ...params}})
            state.orderInvoiceKits.models = data.member
            state.orderInvoiceKits.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingOrderInvoiceKits = false
        }
    }

    return {
        fetchOrderInvoiceKits,
        getOrderInvoiceKits: computed(() => state.orderInvoiceKits),
        getIsLoadingOrderInvoiceKits: computed(() => state.isLoadingOrderInvoiceKits),
    }
})
