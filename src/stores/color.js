import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useColorStore = defineStore('color', () => {
    const state = reactive({
        colors: {
            models: [],
            totalItems: 0,
        },
        color: {},
        isLoadingColors: false
    })

    const pushColor = async (colorData) => {
        try {
            const { data } = await authorizedClient.post('/colors', colorData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchColors = async (params = { page: 1 }) => {
        try {
            state.isLoadingColors = true

            const { data } = await authorizedClient.get('/colors', { params });
            state.colors.models = data.member
            state.colors.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingColors = false
        }
    }

    const fetchColor = async id => {
        try {
            const { data } = await authorizedClient.get(`/colors/${id}`)
            state.color = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteColor = async id => {
        try {
            const { data } = await authorizedClient.put(`/colors/delete/${id}`, JSON.stringify({}))
            return data
        } catch (error) {
            throw error
        }
    }

    const restoreColor = async id => {
        try {
            await authorizedClient.put(`/colors/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushColor,
        fetchColors,
        fetchColor,
        deleteColor,
        restoreColor,
        getColors: computed(() => state.colors),
        getColor: computed(() => state.color),
        getIsLoadingColor: computed(() => state.isLoadingColors),
    }
})
