<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import Select from "@/volt/Select.vue";
import {useSupplierStore} from "@/stores/supplier.js";
import useDebouncedRef from "@/composables/useDebouncedRef.js";
import Skeleton from "@/volt/Skeleton.vue";
import {useProductStore} from "@/stores/product.js";
import {ref, watch} from "vue";
import { vIntersectionObserver } from "@vueuse/components";
import updateQuery from "@/helpers/updateQuery.js";
import {useRoute, useRouter} from "vue-router";
import SearchSelect from "@/components/UI/SearchSelect.vue";

const { t } = useI18n();
const productStore = useProductStore()
const debouncedProduct = useDebouncedRef('', 300)
const isVisible = ref(false)
const products = ref([])
const selectedProduct = ref()
const filters = ref({
    page: 1,
    name: debouncedProduct.value || '',
    itemsPerPage: 6,
})

watch(debouncedProduct, async (newVal) => {
    filters.value.page = 1
    if (typeof debouncedProduct.value === 'string') {
        const queryFilter = {
            page: filters.value.page,
            "items-per-page": filters.value.itemsPerPage,
        };

        if (newVal) {
            queryFilter.name = newVal;
        } else {
            delete queryFilter.name;
        }

        await productStore.fetchProducts(queryFilter)
        products.value = productStore.getProducts.models
    }
}, { immediate: true })

watch(isVisible, async () => {
    const queryFilter = {
        page: ++filters.value.page,
        "items-per-page": filters.value.itemsPerPage,
    };

    await productStore.fetchProducts(queryFilter)
    products.value = [...products.value, ...productStore.getProducts.models]
})

function onIntersectionObserver([entry]) {
    if (entry?.isIntersecting) {
        isVisible.value = true
    }
}

</script>

<template>
    <Section
        :add-button-name="t('buttons.newTransferInvoice')"
        :section-name="t('cards.transferInvoices')"
        back-route-name="shop"
    >
        <template #sectionBody>
            <div>
                <p class="text-sm">{{ t('labels.supplier') }}<span class="text-red-500"> *</span></p>

                <SearchSelect
                    v-model="selectedProduct"
                    :fetchFn="productStore.fetchProducts"
                    :options="productStore.getProducts.models"
                    :option-label="opt => `${opt.name} / ${opt.code} / ${opt.category.name}`"
                    :placeholder="t('placeholders.select.supplier')"
                    :loading="productStore.getIsLoadingProducts"
                    :total-items="productStore.getProducts.totalItems"
                />
            </div>

        </template>
    </Section>
</template>
