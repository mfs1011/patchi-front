<script setup>
import Button from "@/volt/Button.vue";
import { useRouter } from "vue-router";

defineProps({
    isLoading: {
        type: Boolean,
        default: false,
    },
    backRouteName: {
        type: String,
        required: true,
    },
    sectionName: {
        type: String,
        required: true,
    },
    addButtonName: {
        type: String,
    },
    withoutAddButton: {
        type: Boolean,
        default: false,
    }
})

defineEmits(["on-click-add"]);

const router = useRouter();
</script>

<template>
    <div class="flex justify-between flex-wrap gap-4">
        <div class="flex items-center gap-1">
            <Button
                @click="router.push({ name: backRouteName })"
                pt:root="bg-transparent dark:bg-transparent text-black dark:text-surface-0 enabled:hover:bg-transparent border-none px-1 py-0"
                icon="pi pi-chevron-left"
                pt:icon="text-black dark:text-surface-0 hover:scale-120 transition-all"
            />
            <span class="text-2xl dark:text-surface-0">{{ sectionName }}</span>
        </div>
        <div v-if="!withoutAddButton" class="ml-auto">
            <Button @click="$emit('on-click-add', true)" class="px-5">{{ addButtonName }}</Button>
        </div>
    </div>
</template>
