// import {defineStore} from "pinia";
// import {computed, reactive} from "vue";
// import {authorizedClient, unAuthorizedClient} from "@/api/axios.js";
//
// export const useUserStore = defineStore('user', () => {
//     const state = reactive({
//         users: {
//             models: [],
//             totalItems: 0,
//         },
//         user: {
//             locations: []
//         },
//         me: {
//             locations: []
//         },
//         isLoadingUsers: false,
//     })
//
//     const pushUser = async userData => {
//         try {
//             const { data } = await authorizedClient.post('/users', userData)
//             return data
//         } catch (error) {
//             throw error
//         }
//     }
//
//     const editUser = async (userData, id) => {
//         try {
//             const { data } = await authorizedClient.put(`/users/${id}`, userData)
//             return data
//         } catch (error) {
//             throw error
//         }
//     }
//
//     const fetchToken = async userData => {
//         try {
//             const { data } = await unAuthorizedClient.post('/users/auth', userData)
//             localStorage.setItem('patchi_accessToken', data.accessToken)
//             localStorage.setItem('patchi_refreshToken', data.refreshToken)
//             return data
//         } catch (error) {
//             throw error
//         }
//     }
//
//     const fetchAboutMe = async () => {
//         try {
//             const { data } = await authorizedClient.post('/users/about_me', {})
//             state.me = data;
//
//             return data
//         } catch (error) {
//             throw error
//         }
//     }
//
//     const fetchUsers = async (params = { page: 1 }) => {
//         try {
//             state.isLoadingUsers = true
//
//             const { data } = await authorizedClient.get('/users', { params })
//             state.users.models = data.member
//             state.users.totalItems = data.totalItems
//
//             return data
//         } catch (error) {
//             throw error
//         } finally {
//             state.isLoadingUsers = false
//         }
//     }
//
//     const fetchUser = async id => {
//         try {
//             const { data } = await authorizedClient.get(`/users/${id}`)
//             state.user = data
//
//             return data
//         } catch (error) {
//             throw error
//         }
//     }
//
//     const deleteUser = async id => {
//         try {
//             await authorizedClient.put(`/users/delete/${id}`, JSON.stringify({}))
//         } catch (error) {
//             throw error
//         }
//     }
//
//     const restoreUser = async id => {
//         try {
//             await authorizedClient.put(`/users/restore/${id}`, JSON.stringify({}))
//         } catch (error) {
//             throw error
//         }
//     }
//
//     const logout = () => {
//         localStorage.removeItem('patchi_accessToken');
//         localStorage.removeItem('patchi_refreshToken');
//         location.reload()
//     }
//
//     return {
//         pushUser,
//         editUser,
//         fetchToken,
//         fetchUsers,
//         fetchUser,
//         deleteUser,
//         restoreUser,
//         logout,
//         fetchAboutMe,
//         getAboutMe: computed(() => state.me),
//         getAboutMeFromToken: computed(() => JSON.parse(atob(localStorage.getItem('patchi_accessToken').split('.')[1]))),
//         getAccessToken: computed(() => localStorage.getItem('patchi_accessToken')),
//         getRefreshToken: computed(() => localStorage.getItem('patchi_refreshToken')),
//         getUsers: computed(() => state.users),
//         getUser: computed(() => state.user),
//         getIsLoadingUsers: computed(() => state.isLoadingUsers),
//     }
// })

import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient, unAuthorizedClient } from "@/api/axios.js";
import router from "@/router";

export const useUserStore = defineStore('user', () => {
    const state = reactive({
        users: {
            models: [],
            totalItems: 0,
        },
        user: {
            locations: [],
            devices: []
        },
        me: {
            locations: [],
            roles: [],
            devices: []
        },
        isLoadingUsers: false,
    })

    const setTokens = (accessToken, refreshToken) => {
        localStorage.setItem("patchi_accessToken", accessToken);
        localStorage.setItem("patchi_refreshToken", refreshToken);
    };

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
            const { data } = await authorizedClient.put(`/users/${id}`, userData)
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchToken = async userData => {
        try {
            const { data } = await unAuthorizedClient.post("/users/auth", userData);
            setTokens(data.accessToken, data.refreshToken);

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

    const restoreUser = async id => {
        try {
            await authorizedClient.put(`/users/restore/${id}`, JSON.stringify({}))
        } catch (error) {
            throw error
        }
    }

    const refreshTokens = async () => {
        const refreshToken = localStorage.getItem('patchi_refreshToken');
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await unAuthorizedClient.post("/users/auth/refreshToken", {
            refreshToken,
        });
        setTokens(data.accessToken, data.refreshToken);
    };

    const logout = () => {
        localStorage.removeItem("patchi_accessToken");
        localStorage.removeItem("patchi_refreshToken");
        router.push("/login");
    };

    const isAuthorized = () => {
        const token = localStorage.getItem("patchi_accessToken");
        if (!token) return false;

        try {
            // JWT ni decode qilamiz
            const payload = JSON.parse(atob(token.split(".")[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            // Agar muddati tugagan bo‘lsa => false
            return !(payload.exp && payload.exp < currentTime);


        } catch (e) {
            return false;
        }
    };


    return {
        pushUser,
        editUser,
        fetchUsers,
        fetchUser,
        deleteUser,
        restoreUser,
        fetchToken,
        refreshTokens,
        logout,
        fetchAboutMe,
        isAuthorized,
        getAboutMe: computed(() => state.me),
        getAboutMeFromToken: computed(() => JSON.parse(atob(localStorage.getItem('patchi_accessToken').split('.')[1]))),
        getAccessToken: computed(() => localStorage.getItem('patchi_accessToken')),
        getRefreshToken: computed(() => localStorage.getItem('patchi_refreshToken')),
        getUsers: computed(() => state.users),
        getUser: computed(() => state.user),
        getIsLoadingUsers: computed(() => state.isLoadingUsers),
    };
});
