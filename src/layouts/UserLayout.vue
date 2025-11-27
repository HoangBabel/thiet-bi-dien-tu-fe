<template>
  <div>
    <Navbar />
    <main class="pt-5">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Navbar from "../components/Navbar.vue"
</script>
