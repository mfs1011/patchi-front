<script setup>
import Select from "@/volt/Select.vue"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useSidebarStore } from "@/stores/sidebar.js"

const { locale } = useI18n()
const sidebar = useSidebarStore()

const langs = computed(() => [
    { code: "en", name: `🇺🇸${sidebar.isOpen ? ' English' : ''}` },
    { code: "ru", name: `🇷🇺${sidebar.isOpen ? ' Русский' : ''}` },
    { code: "uz", name: `🇺🇿${sidebar.isOpen ? " O'zbekcha" : ''}` }
])

const selectedLang = computed({
    get: () => {
        return langs.value.find(lang => lang.code === locale.value) || langs.value[2]
    },
    set: (lang) => {
        locale.value = lang.code
        localStorage.setItem('lang', lang.code)
    }
})

// Initial load — agar localStorage'da til saqlangan bo‘lsa, uni qo‘llash
const savedLang = localStorage.getItem('lang')
if (savedLang && savedLang !== locale.value) {
    locale.value = savedLang
}
</script>

<template>
    <Select
        v-model="selectedLang"
        :options="langs"
        optionLabel="name"
        size="small"
        placeholder="Tilni tanlang"
        :class="[sidebar.isOpen ? 'md:w-38' : 'md:w-14']"
    />
</template>
