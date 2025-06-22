// stores/darkMode.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDarkModeStore = defineStore('darkMode', () => {
    const isDark = ref(false)

    const applyClass = () => {
        document.documentElement.classList.toggle('dark', isDark.value)
    }

    const save = () => {
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }

    const init = () => {
        const saved = localStorage.getItem('theme')
        isDark.value = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
        applyClass()
    }

    const toggle = () => {
        isDark.value = !isDark.value
        save()
        applyClass()
    }

    return {
        isDark,
        init,
        toggle
    }
})
