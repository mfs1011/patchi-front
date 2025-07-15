import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useCategoryTypeStore = defineStore('categoryType', () => {
    const state = reactive({
        categoryTypes: {
            models: [],
            totalItems: 0,
        },
        categoryType: {},
        isLoadingCategoryTypes: false
    })

    const fetchCategoryTypes = async (params = { page: 1 }) => {
        try {
            state.isLoadingCategoryTypes = true

            const { data } = await authorizedClient.get('/category_types', { params });
            state.categoryTypes.models = data.member
            state.categoryTypes.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingCategoryTypes = false
        }
    }

    const fetchCategoryType = async id => {
        try {
            const { data } = await authorizedClient.get(`/category_types/${id}`)
            state.category = data

            return data
        } catch (error) {
            throw error
        }
    }
    return {
        fetchCategoryTypes,
        fetchCategoryType,
        getCategoryTypes: computed(() => state.categoryTypes),
        getCategoryType: computed(() => state.categoryType),
        getIsLoadingCategoryType: computed(() => state.isLoadingCategoryTypes),
    }
})
