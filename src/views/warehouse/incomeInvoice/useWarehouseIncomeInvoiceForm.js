import * as yup from 'yup'
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'

export function useIncomeInvoiceValidation() {
    // Main invoice schema
    const incomeInvoiceInfoSchema = computed(() => yup.object({
        supplier: yup.object().required('Supplier is required'),
        location: yup.object().required('Location is required'),
        comment: yup.string().max(255).notRequired(),
        createdAt: yup.date().required('CreatedAt is required'),
        incomeInvoiceProducts: yup.array().required().min(1, 'At least one product required')
    }))

    // Product schema
    const productSchema = computed(() => yup.object({
        product: yup.object().required('Product is required'),
        color: yup.object().notRequired(),
        expiryDate: yup
            .date()
            .nullable()
            .when('product', {
                is: (product) =>
                    product?.category?.categoryType?.name?.toLowerCase() === 'food',
                then: (schema) => schema.required('Expiry date is required for food'),
                otherwise: (schema) => schema.notRequired(),
            }),
        qty: yup.number().required('Quantity is required'),
        price: yup.number().required('Price is required'),
        transportationFee: yup.number().required('Transportation fee is required'),
        customsFee: yup.number().required('Customs fee is required')
    }))

    // Invoice form
    const {
        handleSubmit: incomeInvoiceHandleSubmit,
        errors: incomeInvoiceErrors,
        isSubmitting: incomeInvoiceIsSubmitting,
        resetForm: incomeInvoiceResetForm,
        ...incomeInvoiceFormCtx
    } = useForm({
        validationSchema: incomeInvoiceInfoSchema,
        initialValues: {
            incomeInvoiceProducts: []
        }
    })

    // Product form
    const {
        handleSubmit: productHandleSubmit,
        errors: productErrors,
        isSubmitting: productIsSubmitting,
        resetForm: productResetForm,
        ...productFormCtx
    } = useForm({
        validationSchema: productSchema
    })

    // Invoice fields
    const { value: supplier } = useField('supplier', undefined, { form: incomeInvoiceFormCtx })
    const { value: location } = useField('location', undefined, { form: incomeInvoiceFormCtx })
    const { value: comment } = useField('comment', undefined, { form: incomeInvoiceFormCtx })
    const { value: createdAt } = useField('createdAt', undefined, { form: incomeInvoiceFormCtx })
    const { value: incomeInvoiceProducts } = useField('incomeInvoiceProducts', undefined, {
        validateOnMount: true,
        form: incomeInvoiceFormCtx
    })

    // Product fields
    const { value: product } = useField('product', undefined, { validateOnValueUpdate: false, form: productFormCtx })
    const { value: color } = useField('color', undefined, { form: productFormCtx })
    const { value: expiryDate } = useField('expiryDate', undefined, { form: productFormCtx })
    const { value: qty } = useField('qty', undefined, { form: productFormCtx })
    const { value: price } = useField('price', undefined, { form: productFormCtx })
    const { value: transportationFee } = useField('transportationFee', undefined, { form: productFormCtx })
    const { value: customsFee } = useField('customsFee', undefined, { form: productFormCtx })

    return {
        // Invoice form
        incomeInvoiceHandleSubmit,
        incomeInvoiceErrors,
        incomeInvoiceIsSubmitting,
        incomeInvoiceResetForm,
        incomeInvoiceFormCtx,
        supplier,
        location,
        comment,
        createdAt,
        incomeInvoiceProducts,

        // Product form
        productHandleSubmit,
        productErrors,
        productIsSubmitting,
        productResetForm,
        productFormCtx,
        product,
        color,
        expiryDate,
        qty,
        price,
        transportationFee,
        customsFee,
    }
}
