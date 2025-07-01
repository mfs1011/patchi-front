import {defineStore} from "pinia";
import {computed, reactive} from "vue";
import {authorizedClient} from "@/api/axios.js";

export const useRoleStore = defineStore('role',() => {
    const state = reactive({
        roles: {
            models: [],
            totalItems: 0,
        }
    })

    const fetchRoles = async () => {
        try {
            const { data } = await authorizedClient.get('/roles')

            state.roles.models = data.member
            state.roles.totalItems = data.totalItems

            return data
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    return {
        fetchRoles,
        getRoles: computed(() => state.roles),
    }
})
