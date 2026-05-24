import * as yup from 'yup'
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import {useI18n} from "vue-i18n";

export function useTransferInvoiceValidation() {
    const { t } = useI18n()
    // Main invoice schema

// VeeValidate
    const transferInvoiceInfoSchema = computed(() =>
        yup
            .object({
                fromLocation: yup.object().required("From location majburiy"),

                toLocation: yup.lazy((value) => {
                    if (!value) {
                        return yup.object().required("To location majburiy");
                    }

                    return yup
                        .object()
                        .required("To location majburiy")
                        .test(
                            "not-same-as-from",
                            "From location va To location bir xil bo‘lishi mumkin emas",
                            function (val) {
                                const { fromLocation } = this.parent;
                                if (!val?.id || !fromLocation?.id) return true;
                                return fromLocation.id !== val.id;
                            }
                        );
                }),

                comment: yup.string().max(255, t('errorMessages.maxCharacter', { count: 255 })).notRequired(),
                transferInvoiceProducts: yup.array(),
                transferInvoiceKits: yup.array(),
            })
            .test(
                "products-or-kits",
                "Mahsulot yoki kompozitsiya kiritilishi kerak",
                (value) => {
                    const hasProducts = value?.transferInvoiceProducts?.length > 0;
                    const hasKits = value?.transferInvoiceKits?.length > 0;
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
        handleSubmit: transferInvoiceHandleSubmit,
        errors: transferInvoiceErrors,
        isSubmitting: transferInvoiceIsSubmitting,
        resetForm: transferInvoiceResetForm,
        ...transferInvoiceFormCtx
    } = useForm({
        validationSchema: transferInvoiceInfoSchema,
        initialValues: {
            transferInvoiceProducts: [],
            transferInvoiceKits: []
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

    const { value: fromLocation } = useField('fromLocation', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: transferInvoiceFormCtx })
    const { value: toLocation } = useField('toLocation', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: transferInvoiceFormCtx })
    const { value: comment } = useField('comment', undefined, { form: transferInvoiceFormCtx })
    const { value: locationQuantity } = useField('locationQuantity', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: locationQuantityFormCtx })
    const { value: transferInvoiceProducts } = useField('transferInvoiceProducts', undefined, { validateOnMount: true, form: transferInvoiceFormCtx })
    const { value: transferInvoiceKits } = useField('transferInvoiceKits', undefined, { validateOnValueUpdate: false, validateOnMount: true, form: transferInvoiceFormCtx })
    const { value: locationQuantityKit } = useField('locationQuantityKit', undefined, { validateOnMount: false, validateOnValueUpdate: false, form: locationQuantityKitFormCtx })
    const { value: qtyLocationQuantity } = useField('qtyLocationQuantity', undefined, { validateOnMount: false, form: locationQuantityFormCtx });
    const { value: qtyLocationQuantityKit } = useField('qtyLocationQuantityKit', undefined, { validateOnMount: false, form: locationQuantityKitFormCtx });

    return {
        // Invoice form
        transferInvoiceHandleSubmit,
        transferInvoiceErrors,
        transferInvoiceIsSubmitting,
        transferInvoiceResetForm,
        transferInvoiceFormCtx,
        fromLocation,
        toLocation,
        comment,
        transferInvoiceProducts,
        transferInvoiceKits,

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
