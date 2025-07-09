<script setup>
import Card from "@/volt/Card.vue";

defineProps({
    card: {
        type: Object,
        required: true,
    }
})
</script>

<template>
    <router-link
        :to="{ name: card.routeName }"
        class="h-fit"
    >
        <Card
            pt:root="flex items-center justify-start h-full rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group hover:bg-surface-100 dark:hover:bg-surface-900 transition-all"
            pt:body="p-0 h-full gap-0 sm:gap-2 w-full"
            pt:content="sm:p-6"
            pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
        >
            <template #title>
                <div class="border-b border-surface-300 dark:border-surface-700 px-5 text-center h-20 flex items-center justify-center">
                    <p>{{ card.name }}</p>
                </div>
            </template>

            <template #content>
                <div class="px-5 py-2.5 sm:py-0 flex sm:justify-center items-center transition-all gap-5">
                    <img
                        :src="`/button_imgs/${card.image}`"
                        alt="users"
                        class="object-cover size-20 sm:size-26 md:size-30 lg:size-34 my-auto transition-all group-hover:scale-110"
                    >

                    <div class="sm:hidden border-l border-surface-300 px-5 py-4 text-center h-full sm:h-fit">
                        <p class="text-xl font-normal">{{ card.name }}</p>
                    </div>
                </div>
            </template>
        </Card>
    </router-link>
</template>
