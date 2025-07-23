<script setup>
import DatePicker from "@/volt/DatePicker.vue";
import {ref} from "vue";

const foo = ref(null)
</script>
<template>
    <div class="flex flex-col grow bg-[url('/home_page.webp')] bg-no-repeat bg-cover bg-bottom">
    <DatePicker
        v-model="foo"
        show-button-bar
    />
    </div>
</template>
