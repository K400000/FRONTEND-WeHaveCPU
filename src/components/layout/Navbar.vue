<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from '../../assets/WHClogo.png'
import { resolveApiAsset } from '../../api/catalog'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'

const auth = useAuthStore()
const cart = useCartStore()
const route = useRoute()
const router = useRouter()
const profileMenuOpen = ref(false)
const profileMenuRoot = ref(null)
const avatarFailed = ref(false)

watch(() => route.fullPath, () => { profileMenuOpen.value = false })
watch(() => auth.user?.avatarUrl, () => { avatarFailed.value = false })

function closeOnOutsideClick(event) {
  if (!profileMenuRoot.value?.contains(event.target)) profileMenuOpen.value = false
}

onMounted(async () => {
  document.addEventListener('click', closeOnOutsideClick)
  if (await auth.refreshSession()) await cart.refreshCart()
})
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))

async function logout() {
  try {
    await auth.logout()
  } finally {
    cart.resetCart()
    await router.replace({ name: 'auth-login' })
  }
}
</script>

<template>
  <header class="bg-white border-bottom">
    <div class="container">
      <div class="row align-items-center justify-content-between gy-2 py-3">
        <div class="col-auto">
          <RouterLink class="d-inline-flex align-items-center gap-2 text-dark fw-bold text-decoration-none" to="/user/goods/recommended" aria-label="We Have CPU หน้าหลัก">
            <img :src="logo" alt="" width="150" height="50" class="object-fit-contain" />
          </RouterLink>
        </div>

        <div class="col-auto ms-auto text-end">
          <div class="d-flex align-items-center justify-content-end gap-2">
            <RouterLink class="btn btn-outline-secondary position-relative" to="/user/cart" :aria-label="`ตะกร้าสินค้า ${cart.itemCount} ชิ้น`">
              <i class="bi bi-cart3" aria-hidden="true"></i>
              <span v-if="cart.itemCount" class="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger">{{ cart.itemCount }}</span>
              <span class="visually-hidden">ตะกร้าสินค้า</span>
            </RouterLink>

            <div ref="profileMenuRoot" class="dropdown" @keydown.esc="profileMenuOpen = false">
              <button class="btn p-0 border-0 rounded-circle overflow-hidden profile-avatar" type="button" aria-controls="profile-menu" :aria-expanded="profileMenuOpen" :aria-label="`เมนูโปรไฟล์ ${auth.user?.firstName || ''}`" @click.stop="profileMenuOpen = !profileMenuOpen">
                <img v-if="auth.isAuthenticated && auth.user?.avatarUrl && !avatarFailed" :src="resolveApiAsset(auth.user.avatarUrl)" :alt="`รูปโปรไฟล์ ${auth.user.firstName || ''}`" @error="avatarFailed = true" />
                <span v-else-if="auth.isAuthenticated" class="profile-avatar__fallback bg-secondary text-white fw-semibold">{{ auth.user?.firstName?.charAt(0) || 'U' }}</span>
                <i v-else class="bi bi-person-fill profile-avatar__guest" aria-hidden="true"></i>
              </button>
              <ul v-if="profileMenuOpen" id="profile-menu" class="dropdown-menu dropdown-menu-end show" @click="profileMenuOpen = false">
                <template v-if="auth.isAuthenticated">
                  <li><h6 class="dropdown-header">{{ [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || 'บัญชีของฉัน' }}</h6></li>
                  <li><RouterLink class="dropdown-item" to="/user/orders">Order ของฉัน</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/user/profile">โปรไฟล์ของฉัน</RouterLink></li>
                  <li><hr class="dropdown-divider" /></li>
                  <li><button class="dropdown-item text-danger" type="button" @click="logout">ออกจากระบบ</button></li>
                </template>
                <template v-else>
                  <li><h6 class="dropdown-header">บัญชีของฉัน</h6></li>
                  <li><RouterLink class="dropdown-item" to="/auth/login">เข้าสู่ระบบ</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/auth/register">สมัครสมาชิก</RouterLink></li>
                  <li><hr class="dropdown-divider" /></li>
                  <li><RouterLink class="dropdown-item" to="/user/profile">ดูโปรไฟล์</RouterLink></li>
                </template>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <nav class="nav flex-wrap gap-2 border-top py-2" aria-label="เมนูร้านค้า">
        <RouterLink class="nav-link px-2" active-class="active" to="/user/goods/recommended">สินค้าแนะนำ</RouterLink>
        <RouterLink class="nav-link px-2" active-class="active" to="/user/goods">สินค้าทั้งหมด</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.profile-avatar,
.profile-avatar__fallback {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
}

.profile-avatar__guest {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--bs-border-color);
  border-radius: 50%;
  color: var(--bs-secondary-color);
  font-size: 1.15rem;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
