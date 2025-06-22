<script setup>
import Button from "@/volt/Button.vue";
import {onMounted} from "vue";
import LogoButton from "@/volt/LogoButton.vue";
import {useSidebarStore} from "@/stores/sidebar.js";
import DarkModeSwitcher from "@/components/DarkModeSwitcher.vue";
const sidebar = useSidebarStore()

onMounted(() => {
    if (window.innerWidth <= 640) {
        sidebar.close()
    }
})
</script>

<template>
    <div class="sticky box-border top-0 bg-white dark:bg-surface-800 h-16 p-4 flex items-center border-b border-b-surface-300 dark:border-b-surface-700">
        <div class="sm:hidden flex items-center h-13 box-border">
            <LogoButton class="bg-white border-none hover:bg-transparent hover:fill-white">
                <img src="/logo.svg" class="h-6 flex-none">
            </LogoButton>
        </div>

        <Button @click="sidebar.toggle" icon="pi pi-align-justify" size="small" class="text-white ml-auto sm:ml-0"/>
        <DarkModeSwitcher />
    </div>
</template>
