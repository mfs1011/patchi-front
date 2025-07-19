import  {defineStore } from "pinia";
import { computed, reactive } from "vue";
import { authorizedClient } from "@/api/axios.js";

export const useMediaObjectStore = defineStore('media_object', () => {
    const state = reactive({
        media_objects: {
            models: [],
            totalItems: 0,
        },
        media_object: {},
        isLoadingMediaObjects: false
    })

    const pushMediaObject = async (media_objectData) => {
        try {
            const { data } = await authorizedClient.post('/media_objects', media_objectData, { headers: { "Content-Type": 'multipart/form-data' } })
            state.media_object = data;
            return data
        } catch (error) {
            throw error
        }
    }

    const fetchMediaObjects = async (params = { page: 1 }) => {
        try {
            state.isLoadingMediaObjects = true

            const { data } = await authorizedClient.get('/media_objects', { params });
            state.media_objects.models = data.member
            state.media_objects.totalItems = data.totalItems

            return data
        } catch (error) {
            throw error
        } finally {
            state.isLoadingMediaObjects = false
        }
    }

    const fetchMediaObject = async id => {
        try {
            const { data } = await authorizedClient.get(`/media_objects/${id}`)
            state.media_object = data

            return data
        } catch (error) {
            throw error
        }
    }

    return {
        pushMediaObject,
        fetchMediaObjects,
        fetchMediaObject,
        getMediaObjects: computed(() => state.media_objects),
        getMediaObject: computed(() => state.media_object),
        getIsLoadingMediaObject: computed(() => state.isLoadingMediaObjects),
    }
})
