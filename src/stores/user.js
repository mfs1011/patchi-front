import {defineStore} from "pinia";
import {computed, reactive} from "vue";
import {authorizedClient, unAuthorizedClient} from "@/api/axios.js";

export const useUserStore = defineStore('user', () => {
    const state = reactive({
        users: {
            models: [],
            totalItems: 0,
        },
        user: {
            locations: []
        },
        me: {
            locations: []
        },
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

    const editUser = async (userData, id) => {
        try {
            const { data } = await authorizedClient.patch(`/users/${id}`, userData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchToken = async userData => {
        try {
            const { data } = await unAuthorizedClient.post('/users/auth', userData)
            localStorage.setItem('patchi_accessToken', data.accessToken)
            localStorage.setItem('patchi_refreshToken', data.refreshToken)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchAboutMe = async () => {
        try {
            const { data } = await authorizedClient.post('/users/about_me', {})
            state.me = data;

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

    const logout = () => {
        localStorage.removeItem('patchi_accessToken');
        localStorage.removeItem('patchi_refreshToken');
        location.reload()
    }

    return {
        pushUser,
        editUser,
        fetchToken,
        fetchUsers,
        fetchUser,
        deleteUser,
        logout,
        fetchAboutMe,
        getAboutMe: computed(() => state.me),
        getAboutMeFromToken: computed(() => JSON.parse(atob(localStorage.getItem('patchi_accessToken').split('.')[1]))),
        getAccessToken: computed(() => localStorage.getItem('patchi_accessToken')),
        getRefreshToken: computed(() => localStorage.getItem('patchi_refreshToken')),
        getUsers: computed(() => state.users),
        getUser: computed(() => state.user),
        getIsLoadingUsers: computed(() => state.isLoadingUsers),
    }
})
