import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useCustomerStore = defineStore('customer', () => {
    const state = reactive({
        customers: {
            models: [],
            totalItems: 0,
        },
        customer: {},
        isLoadingCustomers: false,
    })

    const pushCustomer = async customerData => {
        try {
            const { data } = await authorizedClient.post('/customers', customerData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putCustomer = async (customerData, id) => {
        try {
            const { data } = await authorizedClient.put(`/customers/${id}`, customerData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchCustomers = async (params = { page: 1 }, isB2B = true) => {
        try {
            state.isLoadingCustomers = true

            const { data } = await authorizedClient.get('/customers', { params: { ...params, 'is-b2b': isB2B}})
            state.customers.models = data.member
            state.customers.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingCustomers = false
        }
    }

    const fetchCustomer = async id => {
        try {
            const { data } = await authorizedClient.get(`/customers/${id}`)
            state.customer = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteCustomer = async id => {
        try {
            await authorizedClient.put(`/customers/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const restoreCustomer = async id => {
        try {
            await authorizedClient.put(`/customers/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushCustomer,
        putCustomer,
        fetchCustomers,
        fetchCustomer,
        deleteCustomer,
        restoreCustomer,
        getCustomers: computed(() => state.customers),
        getCustomer: computed(() => state.customer),
        getIsLoadingCustomers: computed(() => state.isLoadingCustomers),
    }
})
