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
    visibleHeader: {
        type: Boolean,
        default: false,
    },
    withoutButtons: {
        type: Boolean,
        default: false,
    },

})

defineEmits(["on-click-add"]);

</script>

<template>
    <div class="flex flex-col gap-2 sm:gap-4 grow">
        <SectionHeader
            :addButtonName
            :sectionName
            :backRouteName
            :withoutButtons
            @on-click-add="val => $emit('on-click-add', val)"
        >
            <template v-if="!withoutButtons" #buttons>
                <slot name="buttons"/>
            </template>
        </SectionHeader>

        <slot name="sectionHeader" />
        <slot name="sectionBody" />
    </div>
</template>
