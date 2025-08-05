<script setup>
import Select from "@/volt/Select.vue";
import {ref, useTemplateRef, watch} from "vue";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import { vIntersectionObserver } from '@vueuse/components'
import {useI18n} from "vue-i18n";
import TimesIcon from '@primevue/icons/times';
import {useRoute} from "vue-router";

const props = defineProps({
    items: {
        type: Array,
        required: true
    },
    totalItems: {
        type: Number,
        required: true
    },
    itemsPerPage: {
        type: Number,
        default: 7
    },
    fetch: {
        type: Function,
        required: true
    },
    firstFetch: {
        type: Function,
        required: true
    }
})

const { t } = useI18n()
const product = defineModel()
const route = useRoute()

const productSelect = useTemplateRef('productSelect')
const isVisible = ref(false);
const isLoadingNextPartProduct = ref(false);
const filterForSelect = ref({
    page: 1,
    itemsPerPage: props.itemsPerPage,
    product: null,
});
const debouncedNameForSelect = useDebouncedRef(props.items.find(item => item.id === route.params.product) || null,  500)

function onIntersectionObserver([entry]) {
    isVisible.value = entry?.isIntersecting || false
}

function setProduct(id) {
    if(id) {
        product.value = id
    } else {
        product.value = null
    }
}

watch([() => debouncedNameForSelect.value], async () => {
    const queryFilter = {
        page: filterForSelect.value.page,
        "items-per-page": filterForSelect.value.itemsPerPage,
    };

    if(debouncedNameForSelect.value) {
        queryFilter.name = debouncedNameForSelect.value
    }

    isLoadingNextPartProduct.value = true

    await props.firstFetch(queryFilter)

    isLoadingNextPartProduct.value = false
})

watch(isVisible, async newVal => {
    if(newVal) {
        isLoadingNextPartProduct.value = true
        filterForSelect.value.page++;

        await props.fetch({ page: filterForSelect.value.page, 'items-per-page': filterForSelect.value.itemsPerPage, name: product.value })
        // await productStore.fetchProducts({ page: productSelectPage.value, 'items-per-page': 7, name: filters.value.product })
        //     .then(() => {
        //         items.value = [...items.value, ...productStore.getProducts.models]
        //     })

        isLoadingNextPartProduct.value = false
    }
})

const selectRef = ref('selectRef');

function handleClear(clearCallback) {
    clearCallback();
    setProduct(null)
    selectRef.value?.clear(); // Dropdownga show bo'lishni bloklaydi
}

</script>

<template>
    {{debouncedNameForSelect}} product: {{product}}
    <Select
        ref="selectRef"
        v-model="debouncedNameForSelect"
        :options="items"
        option-label="name"
        option-value="id"
        :placeholder="t('placeholders.search.byProduct')"
        showClear
        :loading="isLoadingNextPartProduct"
        class="col-span-2 sm:col-span-1 md:min-w-50 max-w-full w-full"
        editable
        @hide="() => filterForSelect.page = 1"
        @value-change="setProduct"
        @change="event => debouncedNameForSelect = event.value ? event.value.name : null"
    >
        <template #clearicon="{ clearCallback }">
            <TimesIcon @click="handleClear(clearCallback)" class="text-surface-400 absolute top-1/2 -mt-2 end-10" />
        </template>

        <template #option="{option, index}">
            <div>
                {{option.name}}
                <div
                    v-intersection-observer="[onIntersectionObserver, { productSelect }]"
                    v-if="index + 1 === items.length && totalItems > items.length && items.length"
                ></div>
            </div>
        </template>
    </Select>
</template>
