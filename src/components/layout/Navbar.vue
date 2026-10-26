<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from '../../assets/WHClogo.png'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const profileMenuOpen = ref(false)
const profileMenuRoot = ref(null)

auth.refreshSession()
watch(() => route.fullPath, () => {
  auth.refreshSession()
  profileMenuOpen.value = false
})

function closeOnOutsideClick(event) {
  if (!profileMenuRoot.value?.contains(event.target)) profileMenuOpen.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))

function logout() {
  auth.logout()
  router.replace({ name: 'auth-login' })
}
</script>

<template>
  <header class="bg-white border-bottom">
    <div class="container">
      <div class="row align-items-center gy-2 py-3">
        <div class="col-7 col-md-auto order-1">
          <RouterLink class="d-inline-flex align-items-center gap-2 text-dark fw-bold text-decoration-none" to="/user/goods/recommended" aria-label="We Have CPU หน้าหลัก">
          <img :src="logo" alt="" width="150" height="50" class="object-fit-contain" />
          </RouterLink>
        </div>

        <form class="col-12 col-md order-3 order-md-2" role="search" @submit.prevent>
          <label class="visually-hidden" for="store-search">ค้นหาสินค้า</label>
          <div class="input-group">
            <input id="store-search" class="form-control" type="search" placeholder="ค้นหาสินค้า รุ่น หรือ SKU" />
            <button class="btn btn-danger" type="submit">ค้นหา</button>
          </div>
        </form>

        <div class="col-5 col-md-auto order-2 order-md-3 text-end">
          <div v-if="auth.isAuthenticated" ref="profileMenuRoot" class="dropdown" @keydown.esc="profileMenuOpen = false">
            <button class="btn btn-outline-danger dropdown-toggle" type="button" aria-controls="profile-menu" :aria-expanded="profileMenuOpen" @click.stop="profileMenuOpen = !profileMenuOpen">
              โปรไฟล์
            </button>
            <ul id="profile-menu" class="dropdown-menu dropdown-menu-end" :class="{ show: profileMenuOpen }" @click="profileMenuOpen = false">
              <li><h6 class="dropdown-header">บัญชีของฉัน</h6></li>
              <li><RouterLink class="dropdown-item" to="/user/orders">Order ของฉัน</RouterLink></li>
              <li><RouterLink class="dropdown-item" to="/user/profile">โปรไฟล์</RouterLink></li>
              <li><hr class="dropdown-divider" /></li>
              <li><button class="dropdown-item text-danger" type="button" @click="logout">ออกจากระบบ</button></li>
            </ul>
          </div>
          <RouterLink v-else class="btn btn-outline-secondary" to="/user/profile">บัญชีของฉัน</RouterLink>
        </div>
      </div>

      <nav class="nav flex-wrap gap-2 border-top py-2" aria-label="เมนูร้านค้า">
        <RouterLink class="nav-link px-2" active-class="active" to="/user/goods/recommended">สินค้าแนะนำ</RouterLink>
        <RouterLink class="nav-link px-2" active-class="active" to="/user/goods">สินค้าทั้งหมด</RouterLink>
        <RouterLink class="nav-link px-2" active-class="active" to="/user/payment">ชำระเงิน</RouterLink>
      </nav>
    </div>
  </header>
</template>
