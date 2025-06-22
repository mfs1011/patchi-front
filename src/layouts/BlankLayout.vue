<script setup>
import Loader from "@/components/Loader.vue";
</script>

<template>
    <Suspense>
        <template #default>
            <router-view />
        </template>
        <template #fallback>
            <Loader />
        </template>
    </Suspense>
</template>
