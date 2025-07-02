import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useSellerStore = defineStore('seller', () => {
    const state = reactive({
        sellers: {
            models: [],
            totalItems: 0,
        },
        seller: {},
        isLoadingSellers: false,
    })

    const pushSeller = async sellerData => {
        try {
            const { data } = await authorizedClient.post('/sellers', sellerData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchSellers = async (params = { page: 1 }) => {
        try {
            state.isLoadingSellers = true

            const { data } = await authorizedClient.get('/sellers', { params })
            state.sellers.models = data.member
            state.sellers.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingSellers = false
        }
    }

    const fetchSeller = async id => {
        try {
            const { data } = await authorizedClient.get(`/sellers/${id}`)
            state.seller = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteSeller = async id => {
        try {
            await authorizedClient.put(`/sellers/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const restoreSeller = async id => {
        try {
            await authorizedClient.put(`/sellers/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushSeller,
        fetchSellers,
        fetchSeller,
        deleteSeller,
        restoreSeller,
        getSellers: computed(() => state.sellers),
        getSeller: computed(() => state.seller),
        getIsLoadingSellers: computed(() => state.isLoadingSellers),
    }
})
