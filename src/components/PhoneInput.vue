<script setup>
import InputMask from "@/volt/InputMask.vue";
import Select from "@/volt/Select.vue";
import {computed, ref, watch, watchEffect} from "vue";

const countryCodes = [
    { code: '+961', codeName: 'LB', country: 'Lebanon', flag: 'lebanon' },
    { code: '+971', codeName: 'AE', country: 'United Arab Emirates', flag: 'uae' },
    { code: '+998', codeName: 'UZ', country: 'Uzbekistan', flag: 'uzbekistan' },
]
const selectedCountryCode = ref(countryCodes[2])
const masksByCountry = {
    '+961': {
        name: 'Lebanon',
        mask: '(99) 999-999',
        example: '(71) 234-567'
    },
    '+971': {
        name: 'UAE',
        mask: '(99) 999-9999',
        example: '(50) 123-4567'
    },
    '+998': {
        name: 'Uzbekistan',
        mask: '(99) 999-99-99',
        example: '(90) 123-45-67'
    }
}

const phone = ref('')

const currentMask = computed(() => {
    const country = masksByCountry[selectedCountryCode.value.code]
    return country?.mask || '(99) 999 9999'
})

const currentExampleNumber = computed(() => {
    const country = masksByCountry[selectedCountryCode.value.code]
    return country?.example || '90 123-45-67'
})

const phoneLength = computed(() => `${currentMask.value} ${selectedCountryCode.value.code}`.length)

const emits = defineEmits(['update:modelValue', 'update:phoneLength'])
defineProps(['modelValue', 'phoneLength'])

watchEffect(() => {
    emits('update:modelValue', `${selectedCountryCode.value.code} ${phone.value}`)
    emits('update:phoneLength', phoneLength.value)
})
</script>

<template>
    <div class="flex items-center">
        <Select
            v-model="selectedCountryCode"
            :options="countryCodes"
            optionLabel="code"
            placeholder="Select a Country"
            size="large"
            class="w-50"
            pt:root="w-44 rounded-e-none"
            pt:label="dark:bg-surface-950 rounded-s-md"
            pt:dropdown="dark:bg-surface-950 rounded-e-none"
        >
            <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                    <img
                        :src="`/${slotProps.value.flag}.svg`"
                        :alt="slotProps.value.name"
                        class="h-6"
                    />
                    <div>{{ slotProps.value.code }}</div>
                </div>
                <span v-else>
                    {{ slotProps.placeholder }}
                </span>
            </template>
            <template #option="slotProps">
                <div class="flex items-center gap-2">
                    <img
                        :src="`/${slotProps.option.flag}.svg`"
                        :alt="slotProps.option.name"
                        class="h-5"
                    />
                    <div>{{ slotProps.option.code }} {{slotProps.option.country}}</div>
                </div>
            </template>
        </Select>
        <InputMask
            v-model.trim="phone"
            id="username"
            fluid
            :mask="currentMask"
            :placeholder="currentExampleNumber"
            pt:root="rounded-s-none"
            size="large"
        />
    </div>
</template>
