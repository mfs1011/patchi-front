import * as yup from 'yup'
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import {useI18n} from "vue-i18n";

export function useKitValidation() {
    const { t } = useI18n()
    // Main kit schema
    const kitInfoSchema = computed(() => yup.object({
        seller: yup.object().required('Seller is required'),
        qr: yup.string().notRequired().max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
        code: yup.string().required(t('errorMessages.codeRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
        name: yup.string().required(t('errorMessages.titleRequired')).max(30 , t('errorMessages.nameMustBeMaxCharacters', { count: 30 })),
        wholesalePrice: yup.number().required(t('errorMessages.wholesalePriceRequired')),
        retailPrice: yup.number().required(t('errorMessages.retailPriceRequired')),
    }))

    // Kit form
    const {
        handleSubmit: kitHandleSubmit,
        errors: kitErrors,
        isSubmitting: kitIsSubmitting,
        resetForm: kitResetForm,
        ...kitFormCtx
    } = useForm({
        validationSchema: kitInfoSchema,
        initialValues: {}
    })

    // Kit fields
    const { value: seller } = useField('seller', undefined, { form: kitFormCtx })
    const { value: qr } = useField('qr', undefined, { form: kitFormCtx })
    const { value: code } = useField('code', undefined, { form: kitFormCtx })
    const { value: name } = useField('name', undefined, { form: kitFormCtx })
    const { value: assembly } = useField('assembly', undefined, { form: kitFormCtx })
    const { value: wholesalePrice } = useField('wholesalePrice', undefined, { form: kitFormCtx })
    const { value: retailPrice } = useField('retailPrice', undefined, { form: kitFormCtx })
    const { value: qty } = useField('qty', undefined, { form: kitFormCtx })

    return {
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
    }
}
