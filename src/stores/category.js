import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useCategoryStore = defineStore('category', () => {
    const state = reactive({
        categories: {
            models: [],
            totalItems: 0,
        },
        category: {},
        isLoadingCategories: false
    })

    const pushCategory = async (categoryData) => {
        try {
            const { data } = await authorizedClient.post('/categories', categoryData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putCategory = async (categoryData, id) => {
        try {
            const { data } = await authorizedClient.put(`/categories/${id}`, categoryData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchCategories = async (params = { page: 1 }) => {
        try {
            state.isLoadingCategories = true

            const { data } = await authorizedClient.get('/categories', { params });
            state.categories.models = data.member
            state.categories.totalItems = data.totalItems

            return data
        } catch (error) {
            console.error(error)
            throw error
        } finally {
            state.isLoadingCategories = false
        }
    }

    const fetchCategory = async id => {
        try {
            const { data } = await authorizedClient.get(`/categories/${id}`)
            state.category = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteCategory = async id => {
        try {
            const { data } = await authorizedClient.put(`/categories/delete/${id}`, JSON.stringify({}))
            return data
        } catch (error) {
            throw error
        }
    }

    const restoreCategory = async id => {
        try {
            await authorizedClient.put(`/categories/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushCategory,
        putCategory,
        fetchCategories,
        fetchCategory,
        deleteCategory,
        restoreCategory,
        getCategories: computed(() => state.categories),
        getCategory: computed(() => state.category),
        getIsLoadingCategory: computed(() => state.isLoadingCategories),
    }
})
