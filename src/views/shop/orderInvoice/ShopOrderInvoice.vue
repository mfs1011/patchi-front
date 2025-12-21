<script setup>
import {onBeforeRouteLeave, useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import SearchSelect from "@/components/UI/SearchSelect.vue";
import Section from "@/components/UI/Section.vue";
import Breadcrumb from "@/volt/Breadcrumb.vue";
import Dialog from "@/volt/Dialog.vue";
import DataTable from "@/volt/DataTable.vue";
import Column from "primevue/column";
import InputNumber from "@/volt/InputNumber.vue";
import Skeleton from "@/volt/Skeleton.vue";
import Card from "@/volt/Card.vue";
import SecondaryButton from "@/volt/SecondaryButton.vue";
import Button from "@/volt/Button.vue";
import NoData from "@/components/UI/NoData.vue";
import {useI18n} from "vue-i18n";
import {useLocationStore} from "@/stores/location.js";
import {formatCurrency, formatDateTimeLocal} from "@/helpers/numberFormat.js";
import {useToast} from "primevue/usetoast";
import Tabs from "@/volt/Tabs.vue";
import TabPanels from "@/volt/TabPanels.vue";
import Tab from "@/volt/Tab.vue";
import TabPanel from "@/volt/TabPanel.vue";
import TabList from "@/volt/TabList.vue";
import {useUserStore} from "@/stores/user.js";
import {useOrderInvoiceStore} from "@/stores/orderInvoice.js";
import {useCustomerStore} from "@/stores/customer.js";
import {useProductStore} from "@/stores/product.js";
import {useKitStore} from "@/stores/kit.js";
import DatePicker from "@/volt/DatePicker.vue";
import {usePaymentStore} from "@/stores/payment.js";
import {useUSDRateStore} from "@/stores/usdRate.js";
import {useSellerStore} from "@/stores/seller.js";
import {useShopOrderInvoiceValidation} from "@/views/shop/orderInvoice/useShopOrderInvoiceForm.js";

const route = useRoute();
const router = useRouter();
const toast = useToast()
const orderInvoiceStore = useOrderInvoiceStore();
const paymentStore = usePaymentStore();
const usdRateStore = useUSDRateStore();
const userStore = useUserStore();
const productStore = useProductStore();
const kitStore = useKitStore();
const locationStore = useLocationStore();
const sellerStore = useSellerStore();
const customerStore = useCustomerStore();
const { t } = useI18n();
const {
    orderInvoiceHandleSubmit,
    orderInvoiceErrors,
    orderInvoiceIsSubmitting,
    orderInvoiceResetForm,
    orderInvoiceFormCtx,
    location,
    seller,
    customer,
    createdAt,
    productHandleSubmit,
    productErrors,
    productIsSubmitting,
    productResetForm,
    productFormCtx,
    productValidate,
    product,
    productColor,
    productQty,
    productPrice,
    kitHandleSubmit,
    kitErrors,
    kitIsSubmitting,
    kitResetForm,
    kitFormCtx,
    kitValidate,
    kit,
    kitQty,
    kitPrice,
    paymentHandleSubmit,
    paymentErrors,
    paymentIsSubmitting,
    paymentResetForm,
    paymentFormCtx,
    paymentValidate,
    orderInvoicePrices,
    payment,
    amount
} = useShopOrderInvoiceValidation();

const apiData = ref(null);
const editableData = ref(null);
const currentProductIndex = ref(null);
const currentKitIndex = ref(null);
const currentPaymentIndex = ref(null);
const currentDeleteProduct = ref(null);
const currentDeleteKit = ref(null);
const currentDeletePayment = ref(null);
const deletedData = ref([]);
const createdData = ref([]);
const updatedData = ref([]);
const deletedKitData = ref([]);
const createdKitData = ref([]);
const updatedKitData = ref([]);
const deletedPriceData = ref([]);
const createdPriceData = ref([]);
const updatedPriceData = ref([]);
const editMode = ref(false);
const isLoading = ref(true);
const deleteProductVisible = ref(false);
const deleteKitVisible = ref(false);
const deletePaymentVisible = ref(false);
const isDeleteProductLoading = ref(false);
const isDeleteKitLoading = ref(false);
const isDeletePaymentLoading = ref(false);
const showLeaveDialog = ref(false);
const isEditing = ref(false);
const pendingNavigation = ref(false);
const isEdited = ref(false);
const isConfirmLoading = ref(false);
const tabVal = ref('products')

// computed
const home = computed(() => ({
    icon: "pi pi-slash",
    label: t("shop"),
    route: "/shop",
}));

const exportCSV = () => {
    console.log('export')
};

const items = computed(() => [{ label: t("cards.orderInvoices"), route: { name: 'shop-order-invoices'} }, { label: t("cards.orderInvoice") }]);
const isAdminOrCreatedBy = createdById => (
    userStore.getAboutMe.role.name === 'ROLE_ADMIN' || userStore.getAboutMe.id === createdById
)
const tabList = computed(() => [
    { value: 'products', label: t('cards.products')},
    { value: 'kits', label: t('cards.kits')},
    { value: 'payments', label: t('cards.payments')},
])
const isChanged = computed(() => (
    createdData.value.length ||
    updatedData.value.length ||
    deletedData.value.length ||
    createdKitData.value.length ||
    updatedKitData.value.length ||
    deletedKitData.value.length ||
    createdPriceData.value.length ||
    updatedPriceData.value.length ||
    deletedPriceData.value.length ||
    (orderInvoiceStore.getOrderInvoice.totalPrice === totalPayments.value) ||
    orderInvoiceStore.getOrderInvoice?.customer?.id !== customer.value?.id
));

const totalPrice = computed(() => {
    const productsTotal = editableData.value.orderInvoiceProducts.reduce((sum, item) => {
        return sum + (item.qty * item.price)
    }, 0)

    const kitsTotal = editableData.value.orderInvoiceKits.reduce((sum, item) => {
        return sum + (item.qty * item.price)
    }, 0)

    return productsTotal + kitsTotal
})

const isPayment = computed(() => {
    if (orderInvoiceStore.getOrderInvoice.seller) {
        const discount = Number(orderInvoiceStore.getOrderInvoice.seller.discount)
        const minAllowed = totalPrice.value - (totalPrice.value * discount / 100)

        return totalPayments.value >= minAllowed;
    } else {
        return true
    }
})

const isAcceptedOrderInvoice = computed(() => orderInvoiceStore.getOrderInvoice.status === 2)

const totalPayments = computed(() => {
    const total = editableData.value.orderInvoicePrices.reduce((sum, item) => {
        const amount = item.payment.id === 1 ? item.amount * usdRateStore.getUSDRate.rate : item.amount
        return sum + amount
    }, 0)

    return Math.floor(total)
})

// functions
const onSubmitProduct = productHandleSubmit((values) => {
    addProduct(values)
})

const onEditProduct = productHandleSubmit((values) => {
    editProduct(values)
})

const onEditKit = kitHandleSubmit((values) => {
    editKit(values)
})

const onEditPayment = paymentHandleSubmit((values) => {
    editPayment(values)
})

const onSubmitKit = kitHandleSubmit((values) => {
    addKit(values)
})

const onSubmitPayment = paymentHandleSubmit((values) => {
    addPayment(values)
})

const onSubmitOrderInvoice = orderInvoiceHandleSubmit(async (values) => {
    const payload = {};

    payload.orderInvoiceProducts = [...createdData.value, ...updatedData.value, ...deletedData.value]
    payload.orderInvoiceKits = [...createdKitData.value, ...updatedKitData.value, ...deletedKitData.value]
    payload.orderInvoicePrices = [...createdPriceData.value, ...updatedPriceData.value, ...deletedPriceData.value]

    if (!payload.orderInvoiceProducts.length) {
        delete payload.orderInvoiceProducts
    }

    if (!payload.orderInvoiceKits.length) {
        delete payload.orderInvoiceKits
    }

    if (!payload.orderInvoicePrices.length) {
        delete payload.orderInvoicePrices
    }

    if (values.customer?.id !== apiData.value.customer?.id) {
        payload.customer = values.customer['@id']
    }

    try {
        await orderInvoiceStore.putOrderInvoice(payload, route.params.id)

        isEditing.value = false
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
    } finally {
        createdData.value = []
        deletedData.value = []
        updatedData.value = []
        createdKitData.value = []
        deletedKitData.value = []
        updatedKitData.value = []
        createdPriceData.value = []
        deletedPriceData.value = []
        updatedPriceData.value = []
    }
})

const clearProductForm = () => {
    isEditing.value = false
    productResetForm()
}

const clearKitForm = () => {
    isEditing.value = false
    kitResetForm()
}

const clearPaymentForm = () => {
    isEditing.value = false
    paymentResetForm()
}

function addProduct(newProduct) {
    const exists = editableData.value.orderInvoiceProducts.some(o =>
        o.product.id === newProduct.product.id &&
        (o.color?.id ?? null) === (newProduct.product.colorId ?? null)
    );


    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const { qty, price, product } = newProduct;

    editableData.value.orderInvoiceProducts.push(
        {
            product: {id: product.id, name: product.name, code: product.code, category: {name: product.category, unit: {name: product.unit}}, assembly: {name: product.assembly}},
            color: product.color ? {name: product.color} : null,
            qty: qty,
            price: price
        }
    );

    const payload = {product: `/api/products/${product.id}`, qty: qty, price: price}

    if (product.color) {
        payload.color = `/api/colors/${product.color.id}`
    }

    createdData.value.push(payload)

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('product.nominativeCapitalize') }),
        life: 3000
    })

    productResetForm();
}

