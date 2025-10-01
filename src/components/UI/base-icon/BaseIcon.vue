<template>
    <i class="base-icon"
       :style="{ color: props.color, fontSize: size ?? '24px' }"
    >
        <template v-if="isSlot">
            <slot />
        </template>

        <SVGComponent v-else />
    </i>
</template>

<script setup>
import useBaseIcon from "./useBaseIcon";

const props = defineProps(["icon", "size", "color"]);

const { SVGComponent, isSlot } = useBaseIcon(props);
</script>

<style>
.base-icon {
    svg {
        @apply text-inherit w-full h-full
    }
}
</style>
