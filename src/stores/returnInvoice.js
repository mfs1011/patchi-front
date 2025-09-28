import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useReturnInvoiceStore = defineStore('returnInvoice', () => {
    const state = reactive({
        returnInvoices: {
            models: [],
            totalItems: 0,
            totalPrice: 0,
        },
        returnInvoice: {},
        isLoadingReturnInvoices: false,
    })

    const pushReturnInvoice = async returnInvoiceData => {
        try {
            const { data } = await authorizedClient.post('/return_invoices', returnInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putReturnInvoice = async (returnInvoiceData, id) => {
        try {
            const { data } = await authorizedClient.put(`/return_invoices/${id}`, returnInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchReturnInvoices = async (params = { page: 1 }) => {
        try {
            state.isLoadingReturnInvoices = true

            const { data } = await authorizedClient.get('/return_invoices', { params: { ...params}})
            state.returnInvoices.models = data.member
            state.returnInvoices.totalItems = data.totalItems
            state.returnInvoices.totalPrice = data.totalPrice

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingReturnInvoices = false
        }
    }

    const fetchReturnInvoice = async id => {
        try {
            const { data } = await authorizedClient.get(`/return_invoices/${id}`)
            state.returnInvoice = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteReturnInvoice = async id => {
        try {
            await authorizedClient.put(`/return_invoices/delete/${id}`, {})
        } catch (error) {
            throw error
        }
    }

    return {
        pushReturnInvoice,
        putReturnInvoice,
        fetchReturnInvoices,
        fetchReturnInvoice,
        deleteReturnInvoice,
        getReturnInvoices: computed(() => state.returnInvoices),
        getReturnInvoice: computed(() => state.returnInvoice),
        getIsLoadingReturnInvoices: computed(() => state.isLoadingReturnInvoices),
    }
})
