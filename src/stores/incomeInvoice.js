import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useIncomeInvoiceStore = defineStore('incomeInvoice', () => {
    const state = reactive({
        incomeInvoices: {
            models: [],
            totalItems: 0,
            totalPrice: 0,
        },
        incomeInvoice: {},
        isLoadingIncomeInvoices: false,
    })

    const pushIncomeInvoice = async incomeInvoiceData => {
        try {
            const { data } = await authorizedClient.post('/income_invoices', incomeInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putIncomeInvoice = async (incomeInvoiceData, id) => {
        try {
            const { data } = await authorizedClient.put(`/income_invoices/${id}`, incomeInvoiceData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchIncomeInvoices = async (params = { page: 1 }, isB2B = true) => {
        try {
            state.isLoadingIncomeInvoices = true

            const { data } = await authorizedClient.get('/income_invoices', { params: { ...params, 'is-b2b': isB2B}})
            state.incomeInvoices.models = data.member
            state.incomeInvoices.totalItems = data.totalItems
            state.incomeInvoices.totalPrice = data.totalPrice

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingIncomeInvoices = false
        }
    }

    const fetchIncomeInvoice = async id => {
        try {
            const { data } = await authorizedClient.get(`/income_invoices/${id}`)
            state.incomeInvoice = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteIncomeInvoice = async id => {
        try {
            await authorizedClient.put(`/income_invoices/delete/${id}`, {})
        } catch (error) {
            throw error
        }
    }

    const restoreIncomeInvoice = async id => {
        try {
            await authorizedClient.put(`/income_invoices/restore/${id}`, {})
        } catch (error) {
            throw error
        }
    }

    return {
        pushIncomeInvoice,
        putIncomeInvoice,
        fetchIncomeInvoices,
        fetchIncomeInvoice,
        deleteIncomeInvoice,
        restoreIncomeInvoice,
        getIncomeInvoices: computed(() => state.incomeInvoices),
        getIncomeInvoice: computed(() => state.incomeInvoice),
        getIsLoadingIncomeInvoices: computed(() => state.isLoadingIncomeInvoices),
    }
})
