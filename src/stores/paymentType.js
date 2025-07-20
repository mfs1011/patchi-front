import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const usePaymentTypeStore = defineStore('paymentType', () => {
    const state = reactive({
        paymentTypes: {
            models: [],
            totalItems: 0,
        },
        createPaymentTypes: {
            models: [],
            totalItems: 0,
        },
        paymentType: {},
        isLoadingPaymentTypes: false,
    })

    const pushPaymentType = async paymentTypeData => {
        try {
            const { data } = await authorizedClient.post('/payment_types', paymentTypeData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putPaymentType = async (paymentTypeData, id) => {
        try {
            const { data } = await authorizedClient.put(`/payment_types/${id}`, paymentTypeData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchPaymentTypes = async (params = { page: 1 }) => {
        try {
            state.isLoadingPaymentTypes = true

            const { data } = await authorizedClient.get('/payment_types', { params })
            state.paymentTypes.models = data.member
            state.paymentTypes.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingPaymentTypes = false
        }
    }

    const fetchCreatePaymentTypes = async (params = { page: 1 }) => {
        try {
            state.isLoadingPaymentTypes = true

            const { data } = await authorizedClient.get('/payment-types/payment-create', { params })
            state.createPaymentTypes.models = data.member
            state.createPaymentTypes.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingPaymentTypes = false
        }
    }

    const fetchPaymentType = async id => {
        try {
            const { data } = await authorizedClient.get(`/payment_types/${id}`)
            state.paymentType = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deletePaymentType = async id => {
        try {
            await authorizedClient.put(`/payment_types/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const restorePaymentType = async id => {
        try {
            await authorizedClient.put(`/payment_types/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushPaymentType,
        putPaymentType,
        fetchPaymentTypes,
        fetchCreatePaymentTypes,
        fetchPaymentType,
        deletePaymentType,
        restorePaymentType,
        getPaymentTypes: computed(() => state.paymentTypes),
        getCreatePaymentTypes: computed(() => state.createPaymentTypes),
        getPaymentType: computed(() => state.paymentType),
        getIsLoadingPaymentTypes: computed(() => state.isLoadingPaymentTypes),
    }
})
