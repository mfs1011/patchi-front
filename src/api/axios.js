import axios from "axios";
import {useSidebarStore} from "@/stores/sidebar.js";

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

// 1. Request interceptor — loading start
authorizedClient.interceptors.request.use((config) => {
    const sidebar = useSidebarStore();
    sidebar.startIsRouteLoading();
    config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`

    return config;
}, (error) => {
    const loadingStore = useSidebarStore();
    loadingStore.endIsRouteLoading();
    return Promise.reject(error);
});

// 2. Response interceptor — loading stop
authorizedClient.interceptors.response.use((response) => {
    const sidebar = useSidebarStore();
    sidebar.endIsRouteLoading();
    return response;
}, (error) => {
    const sidebar = useSidebarStore();
    sidebar.endIsRouteLoading();
    return Promise.reject(error);
});

// Boshqa instance yaratiish ham mumkin yuqoridagidaqa
