import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useProductStore = defineStore('product', () => {
    const state = reactive({
        products: {
            models: [],
            totalItems: 0,
        },
        abcProducts: {
            models: [],
            totalItems: 0,
        },
        residualProducts: {
            models: [],
            totalItems: 0,
        },
        franchiseFeeProducts: {
            models: [],
            totalItems: 0,
            totalPrice: 0,
            totalCostPrice: 0,
            totalBenefit: 0,
        },
        product: {},
        isLoadingProducts: false,
    })

    const pushProduct = async productData => {
        try {
            const { data } = await authorizedClient.post('/products', productData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putProduct = async (productData, id) => {
        try {
            const { data } = await authorizedClient.put(`/products/${id}`, productData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchProducts = async (params = { page: 1 }) => {
        try {
            state.isLoadingProducts = true

            const { data } = await authorizedClient.get('/products', { params })
            state.products.models = data.member
            state.products.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingProducts = false
        }
    }

    const fetchABCProducts = async (params = { page: 1 }) => {
        try {
            state.isLoadingProducts = true

            const { data } = await authorizedClient.get('/products/abc', { params })
            state.abcProducts.models = data.member
            state.abcProducts.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingProducts = false
        }
    }

    const fetchResidualProducts = async (params = { page: 1 }) => {
        try {
            state.isLoadingProducts = true

            const { data } = await authorizedClient.get('/products/residual', { params })
            state.residualProducts.models = data.member
            state.residualProducts.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingProducts = false
        }
    }

    const fetchFranchiseFeeProducts = async (params = { page: 1 }) => {
        try {
            state.isLoadingProducts = true

            const { data } = await authorizedClient.get('/products/franchise_fee', { params })
            state.franchiseFeeProducts.models = data.member
            state.franchiseFeeProducts.totalItems = data.totalItems
            state.franchiseFeeProducts.totalPrice = data.totalPrice
            state.franchiseFeeProducts.totalCostPrice = data.totalCostPrice
            state.franchiseFeeProducts.totalBenefit = data.totalBenefit

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingProducts = false
        }
    }

    const fetchProduct = async id => {
        try {
            const { data } = await authorizedClient.get(`/products/${id}`)
            state.product = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteProduct = async id => {
        try {
            await authorizedClient.put(`/products/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const restoreProduct = async id => {
        try {
            await authorizedClient.put(`/products/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushProduct,
        putProduct,
        fetchProducts,
        fetchABCProducts,
        fetchResidualProducts,
        fetchFranchiseFeeProducts,
        fetchProduct,
        deleteProduct,
        restoreProduct,
        getProducts: computed(() => state.products),
        getABCProducts: computed(() => state.abcProducts),
        getResidualProducts: computed(() => state.residualProducts),
        getFranchiseFeeProducts: computed(() => state.franchiseFeeProducts),
        getProduct: computed(() => state.product),
        getIsLoadingProducts: computed(() => state.isLoadingProducts),
    }
})
