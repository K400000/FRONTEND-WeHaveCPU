<script setup>
import logo from '../../assets/WHClogo.png'
</script>

<template>
  <header class="bg-white border-bottom">
    <div class="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-2">
      <RouterLink class="d-inline-flex align-items-center gap-2 text-dark fw-bold text-decoration-none" to="/admin/dashboard">
        <img :src="logo" alt="" width="40" height="40" class="object-fit-contain" />
        <span>We Have CPU</span>
        <span class="border-start ps-2 small text-secondary fw-normal">ผู้ดูแลระบบ</span>
      </RouterLink>
      <nav class="nav flex-wrap" aria-label="เมนูผู้ดูแลระบบ">
        <RouterLink class="nav-link" active-class="active" to="/admin/dashboard">ภาพรวม</RouterLink>
        <RouterLink class="nav-link" active-class="active" to="/admin/goods">สินค้า</RouterLink>
        <RouterLink class="nav-link" active-class="active" to="/admin/orders">คำสั่งซื้อ</RouterLink>
        <RouterLink class="nav-link" active-class="active" to="/admin/roles">สิทธิ์ผู้ใช้</RouterLink>
      </nav>
    </div>
  </header>
</template>