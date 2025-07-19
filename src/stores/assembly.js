import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useAssemblyStore = defineStore('assembly', () => {
    const state = reactive({
        assemblies: {
            models: [],
            totalItems: 0,
        },
        assembly: {},
        isLoadingAssemblies: false
    })

    const pushAssembly = async (assemblyData) => {
        try {
            const { data } = await authorizedClient.post('/assemblies', assemblyData)
            return data
        } catch (error) {
            throw error
        }
    }

    const putAssembly = async (assemblyData, id) => {
        try {
            const { data } = await authorizedClient.put(`/assemblies/${id}`, assemblyData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchAssemblies = async (params = { page: 1 }) => {
        try {
            state.isLoadingAssemblies = true

            const { data } = await authorizedClient.get('/assemblies', { params });
            state.assemblies.models = data.member
            state.assemblies.totalItems = data.totalItems

            return data
        } catch (error) {
            console.error(error)
            throw error
        } finally {
            state.isLoadingAssemblies = false
        }
    }

    const fetchAssembly = async id => {
        try {
            const { data } = await authorizedClient.get(`/assemblies/${id}`)
            state.assembly = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteAssembly = async id => {
        try {
            const { data } = await authorizedClient.put(`/assemblies/delete/${id}`, JSON.stringify({}))
            return data
        } catch (error) {
            throw error
        }
    }

    const restoreAssembly = async id => {
        try {
            await authorizedClient.put(`/assemblies/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    return {
        pushAssembly,
        putAssembly,
        fetchAssemblies,
        fetchAssembly,
        deleteAssembly,
        restoreAssembly,
        getAssemblies: computed(() => state.assemblies),
        getAssembly: computed(() => state.assembly),
        getIsLoadingAssembly: computed(() => state.isLoadingAssemblies),
    }
})
