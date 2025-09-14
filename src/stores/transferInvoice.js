import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useTransferInvoiceStore = defineStore('transferInvoice', () => {
    const state = reactive({
        transferInvoices: {
            models: [],
            totalItems: 0,
            totalPrice: 0,
        },
        transferInvoice: {},
        isLoadingTransferInvoices: false,
    })

    const pushTransferInvoice = async transferInvoiceData => {
        try {
            const { data } = await authorizedClient.post('/transfer_invoices', transferInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putTransferInvoice = async (transferInvoiceData, id) => {
        try {
            const { data } = await authorizedClient.put(`/transfer_invoices/${id}`, transferInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchTransferInvoices = async (params = { page: 1 }) => {
        try {
            state.isLoadingTransferInvoices = true

            const { data } = await authorizedClient.get('/transfer_invoices', { params: { ...params}})
            state.transferInvoices.models = data.member
            state.transferInvoices.totalItems = data.totalItems
            state.transferInvoices.totalPrice = data.totalPrice

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingTransferInvoices = false
        }
    }

    const fetchTransferInvoice = async id => {
        try {
            const { data } = await authorizedClient.get(`/transfer_invoices/${id}`)
            state.transferInvoice = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteTransferInvoice = async id => {
        try {
            await authorizedClient.put(`/transfer_invoices/deleted/${id}`, {})
        } catch (error) {
            throw error
        }
    }

    const acceptTransferInvoice = async id => {
        try {
            await authorizedClient.put(`/transfer_invoices/accepted/${id}`, {})
        } catch (error) {
            throw error
        }
    }

    return {
        pushTransferInvoice,
        putTransferInvoice,
        fetchTransferInvoices,
        fetchTransferInvoice,
        deleteTransferInvoice,
        acceptTransferInvoice,
        getTransferInvoices: computed(() => state.transferInvoices),
        getTransferInvoice: computed(() => state.transferInvoice),
        getIsLoadingTransferInvoices: computed(() => state.isLoadingTransferInvoices),
    }
})
