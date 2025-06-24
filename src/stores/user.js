import {defineStore} from "pinia";
import {computed, reactive} from "vue";
import {authorizedClient} from "@/api/axios.js";

export const useUserStore = defineStore('user', () => {
    const state = reactive({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken')
    })

    const fetchToken = async userData => {
        try {
            const { data } = await authorizedClient.post('/users/auth', userData)
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)
            return data
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
        fetchToken,
        logout,
        getAccessToken: computed(() => state.accessToken),
        getRefreshToken: computed(() => state.refreshToken),
    }
})
