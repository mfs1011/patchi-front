<script setup>
import ProgressBar from "@/volt/ProgressBar.vue";
import Toast from "@/volt/Toast.vue";
import {useSidebarStore} from "@/stores/sidebar.js";
const sidebar = useSidebarStore()
</script>

<template>
    <div class="transition-colors duration-200">
        <Toast />
        <ProgressBar v-if="sidebar.isRouteLoading" mode="indeterminate"  style="height: 4px"/>
        <router-view />
    </div>
</template>
