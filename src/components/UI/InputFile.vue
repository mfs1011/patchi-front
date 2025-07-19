<script setup>
import {computed, useTemplateRef} from "vue";
import {useI18n} from "vue-i18n";

const props = defineProps({
    fileName: {
        type: String,
        required: true
    },
    placeholder: {
        type: String,
        default: ''
    }
})

const { t } = useI18n()
const input = useTemplateRef('file')

const placeholderText = computed(() => props.placeholder || t('choosePhoto'))

function openFileChange() {
    input.value?.click()
}
defineExpose({
    resetFileInput: () => {
        if (input.value) input.value.value = ''
    }
})
</script>

<template>
    <span class="relative block">
        <input type="file" ref="file" v-bind="$attrs" class="hidden"/>
        <i class="pi pi-image absolute top-1/2 -mt-2 text-surface-400 leading-none start-3 z-1" />
        <button @click="openFileChange" type="button" :class="{'text-surface-500 dark:text-surface-400': !fileName, 'text-surface-700 dark:text-surface-0': fileName}" class="text-lg truncate font-normal w-full block h-12 appearance-none rounded-md outline-hidden bg-surface-0 dark:bg-surface-700 p-filled:bg-surface-50 dark:p-filled:bg-surface-800  placeholder:text-surface-500 dark:placeholder:text-surface-400 border border-surface-300 dark:border-surface-600/50 enabled:hover:border-surface-400 dark:enabled:hover:border-surface-600 enabled:focus:border-primary disabled:bg-surface-200 disabled:text-surface-500 dark:disabled:bg-surface-700 dark:disabled:text-surface-400 p-invalid:border-red-400 dark:p-invalid:border-red-300 p-invalid:placeholder:text-red-600 dark:p-invalid:placeholder:text-red-400 px-3 py-2 p-fluid:w-full p-small:text-sm p-small:px-[0.625rem] p-small:py-[0.375rem] p-large:text-lg p-large:px-[0.875rem] p-large:py-[0.625rem] transition-colors duration-200 shadow-[0_1px_2px_0_rgba(18,18,23,0.05)] text-start ps-10">
            {{fileName || placeholderText }}
        </button>
    </span>
</template>
