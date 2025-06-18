<script setup>

</script>

<template>
    <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/about">About</router-link></li>
        <li><router-link to="/admin/dashboard">Dashboard</router-link></li>
    </ul>
    <router-view/>
</template>
