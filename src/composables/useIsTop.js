import {onMounted, onUnmounted, ref} from "vue";

export default function(element) {
    const isTop = ref(true)

    const setValueToIsTop = () => {
        if (element) {
            isTop.value = element.value.scrollTop === 0
        } else {
            isTop.value = scrollY === 0
        }
    }
    onMounted(() => {
        if (element) {
            element.value.addEventListener("scroll", setValueToIsTop)
        }

        window.addEventListener("scroll", setValueToIsTop)
    })

    onUnmounted(() => {
        window.removeEventListener("scroll", setValueToIsTop)
    })

    return isTop
}