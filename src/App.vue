<script setup>
import ProgressBar from "@/volt/ProgressBar.vue";
import Toast from "@/volt/Toast.vue";
import {useSidebarStore} from "@/stores/sidebar.js";
import {onBeforeUnmount, onMounted, ref} from "vue";
import {useUserStore} from "@/stores/user.js";
const sidebar = useSidebarStore()
const userStore = useUserStore()

const mercureUrl = (import.meta.env.VITE_MERCURE_URL)
const eventSource = ref(null)

function connectMercure() {
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', '')
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('message', async (event) => {
        const eventDataId = JSON.parse(event.data).eventId

        if (eventDataId === 1) {
            await userStore.fetchAboutMe();

            if(userStore.getAboutMe.deletedAt) {
                userStore.logout()
                router.push({ name: 'login'})
            }
        }
    })
}

onMounted(() => {
    connectMercure()
    userStore.fetchAboutMe()
})

onBeforeUnmount(() => {
    if (eventSource.value) {
        eventSource.value.close()
    }
})
</script>

<template>
    <div class="transition-colors duration-200">
        <Toast />
        <ProgressBar v-if="sidebar.isRouteLoading" mode="indeterminate"  style="height: 4px"/>
        <router-view />
    </div>
</template>
