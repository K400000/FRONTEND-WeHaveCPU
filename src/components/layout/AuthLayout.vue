<script setup>
import Footer from './Footer.vue'
import Navbar from './Navbar.vue'
</script>

<template>
  <div class="min-vh-100 d-flex flex-column">
    <Navbar />
    <div class="flex-grow-1">
      <RouterView />
    </div>
    <Footer />
  </div>
</template>