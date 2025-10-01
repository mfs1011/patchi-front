<script setup>
import Section from "@/components/UI/Section.vue";
import { useI18n } from "vue-i18n";
import {computed, onMounted, ref} from "vue";
import {useKitStore} from "@/stores/kit.js";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import NoData from "@/components/UI/NoData.vue";
import Column from "primevue/column";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import DataTable from "@/volt/DataTable.vue";
import {formatCurrency} from "@/helpers/numberFormat.js";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import InputText from "@/volt/InputText.vue";
import {useSellerStore} from "@/stores/seller.js";
import InputNumber from "@/volt/InputNumber.vue";
import {useAssemblyStore} from "@/stores/assembly.js";
import Button from "@/volt/Button.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import {useKitValidation} from "@/views/shop/kit/useKitForm.js";
import Dialog from "@/volt/Dialog.vue";
import {useToast} from "primevue/usetoast";
import {useUserStore} from "@/stores/user.js";
import {exportKit} from "@/helpers/xlsx.js";

const { t } = useI18n();
const route = useRoute()
const router = useRouter();
const toast = useToast()
const isLoading = ref(true)

const kitStore = useKitStore()
const sellerStore = useSellerStore()
const assemblyStore = useAssemblyStore()
const userStore = useUserStore()
const editMode = ref(false);
const pendingNavigation = ref(false);
const isEdited = ref(false);
const showLeaveDialog = ref(false);
const isConfirmLoading = ref(false);

const {
    kitHandleSubmit,
    kitErrors,
    kitIsSubmitting,
    kitResetForm,
    kitFormCtx,
    seller,
    qr,
    code,
    name,
    assembly,
    wholesalePrice,
    retailPrice,
    qty
} = useKitValidation();

const home = ref({
    icon: 'pi pi-home',
    label: t('shop'),
    route: '/shop'
});

const dt = ref();
const exportCSV = () => {
    exportKit(
        kitStore.getKit.filteredKitProducts,
        {
          seller: seller.value,
          qr: qr.value,
          code: code.value,
          name: name.value,
          assembly: assembly.value,
          wholesalePrice: wholesalePrice.value,
          retailPrice: retailPrice.value,
          qty: qty.value,
        }
    )
};

const items = computed(() => [{ label: t('cards.kits'), route: { name: 'kits'} }, { label: t('labels.kit') }]);

const sumPriceOfKitProducts = computed(() => {
    return kitStore.getKit.filteredKitProducts.length === 0 ? 0
        : kitStore.getKit.filteredKitProducts.reduce((acc, kitProduct) => {
            return acc + (kitProduct?.product.retailPrice * kitProduct.qty)
        }, 0)
})

function cancelEditing() {
    editMode.value = false;
    kitResetForm()
}

const isChanged = computed(() => (
    kitStore.getKit?.seller?.id !== seller.value?.id ||
    kitStore.getKit?.qr !== qr.value ||
    kitStore.getKit?.code !== code.value ||
    kitStore.getKit?.name !== name.value ||
    kitStore.getKit?.assembly?.id !== assembly.value?.id ||
    kitStore.getKit?.wholesalePrice !== wholesalePrice.value ||
    kitStore.getKit?.retailPrice !== retailPrice.value ||
    kitStore.getKit?.qty !== qty.value
));

const onSubmitIncomeInvoice = kitHandleSubmit(async values => {
    const payload = {};

    if (values.seller?.id !== kitStore.getKit?.seller?.id) {
        payload.seller = values.seller['@id']
    }

    if (values.qr !== kitStore.getKit?.qr) {
        payload.qr = values.qr
    }

    if (values.code !== kitStore.getKit?.code) {
        payload.code = values.code
    }

    if (values.name !== kitStore.getKit?.name) {
        payload.name = values.name
    }

    if (values.assembly?.id !== kitStore.getKit?.assembly?.id) {
        payload.assembly = values.assembly['@id']
    }

    if (values.wholesalePrice !== kitStore.getKit?.wholesalePrice) {
        payload.wholesalePrice = values.wholesalePrice
    }

    if (values.retailPrice !== kitStore.getKit?.retailPrice) {
        payload.retailPrice = values.retailPrice
    }

    if (values.qty !== kitStore.getKit?.qty) {
        payload.qty = values.qty
    }

    try {
        await kitStore.putKit(payload, route.params.id)
        editMode.value = false
        isEdited.value = true
        toast.add({
            severity: 'success',
            summary: t('toast.successEditingSave'),
            life: 3000
        })
        router.back()
    } catch (error) {
        if (error.status === 439) {
            toast.add({ severity: 'error', summary: t('toast.already_exists_error', { field: t('code.nominativeCapitalize') }), life: 3000 })
        } else if (error.status === 412) {
            toast.add({ severity: 'error', summary: t('toast.notEnough', { field: t('code.nominativeCapitalize') }), life: 3000 })
        } else {
            toast.add({ severity: 'error', summary: t('toast.internalServerError'), life: 3000 })
        }
    }
})

onBeforeRouteLeave((to, from, next) => {
    if (isChanged.value && !isEdited.value) {
        showLeaveDialog.value = true
        pendingNavigation.value = next
    } else {
        next()
    }
})

const confirmLeave = () => {
    showLeaveDialog.value = false
    if (pendingNavigation.value) {
        pendingNavigation.value()
    }
}

