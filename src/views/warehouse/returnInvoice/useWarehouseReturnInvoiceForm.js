import * as yup from 'yup'
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import {useI18n} from "vue-i18n";

export function useReturnInvoiceValidation() {
    const { t } = useI18n()
    // Main invoice schema

// VeeValidate
    const returnInvoiceInfoSchema = computed(() =>
        yup
            .object({
                returnInvoiceProducts: yup.array(),
                returnInvoiceKits: yup.array(),
            })
            .test(
                "products-or-kits",
                "Mahsulot yoki kompozitsiya kiritilishi kerak",
                (value) => {
                    const hasProducts = value?.returnInvoiceProducts?.length > 0;
                    const hasKits = value?.returnInvoiceKits?.length > 0;
                    return hasProducts || hasKits; // ikkalasidan biri bo‘lsa yetarli
                }
            )
    );

// Product
    const productSchema = computed(() =>
        yup.object({
            orderInvoiceProduct: yup.object().required("Product tanlanishi kerak"),
            qtyProduct: yup
                .number()
                .required("Miqdor majburiy")
                .moreThan(0, "Miqdor 0 dan katta bo‘lishi kerak")
                .test(
                    "max-qty",
                    "Miqdor tanlangan lokatsiyadagi mavjud qty dan oshmasligi kerak",
                    function (value) {
                        const { orderInvoiceProduct } = this.parent;
                        if (!orderInvoiceProduct || typeof orderInvoiceProduct.qty !== "number") {
                            return true; // agar tanlanmagan bo‘lsa, boshqa xato chiqadi
                        }

                        let returnQty = 0;

                        for (const orderInvoiceProductQuantity of orderInvoiceProduct.orderInvoiceProductQuantities) {
                            returnQty += orderInvoiceProductQuantity.returnQty;
                        }

                        let total = value - (returnInvoiceProduct.value ? returnInvoiceProduct.value.qty : 0);

                        return total <= orderInvoiceProduct.qty - returnQty;
                    }
                ),
        })
    );

// Kit
    const kitSchema = computed(() =>
        yup.object({
            orderInvoiceKit: yup.object().required("Kit tanlanishi kerak"),
            qtyKit: yup
                .number()
                .required("Miqdor majburiy")
                .moreThan(0, "Miqdor 0 dan katta bo‘lishi kerak")
                .test(
                    "max-qty-kit",
                    "Miqdor tanlangan kit lokatsiyasidagi qty dan oshmasligi kerak",
                    function (value) {
                        const { orderInvoiceKit } = this.parent;
                        if (!orderInvoiceKit || typeof orderInvoiceKit.qty !== "number") {
                            return true;
                        }

                        let returnQty = 0;

                        for (const orderInvoiceKitQuantity of orderInvoiceKit.orderInvoiceKitQuantities) {
                            returnQty += orderInvoiceKitQuantity.returnQty;
                        }

                        let total = value - (returnInvoiceKit.value ? returnInvoiceKit.value.qty : 0);

                        return total <= orderInvoiceKit.qty - returnQty;
                    }
                ),
        })
    );

    const {
        handleSubmit: returnInvoiceHandleSubmit,
        errors: returnInvoiceErrors,
        isSubmitting: returnInvoiceIsSubmitting,
        resetForm: returnInvoiceResetForm,
        ...returnInvoiceFormCtx
    } = useForm({
        validationSchema: returnInvoiceInfoSchema,
        initialValues: {
            returnInvoiceProducts: [],
            returnInvoiceKits: []
        }
    })

    const {
        handleSubmit: productHandleSubmit,
        errors: productErrors,
        isSubmitting: productIsSubmitting,
        validate: productValidate,
        resetForm: productResetForm,
        ...productFormCtx
    } = useForm({
        validationSchema: productSchema,
        initialValues: {
            qtyProduct: 0
        }
    })

    const {
        handleSubmit: kitHandleSubmit,
        errors: kitErrors,
        isSubmitting: kitIsSubmitting,
        validate: kitValidate,
        resetForm: kitResetForm,
        ...kitFormCtx
    } = useForm({
        validationSchema: kitSchema,
        initialValues: {
            qtyKit: 0,
        }
    })

    const { value: location } = useField('location', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: returnInvoiceFormCtx })
    const { value: customer } = useField('customer', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: returnInvoiceFormCtx })
    const { value: createdAt } = useField('createdAt', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: returnInvoiceFormCtx })
    const { value: orderInvoiceProduct } = useField('orderInvoiceProduct', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: productFormCtx })
    const { value: returnInvoiceProduct } = useField('returnInvoiceProduct', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: productFormCtx })
    const { value: returnInvoiceProducts } = useField('returnInvoiceProducts', undefined, { validateOnMount: true, form: returnInvoiceFormCtx })
    const { value: returnInvoiceKits } = useField('returnInvoiceKits', undefined, { validateOnValueUpdate: false, validateOnMount: true, form: returnInvoiceFormCtx })
    const { value: orderInvoiceKit } = useField('orderInvoiceKit', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: kitFormCtx })
    const { value: returnInvoiceKit } = useField('returnInvoiceKit', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: kitFormCtx })
    const { value: qtyProduct } = useField('qtyProduct', undefined, { validateOnMount: false, form: productFormCtx });
    const { value: qtyKit } = useField('qtyKit', undefined, { validateOnMount: false, form: kitFormCtx });

    return {
        // Invoice form
        returnInvoiceHandleSubmit,
        returnInvoiceErrors,
        returnInvoiceIsSubmitting,
        returnInvoiceResetForm,
        returnInvoiceFormCtx,
        location,
        customer,
        createdAt,
        returnInvoiceProducts,
        returnInvoiceKits,

        // Product form
        productHandleSubmit,
        productErrors,
        productIsSubmitting,
        productResetForm,
        productFormCtx,
        productValidate,
        orderInvoiceProduct,
        returnInvoiceProduct,
        qtyProduct,

        // Kit form
        kitHandleSubmit,
        kitErrors,
        kitIsSubmitting,
        kitResetForm,
        kitFormCtx,
        kitValidate,
        orderInvoiceKit,
        returnInvoiceKit,
        qtyKit,
    }
}
