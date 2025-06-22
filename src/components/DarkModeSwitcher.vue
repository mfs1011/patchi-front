<script setup>
import Button from "@/volt/Button.vue";
import {useDarkModeStore} from "@/stores/darkMode.js";

const darkStore = useDarkModeStore()
</script>

<template>
    <Button @click="darkStore.toggle" :icon="darkStore.isDark ? 'pi pi-sun' : 'pi pi-moon'" size="small" class="text-white ml-auto"/>
</template>
