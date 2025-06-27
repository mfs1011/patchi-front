<script setup>
import SectionHeader from "@/components/UI/SectionHeader.vue";

defineProps({
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

</script>

<template>
    <div class="flex flex-col gap-2 sm:gap-4 grow">
        <SectionHeader
            :addButtonName
            :sectionName
            :backRouteName
            @on-click-add="val => $emit('on-click-add', val)"
            :withoutAddButton
        />

        <slot name="sectionBody" />
    </div>
</template>
