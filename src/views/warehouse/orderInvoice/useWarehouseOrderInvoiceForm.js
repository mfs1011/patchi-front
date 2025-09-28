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
        createdAt: yup.date().required(t('errorMessages.dateRequired')),
    }));

    // Product
    const productSchema = computed(() => yup.object({
        product: yup.object().required('Product is required'),
        color: yup.object().notRequired(),
        qty: yup.number().required('Quantity is required'),
        price: yup.number().required('Price is required'),
    }));

    // Kit
    const kitSchema = computed(() => yup.object({
        kit: yup.object().required('Product is required'),
        qty: yup.number().required('Quantity is required'),
        price: yup.number().required('Price is required'),
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
            orderInvoiceKits: []
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
            qtyLocationQuantityKit: 0,
        }
    })

    const { value: location } = useField('location', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: orderInvoiceFormCtx })
    const { value: customer } = useField('customer', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: orderInvoiceFormCtx })
    const { value: createdAt } = useField('createdAt', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: orderInvoiceFormCtx })
    const { value: product } = useField('product', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: productFormCtx })
    const { value: productColor } = useField('color', undefined, { validateOnMount: false, form: productFormCtx });
    const { value: productQty } = useField('qty', undefined, { validateOnMount: false, form: productFormCtx });
    const { value: productPrice } = useField('price', undefined, { validateOnMount: false, form: productFormCtx });
    const { value: kit } = useField('kit', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: kitFormCtx })
    const { value: kitQty } = useField('qty', undefined, { validateOnMount: false, form: kitFormCtx });
    const { value: kitPrice } = useField('price', undefined, { validateOnMount: false, form: kitFormCtx });

    return {
        // Invoice form
        orderInvoiceHandleSubmit,
        orderInvoiceErrors,
        orderInvoiceIsSubmitting,
        orderInvoiceResetForm,
        orderInvoiceFormCtx,
        location,
        customer,
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
    }
}
