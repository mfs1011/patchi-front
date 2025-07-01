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
    withoutButtons: {
        type: Boolean,
        default: false,
    }
})

defineEmits(["on-click-add"]);

const router = useRouter();
</script>

<template>
    <div class="flex justify-between flex-wrap gap-4 flex-col sm:flex-row">
        <div class="flex sm:hidden items-center gap-1">
            <Button
                @click="router.push({ name: backRouteName })"
                pt:root="text-sm sm:text-base bg-transparent dark:bg-transparent text-black dark:text-surface-0 enabled:hover:bg-transparent border-none px-1 py-0"
                icon="pi pi-chevron-left"
                pt:icon="text-black dark:text-surface-0 hover:scale-120 transition-all"
            />
            <span class="sm:text-2xl dark:text-surface-0">{{ sectionName }}</span>
        </div>
        <div class="flex items-center gap-2 sm:gap-4 grow">
            <slot name="buttons">
                <div v-if="!withoutButtons" class="ml-auto">
                    <Button @click="$emit('on-click-add', true)" class="px-5">{{ addButtonName }}</Button>
                </div>
            </slot>
        </div>
    </div>
</template>