onMounted(async () => {
    await kitStore.fetchKit(route.params.id)

    setTimeout(() => {
        kitResetForm({
            values: {
                seller: kitStore.getKit.seller,
                qr: kitStore.getKit.qr,
                code: kitStore.getKit.code,
                name: kitStore.getKit.name,
                assembly: kitStore.getKit.assembly,
                wholesalePrice: kitStore.getKit.wholesalePrice,
                retailPrice: kitStore.getKit.retailPrice,
                qty: kitStore.getKit.qty
            }
        })
    })

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
    >
        <template #buttons>
            <div class="flex sm:justify-end grow gap-2 sm:gap-4">
                <Button
                    v-if="!editMode"
                    icon="pi pi-pencil"
                    @click="editMode = true"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.edit')"
                    :loading="kitIsSubmitting"
                    :disabled="userStore.getAboutMe.role?.name !== 'ROLE_ADMIN' && userStore.getAboutMe.id !== kitStore.getKit.createdBy?.id"
                />
                <SecondaryButton
                    v-if="editMode"
                    @click="cancelEditing"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap bg-surface-0! dark:bg-surface-800!"
                    :label="t('dialog.cancel')"
                />
                <Button
                    v-if="editMode"
                    :disabled="!isChanged"
                    icon="pi pi-save"
                    @click="onSubmitIncomeInvoice"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                />
            </div>
        </template>

        <template #sectionBody>
            <Card
                pt:root=" overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #header>
                    <div class="pt-5 px-5">
                        <Button
                            @click="exportCSV"
                            icon="pi pi-file-excel"
                            pt:root="bg-teal-500 dark:bg-teal-500 enabled:hover:bg-teal-400 dark:enabled:hover:bg-teal-400 border-teal-500 dark:border-teal-500 enabled:hover:border-teal-400 dark:enabled:hover:border-teal-400 focus-visible:outline-teal-500 dark:focus-visible:outline-teal-500"
                            size="small"
                            label="Export"
                        />
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm">{{ t('labels.Seller') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="seller"
                                :fetchFn="sellerStore.fetchSellers"
                                :options="sellerStore.getSellers.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.seller')"
                                :loading="sellerStore.getIsLoadingSellers"
                                :total-items="sellerStore.getSellers.totalItems"
                                :invalid="!!kitErrors.seller"
                                :disabled="!editMode"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.qr') }}</p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <InputText
                                v-if="!isLoading"
                                v-model.trim="qr"
                                fluid
                                :placeholder="t('placeholders.qr')"
                                :disabled="!editMode"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.code') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <InputText
                                v-if="!isLoading"
                                v-model.trim="code"
                                fluid
                                :placeholder="t('placeholders.code')"
                                :class="{ 'p-invalid': kitErrors.code }"
                                :invalid="!!kitErrors.code"
                                :disabled="!editMode"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.title') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <InputText
                                v-if="!isLoading"
                                v-model.trim="name"
                                fluid
                                :placeholder="t('placeholders.name')"
                                :class="{ 'p-invalid': kitErrors.name }"
                                :invalid="!!kitErrors.name"
                                :disabled="!editMode"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.collection') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="assembly"
                                :fetchFn="assemblyStore.fetchAssemblies"
                                :options="assemblyStore.getAssemblies.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.name"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.select.collection')"
                                :loading="assemblyStore.getIsLoadingAssembly"
                                :total-items="assemblyStore.getAssemblies.totalItems"
                                :invalid="!!kitErrors.assembly"
                                :disabled="!editMode"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.wholesalePrice') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="wholesalePrice"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.wholesalePrice')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!kitErrors.wholesalePrice"
                                :disabled="!editMode"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.retailPrice') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="retailPrice"
                                fluid
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                showButtons
                                :placeholder="t('placeholders.retailPrice')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :invalid="!!kitErrors.retailPrice"
                                :disabled="!editMode"
                            />
                        </div>

                        <div>
                            <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                            <InputNumber
                                v-model="qty"
                                fluid
                                showButtons
                                :placeholder="t('placeholders.qty')"
                                :minFractionDigits="1"
                                :maxFractionDigits="2"
                                :disabled="!editMode"
                            />
                        </div>
                    </div>
                </template>
            </Card>

            <NoData v-if="!kitStore.getKit.filteredKitProducts.length && !isLoading" class="text-surface-400 mx-auto my-auto">
                <p class="text-xl font-normal">{{ t("noResults") }}</p>
            </NoData>

            <!-- TABLE OF PRODUCTS -->
            <Card
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <DataTable
                        ref="dt"
                        :value="isLoading ?  Array(10).fill({}) : kitStore.getKit.filteredKitProducts"
                        scrollable
                        pt:footer="border-none dark:bg-surface-800"
                        pt:root="border border-surface-300 dark:border-surface-600/50"
                    >
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
                        <Column field="color" :header="t('labels.color')">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.color?.name || '-' }}</p>
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
                        <Column field="exclude" header="...">
                            <template #body="{ data }">
                                <Skeleton height="2rem" v-if="isLoading"/>
                                <p v-else>{{ data.exclude ? 'exclude': 'include' }}</p>
                            </template>
                        </Column>
                        <template #footer>
                            <div class="mt-auto col-span-full flex justify-end font-medium">{{ t('labels.totals') }}: {{ formatCurrency(sumPriceOfKitProducts) }} $</div>
                        </template>
                    </DataTable>
                </template>
            </Card>

            <!-- CANCEL CHANGES BEFORE LEAVE CURRENT ROUTE DIALOG -->
            <Dialog
                v-model:visible="showLeaveDialog"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.leaveFromEditMessage') }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton type="button" :label="t('dialog.cancel')" @click="showLeaveDialog = false" />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="confirmLeave"
                            class="px-5"
                            :loading="isConfirmLoading"
                        />
                    </div>
                </template>
            </Dialog>
        </template>
    </Section>
</template>
