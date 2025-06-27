<script setup>
import Select from "@/volt/Select.vue"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useSidebarStore } from "@/stores/sidebar.js"

const { locale } = useI18n()
const sidebar = useSidebarStore()

const langs = computed(() => [
    { code: "en", name: 'English', flag: 'usa' },
    { code: "ru", name: 'Русский', flag: 'russia' },
    { code: "uz", name: 'O\'zbekcha', flag: 'uzbekistan' }
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
        :class="[sidebar.isOpen ? 'md:w-38' : 'md:w-12']"
        :pt:dropdown="`${sidebar.isOpen ? 'w-8' : 'hidden'}`"
    >
        <template #value="slotProps">
            <div v-if="slotProps.value" :class="['flex items-center gap-2', !sidebar.isOpen ? 'justify-center': '']">
                <img
                    :src="`/${slotProps.value.flag}.svg`"
                    :alt="slotProps.value.name"
                    class="w-5.5 text-2xl flex-none"
                />
                <div v-if="sidebar.isOpen">{{ slotProps.value.name }}</div>
            </div>
            <span v-else>
                {{ slotProps.placeholder }}
            </span>
        </template>
        <template #option="slotProps">
            <div class="flex items-center gap-2">
                <img
                    :src="`/${slotProps.option.flag}.svg`"
                    :alt="slotProps.option.name"
                    class="w-5 flex-none"
                />
                <div>{{ slotProps.option.name }}</div>
            </div>
        </template>
    </Select>
</template>
