<script setup>
import Loader from "@/components/Loader.vue";
</script>

<template>
    <div class="bg-surface-100 dark:bg-surface-700 grow flex flex-col">
        <Suspense>
            <template #default>
                <router-view />
            </template>
            <template #fallback>
                <Loader />
            </template>
        </Suspense>
    </div>
</template>
