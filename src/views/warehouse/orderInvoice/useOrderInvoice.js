import { ref } from "vue";

export function useOrderInvoice() {
    const orderInvoiceProducts = ref([]);
    const orderInvoiceKits = ref([]);

    function addProduct(product) {
        const productPath = `/api/products/${product.id}`;
        const colorPath = product.colorId ? `/api/colors/${product.colorId}` : null;

        const existing = orderInvoiceProducts.value.find(
            (p) => p.api.product === productPath && p.api.color === colorPath
        );

        if (existing) {
            existing.api.qty += 1; // ✅ qty api ichida
        } else {
            orderInvoiceProducts.value.push({
                ui: { ...product }, // UI uchun to‘liq ma'lumot
                api: {
                    product: productPath,
                    color: colorPath,
                    qty: 1,
                    price: product.wholesalePrice,
                }
            });
        }
    }

    function removeProduct(product) {
        const index = orderInvoiceProducts.value.findIndex(
            (p) => p.ui.id === product.ui.id && p.ui.color === product.ui.color
        );

        console.log(index)
        if (index !== -1) {
            orderInvoiceProducts.value.splice(index, 1);
        }
    }

    function removeOneProduct(product) {
        const index = orderInvoiceProducts.value.findIndex(
            (p) => p.ui.id === product.ui.id && p.ui.color === product.ui.color
        );

        console.log(index)
        if (index !== -1) {
            if (orderInvoiceProducts.value[index].api.qty > 1) {
                orderInvoiceProducts.value[index].api.qty -= 1; // ✅ api.qty ni kamaytirish
            } else {
                orderInvoiceProducts.value.splice(index, 1);
            }
        }
    }

    function addKit(kit) {
        const kitPath = `/api/kits/${kit.id}`;

        const existing = orderInvoiceKits.value.find((k) => k.api.kit === kitPath);

        if (existing) {
            existing.api.qty += 1; // ✅ api.qty ichida
        } else {
            orderInvoiceKits.value.push({
                ui: { ...kit }, // UI uchun to‘liq ma'lumot
                api: {
                    kit: kitPath,
                    qty: 1,
                    price: kit.wholesalePrice,
                }
            });
        }
    }

    function removeKit(kit) {
        const index = orderInvoiceKits.value.findIndex(
            (k) => k.ui.id === kit.ui.id
        );

        if (index !== -1) {
            orderInvoiceKits.value.splice(index, 1);
        }
    }

    function removeOneKit(kit) {
        const index = orderInvoiceKits.value.findIndex(
            (k) => k.ui.kit === kit.ui.id
        );

        if (index !== -1) {
            if (orderInvoiceKits.value[index].api.qty > 1) {
                orderInvoiceKits.value[index].api.qty -= 1; // ✅ api.qty
            } else {
                orderInvoiceKits.value.splice(index, 1);
            }
        }
    }

    return {
        orderInvoiceProducts,
        orderInvoiceKits,
        addProduct,
        removeProduct,
        removeOneProduct,
        addKit,
        removeKit,
        removeOneKit,
    };
}
