import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useSupplierStore = defineStore('supplier', () => {
    const state = reactive({
        suppliers: {
            models: [],
            totalItems: 0,
        },
        supplier: {},
        isLoadingSuppliers: false,
    })

    const pushSupplier = async supplierData => {
        try {
            const { data } = await authorizedClient.post('/suppliers', supplierData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putSupplier = async (supplierData, id) => {
        try {
            const { data } = await authorizedClient.put(`/suppliers/${id}`, supplierData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchSuppliers = async (params = { page: 1 }) => {
        try {
            state.isLoadingSuppliers = true

            const { data } = await authorizedClient.get('/suppliers', { params })
            state.suppliers.models = data.member
            state.suppliers.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingSuppliers = false
        }
    }

    const fetchSupplier = async id => {
        try {
            const { data } = await authorizedClient.get(`/suppliers/${id}`)
            state.supplier = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteSupplier = async id => {
        try {
            await authorizedClient.put(`/suppliers/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const restoreSupplier = async id => {
        try {
            await authorizedClient.put(`/suppliers/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushSupplier,
        putSupplier,
        fetchSuppliers,
        fetchSupplier,
        deleteSupplier,
        restoreSupplier,
        getSuppliers: computed(() => state.suppliers),
        getSupplier: computed(() => state.supplier),
        getIsLoadingSuppliers: computed(() => state.isLoadingSuppliers),
    }
})
