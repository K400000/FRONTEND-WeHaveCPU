<script setup>
import Footer from './Footer.vue'
import Navbar from './Navbar.vue'
</script>

<template>
  <div class="min-vh-100 d-flex flex-column">
    <Navbar />
    <main class="container flex-grow-1 py-5">
      <p class="text-secondary mb-1">ตัวอย่าง Layout</p>
      <h1 class="h3">พื้นที่เนื้อหาของแต่ละหน้า</h1>
      <p class="mb-0">Navbar และ Footer จะใช้ร่วมกัน ส่วนเนื้อหาจะเปลี่ยนตามหน้าที่เปิด</p>
    </main>
    <Footer />
  </div>
</template>
