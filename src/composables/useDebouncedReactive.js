import { reactive, watch, toRefs } from 'vue'

export function useDebouncedReactive(initialValues, delay = 500) {
    const model = reactive({...initialValues})
    const debounced = reactive({...initialValues})
    const timers = {}

    for (const key in model) {
        watch(
            () => model[key],
            (newVal) => {
                clearTimeout(timers[key])
                timers[key] = setTimeout(() => {
                    debounced[key] = newVal
                }, delay)
            }
        )
    }

    return {
        model: toRefs(model),        // v-model uchun
        debounced: toRefs(debounced) // kuzatish yoki queryga push qilish uchun
    }
}
