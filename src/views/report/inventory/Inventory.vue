<script setup>
import Section from "@/components/UI/Section.vue";
import {useI18n} from "vue-i18n";
import {computed, onMounted, ref} from "vue";
import {useInventoryStore} from "@/stores/inventory.js";
import {useRoute} from "vue-router";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import NoData from "@/components/UI/NoData.vue";
import Column from "primevue/column";
import DataTable from "@/volt/DataTable.vue";
import {formatCurrency, getFormattedDate} from "@/helpers/numberFormat.js";

const { t } = useI18n();
const route = useRoute()
const isLoading = ref(true)
const inventoryProducts = ref([])
const inventoryKits = ref([])

const inventoryStore = useInventoryStore()

const home = ref({
    icon: 'pi pi-home',
    label: t('reports'),
    route: '/reports'
});

const items = computed(() => [{ label: t('cards.inventories'), route: { name: 'inventories'} }, { label: t('cards.inventory') }]);

onMounted(async () => {
    await inventoryStore.fetchInventory(route.params.id)
    inventoryProducts.value = inventoryStore.getInventory.inventoryProducts
    inventoryKits.value = inventoryStore.getInventory.inventoryKits
    isLoading.value = false
})
</script>

<template>
    <Breadcrumb :home="home" :model="items" class="rounded-md border border-surface-300 dark:border-surface-600/50">
        <template #item="{ item, props }">
            <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom class="group hidden lg:block">
                <a :href="href" v-bind="props.action" @click="navigate">
                    <span class="text-surface-700 dark:text-surface-0 group-hover:text-main dark:group-hover:text-green transition-all">{{ item.label}}</span>
                </a>
            </router-link>
            <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom class="group lg:hidden">
                <a :href="href" v-bind="props.action" @click="navigate">
                    <span class="text-surface-700 dark:text-surface-0 group-hover:text-main dark:group-hover:text-green transition-all">{{ item.route === '/administration' ? '..' : item.label}}</span>
                </a>
            </router-link>
            <a v-else :href="item.url" :target="item.target" v-bind="props.action">
                <span class="text-main dark:text-green font-semibold">{{ item.label }}</span>
            </a>
        </template>
        <template #separator>
            <span>/</span>
        </template>
    </Breadcrumb>

    <Section
        :section-name="t('cards.inventory')"
        back-route-name="inventories"
        without-buttons
    >
        <template #sectionBody>
            <NoData v-if="!inventoryProducts.length && !isLoading" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <Card
                v-else
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        :value="isLoading ? Array(10).fill({}) : inventoryProducts"
                        :total-records="100"
                        :rows="100"
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
                                <p v-else>{{ data.locationQuantity.product.name }}</p>
                            </template>
                        </Column>
                        <Column field="color" :header="t('labels.color')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.locationQuantity.color ? data.locationQuantity.color.name : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="expiryDate" :header="t('labels.expiryDate')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.locationQuantity.expiryDate ? getFormattedDate(data.locationQuantity.expiryDate) : '-' }}</p>
                            </template>
                        </Column>
                        <Column field="income" :header="t('labels.initial')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.initialQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="income" :header="t('labels.income')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.incomeQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="expense" :header="t('labels.expense')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.expenseQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="writeOffInvoices" :header="t('cards.writeOffInvoices')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.writeOffQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="currentQty" :header="t('labels.currentQty')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.currentQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="factQty" :header="t('labels.factQty')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.factQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="price" :header="t('labels.price')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.costPrice) }}$</p>
                            </template>
                        </Column>
                        <Column field="currentPrice" :header="t('labels.currentPrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.costPrice * data.currentQty) }}$</p>
                            </template>
                        </Column>
                        <Column field="factPrice" :header="t('labels.factPrice')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.costPrice * data.factQty) }}$</p>
                            </template>
                        </Column>
                        <Column field="difference" :header="t('labels.difference')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p
                                    v-else
                                    :class="{
                                        'text-green-600': (data.costPrice * data.factQty) - (data.costPrice * data.currentQty) >= 0,
                                        'text-red-600': (data.costPrice * data.factQty) - (data.costPrice * data.currentQty) < 0
                                    }"
                                >
                                    {{ formatCurrency((data.costPrice * data.factQty) - (data.costPrice * data.currentQty)) }}$
                                </p>
                            </template>
                        </Column>
                        <Column field="forTheKit" :header="t('labels.forTheKit')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.kitProductQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                        <Column field="totalFact" :header="t('labels.totalFact')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ formatCurrency(data.factQty + data.kitProductQty) }} {{ t(`labels.${data.locationQuantity.product.category.unit.name}`) }}</p>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Section>
</template>
