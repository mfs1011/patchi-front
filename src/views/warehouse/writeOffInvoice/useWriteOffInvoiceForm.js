import * as yup from 'yup'
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import {useI18n} from "vue-i18n";

export function useWriteOffInvoiceValidation() {
    const { t } = useI18n()
    // Main invoice schema

// VeeValidate
    const writeOffInvoiceInfoSchema = computed(() =>
        yup
            .object({
                location: yup.object().required("From location majburiy"),
                writeOffInvoiceProducts: yup.array(),
                writeOffInvoiceKits: yup.array(),
            })
            .test(
                "products-or-kits",
                "Mahsulot yoki kompozitsiya kiritilishi kerak",
                (value) => {
                    const hasProducts = value?.writeOffInvoiceProducts?.length > 0;
                    const hasKits = value?.writeOffInvoiceKits?.length > 0;
                    return hasProducts || hasKits; // ikkalasidan biri bo‘lsa yetarli
                }
            )
    );

// Product
    const locationQuantitySchema = computed(() =>
        yup.object({
            locationQuantity: yup.object().required("Lokatsiya tanlanishi kerak"),
            qtyLocationQuantity: yup
                .number()
                .required("Miqdor majburiy")
                .moreThan(0, "Miqdor 0 dan katta bo‘lishi kerak")
                .test(
                    "max-qty",
                    "Miqdor tanlangan lokatsiyadagi mavjud qty dan oshmasligi kerak",
                    function (value) {
                        const { locationQuantity } = this.parent;
                        if (!locationQuantity || typeof locationQuantity.qty !== "number") {
                            return true; // agar tanlanmagan bo‘lsa, boshqa xato chiqadi
                        }
                        return value <= locationQuantity.qty;
                    }
                ),
        })
    );

// Kit
    const locationQuantityKitSchema = computed(() =>
        yup.object({
            locationQuantityKit: yup.object().required("Kit lokatsiyasi tanlanishi kerak"),
            qtyLocationQuantityKit: yup
                .number()
                .required("Miqdor majburiy")
                .moreThan(0, "Miqdor 0 dan katta bo‘lishi kerak")
                .test(
                    "max-qty-kit",
                    "Miqdor tanlangan kit lokatsiyasidagi qty dan oshmasligi kerak",
                    function (value) {
                        const { locationQuantityKit } = this.parent;
                        if (!locationQuantityKit || typeof locationQuantityKit.qty !== "number") {
                            return true;
                        }
                        return value <= locationQuantityKit.qty;
                    }
                ),
        })
    );

    const {
        handleSubmit: writeOffInvoiceHandleSubmit,
        errors: writeOffInvoiceErrors,
        isSubmitting: writeOffInvoiceIsSubmitting,
        resetForm: writeOffInvoiceResetForm,
        ...writeOffInvoiceFormCtx
    } = useForm({
        validationSchema: writeOffInvoiceInfoSchema,
        initialValues: {
            writeOffInvoiceProducts: [],
            writeOffInvoiceKits: []
        }
    })

    const {
        handleSubmit: locationQuantityHandleSubmit,
        errors: locationQuantityErrors,
        isSubmitting: locationQuantityIsSubmitting,
        validate: locationQuantityValidate,
        resetForm: locationQuantityResetForm,
        ...locationQuantityFormCtx
    } = useForm({
        validationSchema: locationQuantitySchema,
        initialValues: {
            qtyLocationQuantity: 0
        }
    })

    const {
        handleSubmit: locationQuantityKitHandleSubmit,
        errors: locationQuantityKitErrors,
        isSubmitting: locationQuantityKitIsSubmitting,
        validate: locationQuantityKitValidate,
        resetForm: locationQuantityKitResetForm,
        ...locationQuantityKitFormCtx
    } = useForm({
        validationSchema: locationQuantityKitSchema,
        initialValues: {
            qtyLocationQuantityKit: 0,
        }
    })

    const { value: location } = useField('location', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: writeOffInvoiceFormCtx })
    const { value: createdAt } = useField('createdAt', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: writeOffInvoiceFormCtx })
    const { value: writeOffInvoiceProducts } = useField('writeOffInvoiceProducts', undefined, { validateOnMount: true, form: writeOffInvoiceFormCtx })
    const { value: writeOffInvoiceKits } = useField('writeOffInvoiceKits', undefined, { validateOnValueUpdate: false, validateOnMount: true, form: writeOffInvoiceFormCtx })
    const { value: locationQuantity } = useField('locationQuantity', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: locationQuantityFormCtx })
    const { value: locationQuantityKit } = useField('locationQuantityKit', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: locationQuantityKitFormCtx })
    const { value: qtyLocationQuantity } = useField('qtyLocationQuantity', undefined, { validateOnMount: false, form: locationQuantityFormCtx });
    const { value: qtyLocationQuantityKit } = useField('qtyLocationQuantityKit', undefined, { validateOnMount: false, form: locationQuantityKitFormCtx });

    return {
        // WriteOff form
        writeOffInvoiceHandleSubmit,
        writeOffInvoiceErrors,
        writeOffInvoiceIsSubmitting,
        writeOffInvoiceResetForm,
        writeOffInvoiceFormCtx,
        location,
        createdAt,
        writeOffInvoiceProducts,
        writeOffInvoiceKits,

        // Product form
        locationQuantityHandleSubmit,
        locationQuantityErrors,
        locationQuantityIsSubmitting,
        locationQuantityResetForm,
        locationQuantityFormCtx,
        locationQuantityValidate,
        locationQuantity,
        qtyLocationQuantity,

        // Kit form
        locationQuantityKitHandleSubmit,
        locationQuantityKitErrors,
        locationQuantityKitIsSubmitting,
        locationQuantityKitResetForm,
        locationQuantityKitFormCtx,
        locationQuantityKitValidate,
        locationQuantityKit,
        qtyLocationQuantityKit,
    }
}
