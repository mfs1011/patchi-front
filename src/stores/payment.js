import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const usePaymentStore = defineStore('payment', () => {
    const state = reactive({
        payments: {
            models: [],
            totalItems: 0,
        },
        payment: {},
        isLoadingPayments: false,
    })

    const pushPayment = async paymentData => {
        try {
            const { data } = await authorizedClient.post('/payments', paymentData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putPayment = async (paymentData, id) => {
        try {
            const { data } = await authorizedClient.put(`/payments/${id}`, paymentData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchPayments = async (params = { page: 1 }) => {
        try {
            state.isLoadingPayments = true

            const { data } = await authorizedClient.get('/payments', { params })
            state.payments.models = data.member
            state.payments.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingPayments = false
        }
    }

    const fetchPayment = async id => {
        try {
            const { data } = await authorizedClient.get(`/payments/${id}`)
            state.payment = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deletePayment = async id => {
        try {
            await authorizedClient.put(`/payments/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const restorePayment = async id => {
        try {
            await authorizedClient.put(`/payments/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushPayment,
        putPayment,
        fetchPayments,
        fetchPayment,
        deletePayment,
        restorePayment,
        getPayments: computed(() => state.payments),
        getPayment: computed(() => state.payment),
        getIsLoadingPayments: computed(() => state.isLoadingPayments),
    }
})
