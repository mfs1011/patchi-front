<script setup>
import { computed } from 'vue';
import Button from "@/volt/Button.vue";
import AngleLeftIcon from "@primevue/icons/angleleft";
import AngleRightIcon from "@primevue/icons/angleright";
import Select from "@/volt/Select.vue";
import {useI18n} from "vue-i18n";

const props = defineProps({
    totalItems: {
        type: Number,
        required: true,
    }
});

const { t } = useI18n()
const current = defineModel();
const itemsPerPage = defineModel('items-per-page');

const totalPages = computed(() => {
    return Math.ceil(props.totalItems / (itemsPerPage.value || 1));
});

function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
        current.value = page;
    }
}

const visiblePages = computed(() => {
    const total = totalPages.value;
    const delta = 1;
    const range = [];

    for (let i = Math.max(2, current.value - delta); i <= Math.min(total - 1, current.value + delta); i++) {
        range.push(i);
    }

    if (current.value - delta > 2) range.unshift('...');
    if (current.value + delta < total - 1) range.push('...');

    range.unshift(1);
    if (total > 1) range.push(total);

    return range.map((p, index) => ({ key: `${p}-${index}`, page: p }));
});
</script>

<template>
    <div class="flex flex-col md:flex-row flex-wrap items-center gap-4 w-full">
        <div class="flex grow justify-between items-center w-full md:w-fit sm:grow gap-4">
            <div class="flex items-center gap-1 sm:gap-2 text-sm">
                <p>{{ t('pagination.showing') }}</p>
                <p class="font-medium">{{ (current - 1) * itemsPerPage + 1 }} - {{ Math.min(current * itemsPerPage, totalItems) }}</p>
                <p>{{ t('pagination.of') }}</p>
                <p class="font-medium">{{ totalItems }}</p>
            </div>
            <Select
                @change="current = 1"
                v-model="itemsPerPage"
                :options="[1, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100,]"
                placeholder="Select a Country"
                size="small"
                class="w-fit"
                pt:root="w-44"
                pt:label="dark:bg-surface-950 rounded-s-md dark:bg-surface-800"
                pt:dropdown="dark:bg-surface-950 dark:bg-surface-800"
            />
        </div>

        <nav class="hidden md:flex justify-center items-center gap-1" :class="{ 'hidden md:hidden': totalPages < 2}">
            <Button
                size="small"
                :disabled="current === 1"
                @click="changePage(current - 1)"
                class="size-8! rounded-md! bg-transparent! dark:bg-transparent! border-none text-surface-700! dark:text-surface-0!"
                :class="{ 'hover:bg-main-hover! dark:hover:bg-green-hover! text-surface-0!': current !== totalItems }"
            >
                <AngleLeftIcon />
            </Button>

            <template v-for="page in visiblePages" :key="page.key">
                <Button
                    size="small"
                    v-if="page.page !== '...'"
                    @click="changePage(page.page)"
                    class="size-8 rounded-md! bg-transparent dark:bg-transparent dark:text-surface-0 border border-surface-300 dark:border-surface-600/50 text-surface-700 cursor-pointer hover:bg-main-hover dark:hover:bg-green-hover"
                    :class="{ 'bg-main! dark:bg-green! text-surface-0!': current === page.page }"
                >
                    {{page.page}}
                </Button>
                <span v-else class="px-2 py-1 text-sm text-gray-500">...</span>
            </template>

            <Button
                size="small"
                :disabled="current === totalPages"
                @click="changePage(current + 1)"
                class="size-8! rounded-md! bg-transparent! dark:bg-transparent! border-none text-surface-700! dark:text-surface-0!"
                :class="{ 'hover:bg-main-hover! dark:hover:bg-green-hover! text-surface-0!': current !== totalItems }"
            >
                <AngleRightIcon />
            </Button>
        </nav>
        <nav class="md:hidden w-full flex items-center gap-4 justify-end" :class="{ 'hidden md:hidden': totalPages < 2}">
            <Button
                size="small"
                :disabled="current === 1"
                @click="changePage(current - 1)"
                class="rounded-md! w-full! sm:w-fit! px-4! flex! justify-center! items-center! border-surface-300! dark:border-surface-600/50! bg-transparent! dark:bg-transparent! text-surface-700! dark:text-surface-0!"
                :class="{ 'hover:bg-main-hover! dark:hover:bg-green-hover! text-surface-0!': current !== totalItems }"
            >
                <AngleLeftIcon />
                <span>Prev</span>
            </Button>

            <Button
                size="small"
                :disabled="current === totalPages"
                @click="changePage(current + 1)"
                class="rounded-md! w-full! sm:w-fit! px-4! flex! justify-center! items-center! border-surface-300! dark:border-surface-600/50! bg-transparent! dark:bg-transparent! text-surface-700! dark:text-surface-0!"
                :class="{ 'hover:bg-main-hover! dark:hover:bg-green-hover! text-surface-0!': current !== totalItems }"
            >
                <span>Next</span><AngleRightIcon />
            </Button>
        </nav>
    </div>
</template>
