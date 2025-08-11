import axios from 'axios';
import { useSidebarStore } from '@/stores/sidebar.js';
import { useUserStore } from '@/stores/user.js';

export const authorizedClient = axios.create({
    headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json',
    },
    baseURL: import.meta.env.VITE_APP_API_URL + '/api',
})
export const unAuthorizedClient = axios.create({
    headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json',
    },
    baseURL: import.meta.env.VITE_APP_API_URL + '/api',
})

authorizedClient.interceptors.request.use(
    (config) => {
        const sidebar = useSidebarStore();
        sidebar.startIsRouteLoading();

        if (localStorage.getItem('patchi_accessToken')) {
            config.headers.Authorization = `Bearer ${localStorage.getItem('patchi_accessToken')}`;
        }

        if (config.method === 'patch') {
            config.headers['Content-Type'] = 'application/merge-patch+json';
        }

        return config;
    },
    (error) => {
        useSidebarStore().endIsRouteLoading();
        return Promise.reject(error);
    }
);

authorizedClient.interceptors.response.use(
    (response) => {
        useSidebarStore().endIsRouteLoading();
        return response;
    },
    async (error) => {
        const sidebar = useSidebarStore();
        sidebar.endIsRouteLoading();

        const userStore = useUserStore();
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('error 401')
            originalRequest._retry = true;
            try {
                await userStore.refreshTokens();
                originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('patchi_accessToken')}`;
                return authorizedClient(originalRequest); // qayta yuborish
            } catch (err) {
                userStore.logout();
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);
