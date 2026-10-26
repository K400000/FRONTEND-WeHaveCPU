<script setup>
import AdminNavbar from './AdminNavbar.vue'
import Footer from './Footer.vue'
</script>

<template>
  <div class="min-vh-100 d-flex flex-column">
    <AdminNavbar />
    <div class="flex-grow-1">
      <RouterView />
    </div>
    <Footer />
  </div>
</template>