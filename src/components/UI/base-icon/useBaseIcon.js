import { computed, defineAsyncComponent } from "vue";

export default function useBaseIcon(props) {

    const isSlot = computed(() => typeof props.icon !== "string");

    const SVGComponent = computed(() => props.icon && defineAsyncComponent(
        () => import(`@/assets/icons/${props.icon}.svg`)));

    return {
        SVGComponent,
        isSlot,
    }
}
