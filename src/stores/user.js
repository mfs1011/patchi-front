import {defineStore} from "pinia";
import {computed, reactive} from "vue";
import {authorizedClient, unAuthorizedClient} from "@/api/axios.js";

export const useUserStore = defineStore('user', () => {
    const state = reactive({
        users: {
            models: [],
            totalItems: 0,
        },
        user: {},
        isLoadingUsers: false,
    })

    const pushUser = async userData => {
        try {
            const { data } = await authorizedClient.post('/users', userData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchToken = async userData => {
        try {
            const { data } = await unAuthorizedClient.post('/users/auth', userData)
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchUsers = async (params = { page: 1 }) => {
        try {
            state.isLoadingUsers = true

            const { data } = await authorizedClient.get('/users', { params })
            state.users.models = data.member
            state.users.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingUsers = false
        }
    }

    const fetchUser = async id => {
        try {
            const { data } = await authorizedClient.get(`/users/${id}`)
            state.user = data

            return data
        } catch (error) {
            throw error
        }
    }

    const deleteUser = async id => {
        try {
            await authorizedClient.put(`/users/delete/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const getAboutMe = async () => {
        try {
            await authorizedClient.post(`/users/about_me`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        location.reload()
    }

    return {
        pushUser,
        fetchToken,
        fetchUsers,
        fetchUser,
        deleteUser,
        logout,
        getAboutMe,
        getAboutMeFromToken: computed(() => JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1]))),
        getAccessToken: computed(() => localStorage.getItem('accessToken')),
        getRefreshToken: computed(() => localStorage.getItem('refreshToken')),
        getUsers: computed(() => state.users),
        getUser: computed(() => state.user),
        getIsLoadingUsers: computed(() => state.isLoadingUsers),
    }
})
