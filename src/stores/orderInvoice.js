import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useOrderInvoiceStore = defineStore('orderInvoice', () => {
    const state = reactive({
        orderInvoices: {
            models: [],
            totalItems: 0,
            totalPrice: 0,
        },
        orderInvoice: {},
        isLoadingOrderInvoices: false,
    })

    const pushOrderInvoice = async orderInvoiceData => {
        try {
            const { data } = await authorizedClient.post('/order_invoices', orderInvoiceData)
            state.orderInvoice = data

            return data
        } catch (error) {
            throw error
        }
    }

    const pushOrderInvoiceB2B = async orderInvoiceData => {
        try {
            const { data } = await authorizedClient.post('/order_invoices/is_b2b', orderInvoiceData)
            state.orderInvoice = data

            return data
        } catch (error) {
            throw error
        }
    }

    const putOrderInvoice = async (orderInvoiceData, id) => {
        try {
            const { data } = await authorizedClient.put(`/order_invoices/${id}`, orderInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchOrderInvoices = async (params = { page: 1 }) => {
        try {
            state.isLoadingOrderInvoices = true

            const { data } = await authorizedClient.get('/order_invoices', { params: { ...params}})
            state.orderInvoices.models = data.member
            state.orderInvoices.totalItems = data.totalItems
            state.orderInvoices.totalPrice = data.totalPrice

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingOrderInvoices = false
        }
    }

    const fetchOrderInvoice = async id => {
        try {
            const { data } = await authorizedClient.get(`/order_invoices/${id}`)
            state.orderInvoice = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteOrderInvoice = async id => {
        try {
            await authorizedClient.put(`/order_invoices/delete/${id}`, {})
        } catch (error) {
            throw error
        }
    }

    const acceptOrderInvoice = async id => {
        try {
            await authorizedClient.put(`/order_invoices/accepted/${id}`, {})
        } catch (error) {
            throw error
        }
    }

    return {
        pushOrderInvoice,
        pushOrderInvoiceB2B,
        putOrderInvoice,
        fetchOrderInvoices,
        fetchOrderInvoice,
        deleteOrderInvoice,
        acceptOrderInvoice,
        getOrderInvoices: computed(() => state.orderInvoices),
        getOrderInvoice: computed(() => state.orderInvoice),
        getIsLoadingOrderInvoices: computed(() => state.isLoadingOrderInvoices),
    }
})
