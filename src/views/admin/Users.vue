<script setup>
import Button from "@/volt/Button.vue";
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex justify-between">
            <div class="flex items-center gap-1">
                <Button
                    @click="$router.back"
                    pt:root="bg-transparent dark:bg-transparent text-black dark:text-surface-0 enabled:hover:bg-transparent border-none px-1 py-0"
                    icon="pi pi-chevron-left"
                    pt:icon="text-black dark:text-surface-0 hover:scale-120 transition-all"
                />
                <span class="text-2xl dark:text-surface-0">{{ $t('cards.users') }}</span>
            </div>
            <div>
                <Button class="px-5">
                    {{ $t('buttons.new_user') }}
                </Button>
            </div>

        </div>
    </div>
</template>

<style scoped>

</style>