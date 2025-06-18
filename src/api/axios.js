import axios from "axios";

export const authorizedClient = axios.create({
    headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    baseURL: import.meta.env.VITE_APP_API_URL,
})

// Boshqa instance yaratiish ham mumkin yuqoridagidaqa
