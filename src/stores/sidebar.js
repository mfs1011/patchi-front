import {defineStore} from "pinia";
import {computed, ref} from "vue";

export const useSidebarStore = defineStore('SidebarStore', () => {
    const isOpen = ref(true);
    const isRouteLoading = ref(false);

    const toggle = () => isOpen.value = !isOpen.value;
    const close = () => isOpen.value = false;
    const open = () => isOpen.value = true;
    const startIsRouteLoading = () => isRouteLoading.value = true;
    const endIsRouteLoading = () => isRouteLoading.value = false;

    return {
        isOpen: computed(() => isOpen.value),
        isRouteLoading: computed(() => isRouteLoading.value),
        toggle,
        close,
        open,
        startIsRouteLoading,
        endIsRouteLoading,
    }
})
