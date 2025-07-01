<script setup>
import { useSidebarStore } from "@/stores/sidebar.js";
import SectionCard from "@/components/UI/SectionCard.vue";

const sidebarStore = useSidebarStore()

defineProps({
    cards: {
        type: Array,
        required: true,
    }
})

</script>

<template>
    <div :class="['my-auto min-h-full grow grid grid-cols-1 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 place-content-start', sidebarStore.isOpen ? 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3']">
        <SectionCard v-for="card of cards" :card />
    </div>
</template>
