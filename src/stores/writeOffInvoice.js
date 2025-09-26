import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useWriteOffInvoiceStore = defineStore('writeOffInvoice', () => {
    const state = reactive({
        writeOffInvoices: {
            models: [],
            totalItems: 0,
            totalCostPrice: 0,
        },
        writeOffInvoice: {},
        isLoadingWriteOffInvoices: false,
    })

    const pushWriteOffInvoice = async writeOffInvoiceData => {
        try {
            const { data } = await authorizedClient.post('/write_off_invoices', writeOffInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putWriteOffInvoice = async (writeOffInvoiceData, id) => {
        try {
            const { data } = await authorizedClient.put(`/write_off_invoices/${id}`, writeOffInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchWriteOffInvoices = async (params = { page: 1 }) => {
        try {
            state.isLoadingReturnInvoices = true

            const { data } = await authorizedClient.get('/write_off_invoices', { params: { ...params}})
            state.writeOffInvoices.models = data.member
            state.writeOffInvoices.totalItems = data.totalItems
            state.writeOffInvoices.totalCostPrice = data.totalCostPrice

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingWriteOffInvoices = false
        }
    }

    const fetchWriteOffInvoice = async id => {
        try {
            const { data } = await authorizedClient.get(`/write_off_invoices/${id}`)
            state.writeOffInvoice = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteWriteOffInvoice = async id => {
        try {
            await authorizedClient.put(`/write_off_invoices/delete/${id}`, {})
        } catch (error) {
            throw error
        }
    }

    return {
        pushWriteOffInvoice,
        putWriteOffInvoice,
        fetchWriteOffInvoices,
        fetchWriteOffInvoice,
        deleteWriteOffInvoice,
        getWriteOffInvoices: computed(() => state.writeOffInvoices),
        getWriteOffInvoice: computed(() => state.writeOffInvoice),
        getIsLoadingWriteOffInvoices: computed(() => state.isLoadingWriteOffInvoices),
    }
})
