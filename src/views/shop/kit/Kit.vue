<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import {computed, onMounted, ref} from "vue";
import {useKitStore} from "@/stores/kit.js";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {useRoute} from "vue-router";
import NoData from "@/components/UI/NoData.vue";
import Column from "primevue/column";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import DataTable from "@/volt/DataTable.vue";
import {formatCurrency} from "@/helpers/numberFormat.js";

const { t } = useI18n();
const route = useRoute()
const isLoading = ref(true)

const kitStore = useKitStore()

const home = ref({
    icon: 'pi pi-home',
    label: t('shop'),
    route: '/shop'
});

const items = computed(() => [{ label: t('cards.kits'), route: { name: 'kits'} }, { label: t('labels.kit') }]);

onMounted(async () => {
    await kitStore.fetchKit(route.params.id)
    isLoading.value = false
})
</script>

<template>
    <Breadcrumb
        :home="home"
        :model="items"
        class="mb-2 sm:mb-4 rounded-md border border-surface-300 dark:border-surface-600/50"
    >
        <template #item="{ item, props }">
            <router-link
                v-if="item.route"
                v-slot="{ href, navigate }"
                :to="item.route"
                custom
                class="group"
            >
                <a :href="href" v-bind="props.action" @click="navigate">
                <span class="text-surface-700 dark:text-surface-0 group-hover:text-main dark:group-hover:text-green transition-all">
                    {{ item.label }}
                </span>
                </a>
            </router-link>
            <a v-else :href="item.url" :target="item.target" v-bind="props.action">
                <span class="text-main dark:text-green font-semibold">{{ item.label }}</span>
            </a>
        </template>
        <template #separator>
            <span class="text-primary">/</span>
        </template>
    </Breadcrumb>

    <Section
        :section-name="t('labels.kit')"
        back-route-name="kits"
        without-buttons
    >
        <template #sectionBody>
            <NoData v-if="!kitStore.getKit.totalItems && !isLoading" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF USERS -->
            <Card
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        ref="dt"
                        :value="isLoading ?  Array(10).fill({}) : kitStore.getKit.models"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
                        <Column field="id" :header="t('labels.id')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.id }}</p>
                            </template>
                        </Column>
                        <Column field="product" :header="t('labels.product')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.product.name }}</p>
                            </template>
                        </Column>
                        <Column field="code" :header="t('labels.code')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.product.code }}</p>
                            </template>
                        </Column>
                        <Column field="qr" :header="t('labels.qr')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.product.qr || '-' }}</p>
                            </template>
                        </Column>
                        <Column field="category" :header="t('labels.category')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.product.category.name }}</p>
                            </template>
                        </Column>
                        <Column field="categoryType" :header="t('labels.type')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.product.category.categoryType.name }}</p>
                            </template>
                        </Column>
                        <Column field="amount" :header="t('labels.amount')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.qty) }} {{ t(`labels.${data.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="retailPrice" :header="t('labels.retailPrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.product.retailPrice ? `${formatCurrency(data.product.retailPrice)}$` : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="wholesalePrice" :header="t('labels.wholesalePrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.product.wholesalePrice ? `${formatCurrency(data.product.wholesalePrice)}$` : '-' }}</p>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
