import * as yup from 'yup'
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import {useI18n} from "vue-i18n";

export function useOrderInvoiceValidation() {
    const { t } = useI18n()

    // Main invoice schema
    const orderInvoiceInfoSchema = computed(() => yup.object({
        location: yup.object().required('Location is required'),
        customer: yup.object().required('Location is required'),
        comment: yup.string().max(255, t('errorMessages.maxCharacter', { count: 255 })).notRequired(),
        createdAt: yup.date().required(t('errorMessages.dateRequired')),
    }));

    // Product
    const productSchema = computed(() => yup.object({
        product: yup.object().required('Product is required'),
        qty: yup
            .number()
            .required("Miqdor majburiy")
            .moreThan(0, "Miqdor 0 dan katta bo‘lishi kerak")
            .test(
                "max-qty",
                "Miqdor tanlangan lokatsiyadagi mavjud qty dan oshmasligi kerak",
                function (value) {
                    const { product } = this.parent;

                    if (!product || typeof product.totalQty !== "number") {
                        return true; // agar tanlanmagan bo‘lsa, boshqa xato chiqadi
                    }

                    return value <= product.totalQty;
                }
            ),
        price: yup.number().required('Price is required'),
    }));

    // Kit
    const kitSchema = computed(() => yup.object({
        kit: yup.object().required('Product is required'),
        qty: yup
            .number()
            .required("Miqdor majburiy")
            .moreThan(0, "Miqdor 0 dan katta bo‘lishi kerak")
            .test(
                "max-qty",
                "Miqdor tanlangan lokatsiyadagi mavjud qty dan oshmasligi kerak",
                function (value) {
                    const { kit } = this.parent;

                    if (!kit || typeof kit.totalQty !== "number") {
                        return true; // agar tanlanmagan bo‘lsa, boshqa xato chiqadi
                    }

                    return value <= kit.totalQty;
                }
            ),
        price: yup.number().required('Price is required'),
    }));

    // Payment
    const paymentSchema = computed(() => yup.object({
        payment: yup.object().required('Payment is required'),
    }));

    const {
        handleSubmit: orderInvoiceHandleSubmit,
        errors: orderInvoiceErrors,
        isSubmitting: orderInvoiceIsSubmitting,
        resetForm: orderInvoiceResetForm,
        ...orderInvoiceFormCtx
    } = useForm({
        validationSchema: orderInvoiceInfoSchema,
        initialValues: {
            orderInvoiceProducts: [],
            orderInvoiceKits: [],
            orderInvoicePrices: []
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
            qty: 0
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
            kitQty: 0,
            kitPrice: 0
        }
    })

    const {
        handleSubmit: paymentHandleSubmit,
        errors: paymentErrors,
        isSubmitting: paymentIsSubmitting,
        validate: paymentValidate,
        resetForm: paymentResetForm,
        ...paymentFormCtx
    } = useForm({
        validationSchema: paymentSchema,
    })

    const { value: location } = useField('location', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: orderInvoiceFormCtx })
    const { value: customer } = useField('customer', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: orderInvoiceFormCtx })
    const { value: comment } = useField('comment', undefined, { form: orderInvoiceFormCtx })
    const { value: createdAt } = useField('createdAt', undefined, { form: orderInvoiceFormCtx })
    const { value: product } = useField('product', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: productFormCtx })
    const { value: productColor } = useField('color', undefined, { validateOnMount: false, form: productFormCtx });
    const { value: productQty } = useField('qty', undefined, { validateOnMount: false, form: productFormCtx });
    const { value: productPrice } = useField('price', undefined, { validateOnMount: false, form: productFormCtx });
    const { value: kit } = useField('kit', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: kitFormCtx })
    const { value: kitQty } = useField('qty', undefined, { validateOnMount: false, form: kitFormCtx });
    const { value: kitPrice } = useField('price', undefined, { validateOnMount: false, form: kitFormCtx });
    const { value: orderInvoicePrices } = useField('orderInvoicePrices', undefined, { validateOnMount: true, form: orderInvoiceFormCtx })
    const { value: payment } = useField('payment', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: paymentFormCtx })
    const { value: amount } = useField('amount', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: paymentFormCtx })

    return {
        // Invoice form
        orderInvoiceHandleSubmit,
        orderInvoiceErrors,
        orderInvoiceIsSubmitting,
        orderInvoiceResetForm,
        orderInvoiceFormCtx,
        location,
        customer,
        comment,
        createdAt,

        // Product form
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

        // Kit form
        kitHandleSubmit,
        kitErrors,
        kitIsSubmitting,
        kitResetForm,
        kitFormCtx,
        kitValidate,
        kit,
        kitQty,
        kitPrice,

        // Payment form
        paymentHandleSubmit,
        paymentErrors,
        paymentIsSubmitting,
        paymentResetForm,
        paymentFormCtx,
        paymentValidate,
        orderInvoicePrices,
        payment,
        amount
    }
}