function addKit(newKit) {
    const exists = editableData.value.orderInvoiceKits.some(o => o.kit.id === newKit.kit.id);

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('kit.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const { qty, price, kit } = newKit;

    editableData.value.orderInvoiceKits.push(
        {
            kit: {id: kit.id, name: kit.name, code: kit.code, assembly: {name: kit.assembly}},
            qty: qty,
            price: price
        }
    );

    createdKitData.value.push({ kit: `/api/kits/${kit.id}`, qty: qty, price: price})

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('kit.nominativeCapitalize') }),
        life: 3000
    })

    kitResetForm();
}

function addPayment(newPayment) {
    const exists = editableData.value.orderInvoicePrices.some(o => o.payment.id === newPayment.payment.id);

    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('payment.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const { amount, payment } = newPayment;

    editableData.value.orderInvoicePrices.push({payment: payment, amount: amount});
    createdPriceData.value.push({ payment: `/api/payments/${payment.id}`, amount: amount})

    toast.add({
        severity: 'success',
        summary: t('toast.added', { name: t('payment.nominativeCapitalize') }),
        life: 3000
    })

    paymentResetForm();
}

function editProductAction(data, index) {
    isEditing.value = true;
    currentProductIndex.value = index
    product.value = data.product;
    productQty.value = data.qty;
    productPrice.value = data.price;
}

function editProduct(updatedProduct) {
    // Duplicate check
    const exists = editableData.value.orderInvoiceProducts.some((p, i) => {
        if (i === currentProductIndex.value) return false;
    });


    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('product.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const current = editableData.value.orderInvoiceProducts[currentProductIndex.value];

    const payload = {};

    if (updatedProduct.product.id !== current.product.id) {
        payload.product = updatedProduct.product
    }

    if (updatedProduct.qty !== current.qty) {
        payload.qty = updatedProduct.qty
    }

    if (updatedProduct.price !== current.price) {
        payload.price = updatedProduct.price
    }

    if (current.id) {
        payload.orderInvoiceProduct = current['@id']
        const indexFromUpdatedData = updatedData.value.findIndex(
            data => data.orderInvoiceProduct === payload.orderInvoiceProduct
        )

        if (indexFromUpdatedData !== -1) {
            updatedData.value[indexFromUpdatedData] = {
                ...payload
            }
        } else {
            updatedData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.orderInvoiceProducts[currentProductIndex.value] = {
            orderInvoiceProduct: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.orderInvoiceProducts[currentProductIndex.value] = {
            ...current,
            ...payload
        };

        const index = createdData.value.findIndex(p => (
            p.product.id === current.product.id
        ))

        if (index !== -1) {
            // Agar mavjud bo‘lsa yangilash
            createdData.value[index] = { ...createdData.value[index], ...updatedProduct }
        } else {
            // Aks holda push qilish
            createdData.value.push(updatedProduct)
        }
    }

    clearProductForm()
}

function editKitAction(data, index) {
    isEditing.value = true;
    currentKitIndex.value = index
    kit.value = data.kit;
    kitQty.value = data.qty;
    kitPrice.value = data.price;
}

function editKit(updatedKit) {
    // Duplicate check
    const exists = editableData.value.orderInvoiceKits.some((p, i) => {
        if (i === currentKitIndex.value) return false;
    });


    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('kit.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const current = editableData.value.orderInvoiceKits[currentKitIndex.value];

    const payload = {};

    if (updatedKit.kit.id !== current.kit.id) {
        payload.kit = updatedKit.kit
    }

    if (updatedKit.qty !== current.qty) {
        payload.qty = updatedKit.qty
    }

    if (updatedKit.price !== current.price) {
        payload.price = updatedKit.price
    }

    if (current.id) {
        payload.orderInvoiceKit = current['@id']
        const indexFromUpdatedData = updatedKitData.value.findIndex(
            data => data.orderInvoiceKit === payload.orderInvoiceKit
        )

        if (indexFromUpdatedData !== -1) {
            updatedKitData.value[indexFromUpdatedData] = {
                ...payload
            }
        } else {
            updatedKitData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.orderInvoiceKits[currentKitIndex.value] = {
            orderInvoiceKit: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.orderInvoiceKits[currentKitIndex.value] = {
            ...current,
            ...payload
        };

        const index = createdKitData.value.findIndex(k => (
            k.kit.id === current.kit.id
        ))

        if (index !== -1) {
            // Agar mavjud bo‘lsa yangilash
            createdKitData.value[index] = { ...createdKitData.value[index], ...updatedKit }
        } else {
            // Aks holda push qilish
            createdKitData.value.push(updatedKit)
        }
    }

    clearKitForm()
}

function editPaymentAction(data, index) {
    isEditing.value = true;
    currentPaymentIndex.value = index
    payment.value = data.payment;
    amount.value = data.amount;
}

function editPayment(updatedPayment) {
    // Duplicate check
    const exists = editableData.value.orderInvoicePrices.some((p, i) => {
        if (i === currentPaymentIndex.value) return false;
    });


    if (exists) {
        toast.add({
            severity: 'error',
            summary: t('toast.already_added', { name: t('payment.nominativeCapitalize') }),
            life: 3000
        })

        return;
    }

    const current = editableData.value.orderInvoicePrices[currentPaymentIndex.value];

    const payload = {};

    if (updatedPayment.payment.id !== current.payment.id) {
        payload.payment = updatedPayment.payment
    }

    if (updatedPayment.amount !== current.amount) {
        payload.amount = updatedPayment.amount
    }

    if (current.id) {
        payload.orderInvoicePrice = current['@id']
        const indexFromUpdatedData = updatedPriceData.value.findIndex(
            data => data.orderInvoicePrice === payload.orderInvoicePrice
        )

        if (indexFromUpdatedData !== -1) {
            updatedPriceData.value[indexFromUpdatedData] = {
                ...payload
            }
        } else {
            updatedPriceData.value.push(payload)
        }

        // API’dan kelgan
        editableData.value.orderInvoicePrices[currentPaymentIndex.value] = {
            orderInvoicePrice: current['@id'],
            ...current,
            ...payload,
        };
    } else {
        // Yangi qo‘shilgan
        editableData.value.orderInvoicePrices[currentPaymentIndex.value] = {
            ...current,
            ...payload
        };

        const index = createdPriceData.value.findIndex(p => (
            p.payment.id === current.payment.id
        ))

        if (index !== -1) {
            // Agar mavjud bo‘lsa yangilash
            createdPriceData.value[index] = { ...createdPriceData.value[index], ...updatedPayment }
        } else {
            // Aks holda push qilish
            createdPriceData.value.push(updatedPayment)
        }
    }

    clearPaymentForm()
}

function deleteProductAction(product) {
    deleteProductVisible.value = true
    currentDeleteProduct.value = product
}

function deleteKitAction(kit) {
    deleteKitVisible.value = true
    currentDeleteKit.value = kit
}

function deletePaymentAction(payment) {
    deletePaymentVisible.value = true
    currentDeletePayment.value = payment
}

function deleteProduct() {
    const index = editableData.value.orderInvoiceProducts.findIndex(o => o.id === currentDeleteProduct.value.id);
    const indexDelete = createdData.value.findIndex(o => o.id === currentDeleteProduct.value.id);

    if (index === -1) return;

    const current = editableData.value.orderInvoiceProducts[index];

    if (current.id) {
        // API’dan kelgan
        deletedData.value.push({
            orderInvoiceProduct: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        createdData.value.splice(indexDelete, 1);
    }

    editableData.value.orderInvoiceProducts.splice(index, 1);
    deleteProductVisible.value = false
}

function deleteKit() {
    const index = editableData.value.orderInvoiceKits.findIndex(o => o.id === currentDeleteKit.value.id);
    const indexDelete = createdKitData.value.findIndex(o => o.id === currentDeleteKit.value.id);

    if (index === -1) return;

    const current = editableData.value.orderInvoiceKits[index];

    if (current.id) {
        // API’dan kelgan
        deletedKitData.value.push({
            orderInvoiceKit: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        createdKitData.value.splice(indexDelete, 1);
    }

    editableData.value.orderInvoiceKits.splice(index, 1);
    deleteKitVisible.value = false
}

function deletePayment() {
    const index = editableData.value.orderInvoicePrices.findIndex(o => o.id === currentDeletePayment.value.id);
    const indexDelete = createdPriceData.value.findIndex(o => o.id === currentDeletePayment.value.id);

    if (index === -1) return;

    const current = editableData.value.orderInvoicePrices[index];

    if (current.id) {
        // API’dan kelgan
        deletedPriceData.value.push({
            orderInvoicePrice: current["@id"],
            isDelete: true
        })
    } else {
        // Yangi qo‘shilgan
        createdPriceData.value.splice(indexDelete, 1);
    }

    editableData.value.orderInvoicePrices.splice(index, 1);
    deletePaymentVisible.value = false
}

function cancelEditing() {
    editMode.value = false;
    orderInvoiceResetForm()
}

onBeforeRouteLeave((to, from, next) => {
    if (isChanged.value && !isEdited.value && isPayment.value) {
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

const totalReturns = (orderInvoiceQuantities) => {
    return orderInvoiceQuantities?.reduce((total, item) => {
        return total + item.returnQty
    }, 0) || 0
}

onMounted(async () => {
    await orderInvoiceStore.fetchOrderInvoice(route.params.id);
    await usdRateStore.fetchLastUSDRate()
    const usdRate = usdRateStore.getUSDRate.rate || 1;

    apiData.value = orderInvoiceStore.getOrderInvoice;
    editableData.value = JSON.parse(JSON.stringify(orderInvoiceStore.getOrderInvoice));

    if (editableData.value?.orderInvoiceProducts) {
        editableData.value.orderInvoiceProducts = editableData.value.orderInvoiceProducts.map(product => {
            return {
                ...product,
                price: product.price * usdRate
            };
        });
    }

    if (editableData.value?.orderInvoiceKits) {
        editableData.value.orderInvoiceKits = editableData.value.orderInvoiceKits.map(kit => {
            return {
                ...kit,
                price: kit.price * usdRate
            };
        });
    }

    setTimeout(() => {
        orderInvoiceResetForm({
            values: {
                location: orderInvoiceStore.getOrderInvoice.location,
                seller: orderInvoiceStore.getOrderInvoice.seller,
                customer: orderInvoiceStore.getOrderInvoice.customer,
                createdAt: new Date(orderInvoiceStore.getOrderInvoice.createdAt),
                orderInvoiceProducts: orderInvoiceStore.getOrderInvoice.orderInvoiceProducts,
                orderInvoiceKits: orderInvoiceStore.getOrderInvoice.orderInvoiceKits,
                orderInvoicePrices: orderInvoiceStore.getOrderInvoice.orderInvoicePrices
            }
        })
    })

    isLoading.value = false;
})

watch([() => product.value], async () => {
    if (product.value && product.value.retailPrice) {
        productPrice.value = product.value.retailPrice
    }
});

watch([() => kit.value], async () => {
    if (kit.value && kit.value.retailPrice) {
        kitPrice.value = kit.value.retailPrice
    }
});
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
        :section-name="t('cards.orderInvoice')"
        back-route-name="shop-order-invoices"
        :withoutButtons="isLoading"
    >
        <template #buttons>
            <div v-if="!isLoading" class="flex sm:justify-end grow gap-2 sm:gap-4 sm:mt-4">
                <Button
                    v-if="!editMode && isAdminOrCreatedBy(orderInvoiceStore.getOrderInvoice.createdBy.id)"
                    :disabled="!!orderInvoiceErrors.orderInvoiceProducts"
                    icon="pi pi-pencil"
                    @click="editMode = true"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.edit')"
                    :loading="orderInvoiceIsSubmitting"
                />
                <SecondaryButton
                    v-if="editMode"
                    :disabled="!!orderInvoiceErrors.orderInvoiceProducts"
                    @click="cancelEditing"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap bg-surface-0! dark:bg-surface-800!"
                    :label="t('dialog.cancel')"
                    :loading="orderInvoiceIsSubmitting"
                />
                <Button
                    v-if="editMode"
                    :disabled="!isChanged && !isPayment"
                    icon="pi pi-save"
                    @click="onSubmitOrderInvoice"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.save')"
                    :loading="orderInvoiceIsSubmitting"
                />
                <Button
                    v-if="isAcceptedOrderInvoice"
                    @click="router.push({name: 'shop-add-return-invoices', params: { id: orderInvoiceStore.getOrderInvoice.id }})"
                    class="w-full sm:w-fit sm:min-w-[145px] px-2 sm:px-5 whitespace-nowrap"
                    :label="t('buttons.newReturnInvoice')"
                    :loading="orderInvoiceIsSubmitting"
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
                            <p class="text-sm">{{ t('labels.location') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>
                            <SearchSelect
                                v-if="!isLoading"
                                v-model="location"
                                :fetchFn="(query) => locationStore.fetchLocations({...query, isWarehouse: false })"
                                :options="locationStore.getLocations.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.search.byLocation')"
                                :loading="locationStore.getIsLoadingLocation"
                                :total-items="locationStore.getLocations.totalItems"
                                disabled
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.seller') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="seller"
                                :fetchFn="(query) => sellerStore.fetchSellers({...query, location: location?.id })"
                                :options="sellerStore.getSellers.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.search.bySeller')"
                                :loading="sellerStore.getIsLoadingSellers"
                                :total-items="sellerStore.getSellers.totalItems"
                                disabled
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.client') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <SearchSelect
                                v-if="!isLoading"
                                v-model="customer"
                                :fetchFn="(query) => customerStore.fetchCustomers({ ...query, 'is-b2b': false })"
                                :options="customerStore.getCustomers.models"
                                :option-label="opt => opt?.name"
                                :option-value="opt => opt?.id"
                                :return-value="opt => opt"
                                :placeholder="t('placeholders.search.byCustomer')"
                                :loading="customerStore.getIsLoadingCustomers"
                                :total-items="customerStore.getCustomers.totalItems"
                                :disabled="!editMode"
                            />
                        </div>
                        <div>
                            <p class="text-sm">{{ t('labels.createdAt') }}<span class="text-red-500"> *</span></p>

                            <Skeleton class="sm:hidden" height="2rem" v-if="isLoading"/>
                            <Skeleton class="hidden sm:block" height="2.6rem" width="100%" v-if="isLoading"/>

                            <DatePicker
                                v-if="!isLoading"
                                v-model.trim="createdAt"
                                dateFormat="dd.mm.yy"
                                showIcon
                                fluid
                                iconDisplay="input"
                                :placeholder="t('placeholders.date')"
                                show-button-bar
                                :invalid="!!orderInvoiceErrors.createdAt"
                                showTime
                                hourFormat="24"
                                disabled
                            />
                        </div>
                    </div>
                </template>
            </Card>
            <Card
                v-if="editMode"
                pt:root="overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0"
                pt:content="p-2 sm:p-4"
                pt:title="font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <Tabs v-model:value="tabVal" scrollable :showNavigators="false">
                        <TabList>
                            <Tab pt:root="font-medium dark:text-surface-0" v-for="tab of tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
                        </TabList>
                        <TabPanels pt:root="px-0 pb-0">
                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'products'"
                                value="products"
                            >
                                <div class="font-medium mb-4">{{ t('addProduct') }}</div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <p class="text-sm">{{ t('labels.product') }}<span class="text-red-500"> *</span></p>
                                        <SearchSelect
                                            v-model="product"
                                            @click=""
                                            :fetchFn="(query) => productStore.fetchAvailableProducts({...query, location: location.id})"
                                            :options="productStore.getAvailableProducts.models"
                                            :option-label="opt => `${opt.name} | ${opt.code} | ${opt.color ?? '-'} | ${opt.totalQty} ${t(`labels.${opt.unit}`)}`"
                                            :option-value="opt =>  `${opt.name} | ${opt.code} | ${opt.color ?? '-'} | ${opt.totalQty} ${t(`labels.${opt.unit}`)}`"
                                            :return-value="opt => opt"
                                            :search-value="opt => opt.id"
                                            search-key="name"
                                            :placeholder="t('placeholders.select.product')"
                                            :loading="productStore.getIsLoadingProducts"
                                            :total-items="productStore.getAvailableProducts.totalItems"
                                            :invalid="!!productErrors.product"
                                        >
                                            <template v-if="productStore.getAvailableProducts.models.length" #header>
                                                <p class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{ t('labels.title') }} | {{ t('labels.code') }} | {{ t('labels.color') }} | {{ t('labels.qty') }}</p>
                                            </template>
                                        </SearchSelect>
                                    </div>

                                    <div>
                                        <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="productQty"
                                            fluid
                                            showButtons
                                            :placeholder="t('placeholders.qty')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!productErrors.productQty"
                                        />
                                    </div>

                                    <div class="block">
                                        <p class="text-sm">{{ t('labels.price') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="productPrice"
                                            fluid
                                            locale="en-US"
                                            showButtons
                                            :placeholder="t('placeholders.price')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!productErrors.productPrice"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearProductForm" />
                                    <Button v-if="!isEditing" @click="onSubmitProduct" :label="t('buttons.add')" class="px-5" :loading="productIsSubmitting"/>
                                    <Button v-else @click="onEditProduct" :label="t('buttons.edit')" class="px-5"/>
                                </div>
                            </TabPanel>

                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'kits'"
                                value="kits"
                            >
                                <div class="font-medium mb-4">{{ t('addKit') }}</div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <p class="text-sm">{{ t('labels.kit') }}<span class="text-red-500"> *</span></p>
                                        <SearchSelect
                                            v-model="kit"
                                            :fetchFn="(query) => kitStore.fetchAvailableKits({...query, location: location.id})"
                                            :options="kitStore.getAvailableKits.models"
                                            :option-label="opt => `${opt.name} | ${opt.code} | ${opt.totalQty} ${t(`labels.pcs`)}`"
                                            :option-value="opt => `${opt.name} | ${opt.code} | ${opt.totalQty} ${t(`labels.pcs`)}`"
                                            :return-value="opt => opt"
                                            :search-value="opt => opt.id"
                                            search-key="name"
                                            :placeholder="t('placeholders.select.kit')"
                                            :loading="kitStore.getIsLoadingKits"
                                            :total-items="kitStore.getAvailableKits.totalItems"
                                            :invalid="!!kitErrors.kit"
                                        >
                                            <template v-if="kitStore.getAvailableKits.models.length" #header>
                                                <p class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{ t('labels.title') }} | {{ t('labels.code') }} | {{ t('labels.qty') }}</p>
                                            </template>
                                        </SearchSelect>
                                    </div>

                                    <div>
                                        <p class="text-sm">{{ t('labels.qty') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="kitQty"
                                            fluid
                                            showButtons
                                            :placeholder="t('placeholders.qty')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!kitErrors.kitQty"
                                        />
                                    </div>

                                    <div class="block">
                                        <p class="text-sm">{{ t('labels.price') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="kitPrice"
                                            fluid
                                            locale="en-US"
                                            showButtons
                                            :placeholder="t('placeholders.price')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!kitErrors.kitPrice"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-5 col-span-1 md:col-span-2">
                                    <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearKitForm" />
                                    <Button v-if="!isEditing" @click="onSubmitKit" :label="t('buttons.add')" class="px-5" :loading="kitIsSubmitting"/>
                                    <Button v-else @click="onEditKit" :label="t('buttons.edit')" class="px-5"/>
                                </div>
                            </TabPanel>

                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'payments'"
                                value="payments"
                            >
                                <div class="font-medium mb-4">{{ t('buttons.newPayment') }}</div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <p class="text-sm">{{ t('labels.Payment') }}<span class="text-red-500"> *</span></p>
                                        <SearchSelect
                                            v-model="payment"
                                            :fetchFn="(query) => paymentStore.fetchPayments({...query})"
                                            :options="paymentStore.getPayments.models"
                                            :option-label="opt => `${opt.name} | ${opt.paymentType.name}`"
                                            :option-value="opt => `${opt.name} | ${opt.paymentType.name}`"
                                            :return-value="opt => opt"
                                            :search-value="opt => opt.id"
                                            search-key="name"
                                            :placeholder="t('placeholders.select.paymentType')"
                                            :loading="paymentStore.getIsLoadingPayments"
                                            :total-items="paymentStore.getPayments.totalItems"
                                            :invalid="!!paymentErrors.payment"
                                        >
                                            <template v-if="kitStore.getAvailableKits.models.length" #header>
                                                <p class="px-4 py-2 bg-surface-100 dark:bg-surface-900">{{ t('labels.title') }} | {{ t('labels.paymentType') }} }}</p>
                                            </template>
                                        </SearchSelect>
                                    </div>

                                    <div class="block">
                                        <p class="text-sm">{{ t('labels.price') }}<span class="text-red-500"> *</span></p>
                                        <InputNumber
                                            v-model="amount"
                                            fluid
                                            mode="decimal"
                                            showButtons
                                            :placeholder="t('placeholders.price')"
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :invalid="!!paymentErrors.amount"
                                        />
                                    </div>
                                </div>

                                <div class="col-span-full flex items-center justify-between mt-5">
                                    <div class="font-medium">
                                        {{ t('labels.totals') }}: {{ formatCurrency(totalPrice) }} {{ t('soum') }}
                                    </div>

                                    <div class="flex gap-2">
                                        <SecondaryButton type="button" :label="t('dialog.clear')" @click="clearPaymentForm" />
                                        <Button v-if="!isEditing" @click="onSubmitPayment" :label="t('buttons.add')" class="px-5" :loading="paymentIsSubmitting"/>
                                        <Button v-else @click="onEditPayment" :label="t('buttons.edit')" class="px-5"/>
                                    </div>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
            <Card
                pt:root="h-fit grow overflow-x-auto rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer group dark:bg-surface-800 border dark:border-surface-600/50 transition-all shadow-none cursor-auto"
                pt:body="p-0 grow"
                pt:content="grow flex flex-col p-2 sm:p-4"
                pt:title="hidden sm:block font-normal text-xl lg:text-2xl dark:text-surface-0"
            >
                <template #content>
                    <Tabs v-model:value="tabVal" scrollable :showNavigators="false">
                        <TabList v-if="!editMode">
                            <Tab pt:root="font-medium dark:text-surface-0" v-for="tab of tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
                        </TabList>
                        <TabPanels pt:root="px-0 pb-0">
                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'products'"
                                value="products"
                            >
                                <NoData v-if="!editableData?.orderInvoiceProducts?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="isLoading ? Array(10).fill({}) : editableData.orderInvoiceProducts"
                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <Column field="id" header="№">
                                        <template #body="{ index }">
                                            <p>{{ index + 1 }}</p>
                                        </template>
                                    </Column>
                                    <Column field="product" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.product?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.product?.code }}</p>
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
                                            <p v-else>{{ data.product?.category.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="collection" :header="t('labels.collection')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.product?.assembly?.name || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(data.qty) }} {{t(`labels.${data.product?.category?.unit?.name}`)}}</p>
                                        </template>
                                    </Column>
                                    <Column field="price" :header="t('labels.price')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(data.price) }} {{ t('soum') }}</p>
                                        </template>
                                    </Column>
                                    <Column field="total" :header="t('labels.total')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(data.price * data.qty) }} {{ t('soum') }}</p>
                                        </template>
                                    </Column>
                                    <Column field="totalReturns" :header="t('labels.ReturnInvoice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(totalReturns(data.orderInvoiceProductQuantities)) }} {{t(`labels.${data.product?.category?.unit?.name}`)}}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="editMode" field="actions" :header="t('actions')">
                                        <template #body="{ data, index }">
                                            <div class="flex justify-end w-full">
                                                <Skeleton height="2rem" v-if="isLoading"/>
                                                <div v-else class="flex items-center gap-2">
                                                    <Button
                                                        @click="editProductAction(data, index)"
                                                        icon="pi pi-pencil"
                                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                                        size="small"
                                                    />
                                                    <Button
                                                        @click="deleteProductAction(data)"
                                                        icon="pi pi-trash"
                                                        pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>
                                    <template #footer>
                                        <Skeleton height="2rem" width="10rem" class="ml-auto" v-if="isLoading"/>
                                        <div v-else class="mt-auto col-span-full flex justify-end font-medium">{{ t('labels.totals') }}: {{ formatCurrency(totalPrice) }} {{ t('soum') }}</div>
                                    </template>
                                </DataTable>
                            </TabPanel>

                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'kits'"
                                value="kits"
                            >
                                <NoData v-if="!editableData?.orderInvoiceKits?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="isLoading ? Array(10).fill({}) : editableData?.orderInvoiceKits"
                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <Column field="id" header="№">
                                        <template #body="{ index }">
                                            <p>{{ index + 1 }}</p>
                                        </template>
                                    </Column>
                                    <Column field="kit" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <p>{{ data.kit?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="code" :header="t('labels.code')">
                                        <template #body="{ data }">
                                            <p>{{ data.kit?.code }}</p>
                                        </template>
                                    </Column>
                                    <Column field="collection" :header="t('labels.collection')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ data.kit?.assembly?.name || '-' }}</p>
                                        </template>
                                    </Column>
                                    <Column field="qty" :header="t('labels.qty')">
                                        <template #body="{ data }">
                                            <p>{{ formatCurrency(data.qty) }} {{t(`labels.pcs`)}}</p>
                                        </template>
                                    </Column>
                                    <Column field="price" :header="t('labels.price')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(data.price) }} {{ t('soum') }}</p>
                                        </template>
                                    </Column>
                                    <Column field="total" :header="t('labels.total')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(data.price * data.qty) }} {{ t('soum') }}</p>
                                        </template>
                                    </Column>
                                    <Column field="total" :header="t('labels.ReturnInvoice')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(totalReturns(data.orderInvoiceKitQuantities)) }} {{t(`labels.pcs`)}}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="editMode" field="actions" :header="t('actions')">
                                        <template #body="{ data, index }">
                                            <div class="flex justify-end w-full">
                                                <div class="flex items-center gap-2">
                                                    <Button
                                                        @click="editKitAction(data, index)"
                                                        icon="pi pi-pencil"
                                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                                        size="small"
                                                    />
                                                    <Button
                                                        @click="deleteKitAction(data)"
                                                        icon="pi pi-trash"
                                                        pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>
                                    <template #footer>
                                        <Skeleton height="2rem" width="10rem" class="ml-auto" v-if="isLoading"/>
                                        <div v-else class="mt-auto col-span-full flex justify-end font-medium">{{ t('labels.totals') }}: {{ formatCurrency(totalPrice) }} {{ t('soum') }}</div>
                                    </template>
                                </DataTable>
                            </TabPanel>

                            <TabPanel
                                class="h-full"
                                v-if="tabVal === 'payments'"
                                value="payments"
                            >
                                <NoData v-if="!editableData?.orderInvoicePrices?.length && !isLoading" class="text-surface-400 mx-auto my-auto h-full">
                                    <p class="text-xl font-normal">{{ t("noResults") }}</p>
                                </NoData>

                                <DataTable
                                    v-else
                                    :value="isLoading ? Array(10).fill({}) : editableData?.orderInvoicePrices"
                                    scrollable
                                    scroll-height="700px"
                                    pt:footer="border-none dark:bg-surface-800"
                                    pt:root="border border-surface-300 dark:border-surface-600/50 grow"
                                >
                                    <Column field="id" header="№">
                                        <template #body="{ index }">
                                            <p>{{ index + 1 }}</p>
                                        </template>
                                    </Column>
                                    <Column field="kit" :header="t('labels.title')">
                                        <template #body="{ data }">
                                            <p>{{ data.payment?.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="paymentType" :header="t('labels.paymentType')">
                                        <template #body="{ data }">
                                            <p>{{ data.payment?.paymentType.name }}</p>
                                        </template>
                                    </Column>
                                    <Column field="price" :header="t('labels.price')">
                                        <template #body="{ data }">
                                            <Skeleton height="2rem" v-if="isLoading"/>
                                            <p v-else>{{ formatCurrency(data.amount) }}</p>
                                        </template>
                                    </Column>
                                    <Column v-if="editMode" field="actions" :header="t('actions')">
                                        <template #body="{ data, index }">
                                            <div class="flex justify-end w-full">
                                                <div class="flex items-center gap-2">
                                                    <Button
                                                        @click="editPaymentAction(data, index)"
                                                        icon="pi pi-pencil"
                                                        pt:root="rounded-full size-8! bg-amber-500 dark:bg-amber-500 enabled:hover:bg-amber-400 dark:enabled:hover:bg-amber-400 border-amber-500 dark:border-amber-500 enabled:hover:border-amber-400 dark:enabled:hover:border-amber-400 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500"
                                                        size="small"
                                                    />
                                                    <Button
                                                        @click="deletePaymentAction(data)"
                                                        icon="pi pi-trash"
                                                        pt:root="rounded-full size-8! bg-red-500 dark:bg-red-500 enabled:hover:bg-red-400 dark:enabled:hover:bg-red-400 border-red-500 dark:border-red-500 enabled:hover:border-red-400 dark:enabled:hover:border-red-400 focus-visible:outline-red-500 dark:focus-visible:outline-red-500"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        </template>
                                    </Column>
                                    <template #footer>
                                        <Skeleton height="2rem" width="10rem" class="ml-auto" v-if="isLoading"/>
                                        <div v-else class="mt-auto col-span-full flex justify-end font-medium">{{ t('labels.usdRate') }}: {{ formatCurrency(Math.floor(usdRateStore.getUSDRate.rate)) }} | {{ t('labels.total') }}: {{ formatCurrency(totalPayments) }} {{ t('soum') }}</div>
                                    </template>
                                </DataTable>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </template>
            </Card>
            <!-- DELETE PRODUCT DIALOG -->
            <Dialog
                v-model:visible="deleteProductVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.deleteConfirm', { name: t('product.accusative') }) }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="deleteProductVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteProduct"
                            :loading="isDeleteProductLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
            <!-- DELETE KIT DIALOG  -->
            <Dialog
                v-model:visible="deleteKitVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.deleteConfirm', { name: t('kit.accusative') }) }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="deleteKitVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deleteKit"
                            :loading="isDeleteKitLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
            <!-- DELETE PAYMENT DIALOG  -->
            <Dialog
                v-model:visible="deletePaymentVisible"
                modal
                :closable="false"
                class="sm:min-w-100 sm:w-fit w-9/10"
                pt:root="px-2"
            >
                <span class="text-surface-500 dark:text-surface-400 block whitespace-nowrap">
                    {{ t('dialog.deleteConfirm', { name: t('payment.accusative') }) }}
                </span>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            :label="t('dialog.cancel')"
                            @click="deletePaymentVisible = false"
                        />
                        <Button
                            type="button"
                            :label="t('dialog.confirm')"
                            @click="deletePayment"
                            :loading="isDeletePaymentLoading"
                            class="px-5"
                        />
                    </div>
                </template>
            </Dialog>
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
