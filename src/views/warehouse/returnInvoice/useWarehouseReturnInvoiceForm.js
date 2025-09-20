import * as yup from 'yup'
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import {useI18n} from "vue-i18n";

export function useReturnInvoiceValidation() {
    const { t } = useI18n()
    // Main invoice schema
    const returnInvoiceInfoSchema = computed(() => yup.object({
        location: yup.object().required('Location is required'),
        customer: yup.object().required('Supplier is required'),
        createdAt: yup.date().required('CreatedAt is required'),
        returnInvoiceProducts: yup.array().required().min(1, 'At least one product required')
    }))

    // Product schema
    const productSchema = computed(() => yup.object({
        orderInvoiceProduct: yup.object().required('Product is required'),
        qty: yup.number().required('Quantity is required')
    }))

    // Invoice form
    const {
        handleSubmit: returnInvoiceHandleSubmit,
        errors: returnInvoiceErrors,
        isSubmitting: returnInvoiceIsSubmitting,
        resetForm: returnInvoiceResetForm,
        ...returnInvoiceFormCtx
    } = useForm({
        validationSchema: returnInvoiceInfoSchema,
        initialValues: {
            returnInvoiceProducts: []
        }
    })

    // Product form
    const {
        handleSubmit: productHandleSubmit,
        errors: productErrors,
        isSubmitting: productIsSubmitting,
        resetForm: productResetForm,
        validate: productValidate,
        ...productFormCtx
    } = useForm({
        validationSchema: productSchema,
        initialValues: {}
    })

    // Invoice fields
    const { value: location } = useField('location', undefined, { form: returnInvoiceFormCtx })
    const { value: customer } = useField('customer', undefined, { form: returnInvoiceFormCtx })
    const { value: createdAt } = useField('createdAt', undefined, { form: returnInvoiceFormCtx })
    const { value: returnInvoiceProducts } = useField('returnInvoiceProducts', undefined, {
        validateOnMount: true,
        form: returnInvoiceFormCtx
    })

    // Product fields
    const { value: orderInvoiceProduct } = useField('product', undefined, { validateOnValueUpdate: false, form: productFormCtx })
    const { value: qty } = useField('qty', undefined, { form: productFormCtx })

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

        // Product form
        productHandleSubmit,
        productErrors,
        productIsSubmitting,
        productResetForm,
        productFormCtx,
        productValidate,
        orderInvoiceProduct,
        qty
    }
}
