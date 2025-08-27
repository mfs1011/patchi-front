import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useIncomeInvoiceProductStore = defineStore('incomeInvoiceProductProduct', () => {
    const state = reactive({
        incomeInvoiceProducts: {
            models: [],
            totalItems: 0,
            totalPrice: 0,
        },
        incomeInvoiceProduct: {},
        isLoadingIncomeInvoiceProducts: false,
    })

    const fetchIncomeInvoiceProducts = async (params = { page: 1 }, isB2B = true) => {
        try {
            state.isLoadingIncomeInvoiceProducts = true

            const { data } = await authorizedClient.get('/income_invoice_products', { params: { ...params, 'is-b2b': isB2B}})
            state.incomeInvoiceProducts.models = data.member
            state.incomeInvoiceProducts.totalItems = data.totalItems
            state.incomeInvoiceProducts.totalPrice = data.totalPrice

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingIncomeInvoiceProducts = false
        }
    }

    const fetchIncomeInvoiceProduct = async id => {
        try {
            const { data } = await authorizedClient.get(`/income_invoice_products/${id}`)
            state.incomeInvoiceProduct = data

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        fetchIncomeInvoiceProducts,
        fetchIncomeInvoiceProduct,
        getIncomeInvoiceProducts: computed(() => state.incomeInvoiceProducts),
        getIncomeInvoiceProduct: computed(() => state.incomeInvoiceProduct),
        getIsLoadingIncomeInvoiceProducts: computed(() => state.isLoadingIncomeInvoiceProducts),
    }
})
