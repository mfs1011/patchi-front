<script setup>
defineProps({
    to: {
        type: [String, Object],
        required: true
    },
    icon: {
        type: String,
        default: ''
    }
})
</script>

<template>
    <RouterLink
        :to
        class="transition-colors duration-200 dark:text-surface-0 flex items-center dark:hover:bg-green-hover active:bg-primary-emphasis-alt px-4 py-3 gap-4 overflow-hidden rounded-md hover:bg-primary-emphasis focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary"
        v-bind="$attrs"
    >
        <i v-if="icon" :class="icon"></i>
        <slot/>
    </RouterLink>
</template>

<style scoped>

</style>