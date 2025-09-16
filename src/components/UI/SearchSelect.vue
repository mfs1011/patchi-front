<script setup>
import {ref, useTemplateRef, watch} from "vue";
import { vIntersectionObserver } from "@vueuse/components";
import Skeleton from "@/volt/Skeleton.vue";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import SelectForSearch from "@/volt/SelectForSearch.vue";

const props = defineProps({
    modelValue: { required: true },
    fetchFn: { type: Function, required: true },
    itemsPerPage: { type: Number, default: 10 },
    optionLabel: { type: Function, default: (opt) => opt?.name },
    optionValue: { type: Function, default: (opt) => opt?.id },
    returnValue: { type: Function, default: (opt) => opt },
    searchValue: { type: Function, default: (opt) => opt.name },
    searchKey: { type: String, default: "name" },
    placeholder: String,
    loading: Boolean,
    totalItems: { type: Number, default: 0 },
    options: { type: Array, required: true },
    invalid: { type: Boolean },
    showClear: { type: Boolean, default: true },
});

const emit = defineEmits(["update:modelValue", "loadMore"]);

const debouncedValue = useDebouncedRef("", 300); // v-model: string (qidiruv) YOKI object (tanlov)
const page = ref(1);
const items = ref([]);
const isVisible = ref(false);

// Qidiruv YOZILGANDA (string bo'lgandagina) fetch qilamiz
watch(
    debouncedValue,
    async (newVal) => {
        page.value = 1;

        const query = {
            page: page.value,
            "items-per-page": props.itemsPerPage,
        };

        if (typeof newVal === "string") {
            // faqat qidiruvda ro'yxatni reset qilamiz
            items.value = [];

            if (newVal) {
                query[props.searchKey] = newVal;
            }

            await props.fetchFn(query);
            items.value = props.options;
        }

        if (newVal === null) {
            page.value = 1
            await props.fetchFn(query);
            items.value = props.options
        }
        // agar newVal object bo'lsa — bu tanlovni qo'lda set qilish; bu yerda itemsni o'chirmaymiz!
    },
    { immediate: true }
);

// Infinite scroll
watch(isVisible, async (newValue) => {
    if (props.totalItems > items.value.length && newValue) {
        const query = {
            page: ++page.value,
            "items-per-page": props.itemsPerPage,
        };

        if (typeof debouncedValue.value === "string" && debouncedValue.value !== "") {
            query[props.searchKey] = debouncedValue.value
        }

        await props.fetchFn(query);
        items.value = [...items.value, ...props.options];
        emit("loadMore", items.value);
        isVisible.value = false; // qayta-qayta trigger bo'lmasin
    }
});

function onIntersectionObserver([entry]) {
    if (entry?.isIntersecting) isVisible.value = true;
}

async function onChange(item) {
    if (item && typeof item === "object") {
        // Tanlangan option
        debouncedValue.value = item;
        emit("update:modelValue", props.returnValue(item));
    } else if (item == null) {
        // Clear bosilganda
        debouncedValue.value = null;
        emit("update:modelValue", null);

        page.value = 1;
        items.value = [];
        const query = {
            page: page.value,
            "items-per-page": props.itemsPerPage,
        };
        await props.fetchFn(query);
        items.value = props.options;
    }
}

// Parent modelValue o'zgarganda (edit bosilganda)
watch(
    () => props.modelValue,
    async (newVal) => {
        if (newVal == null) {
            // reset
            debouncedValue.value = null;
            return;
        }

        const byId = (x) => props.searchValue(x) === props.searchValue(newVal);

        // 1) items ichidan izlaymiz
        let found = items.value.find(byId);

        // 2) topilmasa — id bo'yicha fetch qilib kelamiz (backendda id bo'yicha filter bo'lsin)
        if (!found) {
            const query = {
                page: 1,
                "items-per-page": 10,
            };

            if (props.searchValue(newVal)) {
                query[props.searchKey] = props.searchValue(newVal)
            }

            await props.fetchFn(query);

            found = props.options.find(byId);

            if (found) {
                const exists = items.value.some(byId);
                if (!exists) items.value = props.options; // tepa qismga qo'shib qo'yamiz
            }
        }

        // 3) Topilgan bo'lsa, selektga obyekt sifatida yozamiz
        if (found) debouncedValue.value = found;
    },
    { immediate: false }
);
</script>

<template>
    <SelectForSearch
        v-model="debouncedValue"
        :options="items"
        :option-label="optionLabel"
        :placeholder="placeholder"
        :showClear="props.showClear"
        editable
        :loading="loading"
        @value-change="onChange"
        pt:root="w-full dark:bg-surface-700"
        :invalid="props.invalid"
    >
        <template #value="slotProps">
            <slot name="value" v-bind="slotProps">
                <div v-if="slotProps.value && typeof slotProps.value === 'object'">
                    {{ optionLabel(slotProps.value) }}
                </div>
                <span v-else>{{ placeholder }}</span>
            </slot>
        </template>

        <template #empty>
            <Skeleton v-if="loading" width="100%" height="2rem" />
            <p v-else>No results</p>
        </template>

        <template #option="{ option, index }">
            <slot name="option" :option="option" :index="index">
                <div class="w-full">
                    {{ optionLabel(option) }}
                    <div
                        v-intersection-observer="onIntersectionObserver"
                        v-if="index + 1 === items.length && totalItems > items.length && items.length"
                    >
                        <Skeleton v-if="loading" width="100%" height="2rem" />
                    </div>
                </div>
            </slot>
        </template>

        <template v-for="(_, slotName) in $slots" v-slot:[slotName]="slotProps">
            <slot :name="slotName" v-bind="slotProps ?? {}" />
        </template>
    </SelectForSearch>
</template>