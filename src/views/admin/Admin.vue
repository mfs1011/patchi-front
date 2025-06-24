<script setup>
import Card from "@/volt/Card.vue";
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const { t } = useI18n();

const cards = computed(() => [
    { id: 1, name: t('cards.users'), image: 'Users.png', routeName: 'users' },
    { id: 2, name: t('cards.clients'), image: 'Clients.png', routeName: 'clients' },
    { id: 4, name: t('cards.suppliers'), image: 'Suppliers.png', routeName: 'suppliers' },
    { id: 5, name: t('cards.products'), image: 'Products.png', routeName: 'products' },
    { id: 6, name: t('cards.warehouses'), image: 'Warehouses.png', routeName: 'warehouses' },
    { id: 7, name: t('cards.shops'), image: 'Market.png', routeName: 'shops' },
    { id: 8, name: t('cards.categories'), image: 'Category.png', routeName: 'categories' },
    { id: 9, name: t('cards.currency_rates'), image: 'UsdRate.png', routeName: 'currency_rates' },
])

</script>

<template>
    <div class="min-h-full flex flex-col">
        <div class="my-auto min-h-full grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
            <router-link
                v-for="card of cards"
                :key="card.id"
                :to="{ name: card.routeName }"
            >
                <Card
                    pt:root="h-full rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group hover:bg-surface-200 dark:hover:bg-surface-900 transition-all"
                    pt:body="p-0 h-full"
                    pt:content="sm:p-6"
                    pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
                >
                    <template #title>
                        <div class="border-b border-surface-300 dark:border-surface-700 px-5 py-3 lg:py-4 text-center">
                            <p>{{ card.name }}</p>
                        </div>
                    </template>
                    <template #content>
                        <div class="px-5 py-2.5 sm:py-0 flex sm:justify-center items-center group-hover:scale-110 transition-all gap-5">
                            <img
                                :src="`/button_imgs/${card.image}`"
                                alt="users"
                                class="object-cover size-20 sm:size-26 md:size-30 lg:size-34 my-auto transition-all"
                            >

                            <div class="sm:hidden border-l border-surface-300 px-5 py-4 text-center h-full sm:h-fit">
                                <p class="text-xl font-normal">{{ card.name }}</p>
                            </div>
                        </div>
                    </template>
                </Card>
            </router-link>
        </div>
    </div>
</template>
