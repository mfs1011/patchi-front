<script setup>
import Loader from "@/components/Loader.vue";
</script>

<template>
    <div class="container mx-auto">
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
