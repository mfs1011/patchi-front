import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useKitStore = defineStore('kit', () => {
    const state = reactive({
        kits: {
            models: [],
            totalItems: 0,
        },
        residualKits: {
            models: [],
            totalItems: 0,
        },
        kit: {},
        isLoadingKits: false,
    })

    const pushKit = async kitData => {
        try {
            const { data } = await authorizedClient.post('/kits', kitData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putKit = async (kitData, id) => {
        try {
            const { data } = await authorizedClient.put(`/kits/${id}`, kitData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchKits = async (params = { page: 1 }) => {
        try {
            state.isLoadingKits = true

            const { data } = await authorizedClient.get('/kits', { params })
            state.kits.models = data.member
            state.kits.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingKits = false
        }
    }

    const fetchResidualKits = async (params = { page: 1 }) => {
        try {
            state.isLoadingKits = true

            const { data } = await authorizedClient.get('/kits/residual', { params })
            state.residualKits.models = data.member
            state.residualKits.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingKits = false
        }
    }

    const fetchKit = async id => {
        try {
            const { data } = await authorizedClient.get(`/kits/${id}`)
            state.kit = data

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        pushKit,
        putKit,
        fetchKits,
        fetchResidualKits,
        fetchKit,
        getKits: computed(() => state.kits),
        getResidualKits: computed(() => state.residualKits),
        getKit: computed(() => state.kit),
        getIsLoadingKits: computed(() => state.isLoadingKits),
    }
})
