<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from '../../assets/WHClogo.png'
import { resolveApiAsset } from '../../api/catalog'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const profileMenuOpen = ref(false)
const profileMenuRoot = ref(null)
const avatarFailed = ref(false)

const menus = [
  { to: '/admin/dashboard', label: 'แดชบอร์ดภาพรวม', icon: 'bi-speedometer2' },
  { to: '/admin/orders', label: 'จัดการคำสั่งซื้อ', icon: 'bi-receipt' },
  { to: '/admin/goods', label: 'จัดการและแก้ไขสินค้า', icon: 'bi-pencil-square' },
  { to: '/admin/roles', label: 'จัดการสิทธิ์', icon: 'bi-shield-check' },
]

const fullName = computed(() => [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || 'ผู้ดูแลระบบ')

watch(() => route.fullPath, () => { profileMenuOpen.value = false })
watch(() => auth.user?.avatarUrl, () => { avatarFailed.value = false })

function closeOnOutsideClick(event) {
  if (!profileMenuRoot.value?.contains(event.target)) profileMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick)
  if (!auth.isInitialized) auth.refreshSession()
})
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))

async function logout() {
  try {
    await auth.logout()
  } finally {
    await router.replace({ name: 'auth-login' })
  }
}
</script>

<template>
  <header class="bg-white border-bottom">
    <div class="container">
      <div class="row align-items-center gy-2 py-2">
        <div class="col-auto">
          <RouterLink class="d-inline-flex align-items-center gap-2 text-decoration-none" to="/admin/dashboard" aria-label="We Have CPU แดชบอร์ดผู้ดูแลระบบ">
            <img :src="logo" alt="" width="130" height="44" class="object-fit-contain" />
            <span class="badge text-bg-danger fw-normal">ระบบจัดการหลังร้าน</span>
          </RouterLink>
        </div>

        <nav class="col-12 col-lg order-3 order-lg-2 nav flex-wrap justify-content-lg-center" aria-label="เมนูผู้ดูแลระบบ">
          <RouterLink v-for="menu in menus" :key="menu.to" class="nav-link admin-link px-3 text-dark" active-class="active" :to="menu.to">
            <i class="bi me-1" :class="menu.icon" aria-hidden="true"></i>{{ menu.label }}
          </RouterLink>
        </nav>

        <div class="col col-lg-auto order-2 order-lg-3 d-flex align-items-center justify-content-end gap-2">
          

          <div ref="profileMenuRoot" class="dropdown" @keydown.esc="profileMenuOpen = false">
            <button class="btn d-flex align-items-center gap-2 p-1 border-0" type="button" aria-controls="admin-profile-menu" :aria-expanded="profileMenuOpen" aria-label="เมนูโปรไฟล์ผู้ดูแลระบบ" @click.stop="profileMenuOpen = !profileMenuOpen">
              <span class="admin-avatar rounded-circle overflow-hidden">
                <img v-if="auth.user?.avatarUrl && !avatarFailed" :src="resolveApiAsset(auth.user.avatarUrl)" :alt="`รูปโปรไฟล์ ${fullName}`" @error="avatarFailed = true" />
                <span v-else class="admin-avatar bg-secondary text-white fw-semibold">{{ auth.user?.firstName?.charAt(0) || 'A' }}</span>
              </span>
              <span class="text-start d-none d-md-block lh-sm">
                <span class="d-block small fw-semibold">{{ fullName }}</span>
                <span class="d-block text-danger" style="font-size: 0.75rem">ผู้ดูแลระบบ (Admin)</span>
              </span>
              <i class="bi bi-chevron-down small text-secondary" aria-hidden="true"></i>
            </button>
            <ul v-if="profileMenuOpen" id="admin-profile-menu" class="dropdown-menu dropdown-menu-end show" @click="profileMenuOpen = false">
              <li>
                <h6 class="dropdown-header">{{ fullName }}</h6>
                <span class="badge text-bg-danger ms-3 mb-1">Admin</span>
              </li>
              <li><RouterLink class="dropdown-item" to="/admin/profile"><i class="bi bi-person-vcard me-2" aria-hidden="true"></i>โปรไฟล์ของฉัน</RouterLink></li>
              <li><RouterLink class="dropdown-item" to="/admin/roles"><i class="bi bi-shield-check me-2" aria-hidden="true"></i>จัดการสิทธิ์</RouterLink></li>
              <li><RouterLink class="dropdown-item d-md-none" to="/user/goods/recommended"><i class="bi bi-shop me-2" aria-hidden="true"></i>ดูหน้าร้านจริง</RouterLink></li>
              <li><hr class="dropdown-divider" /></li>
              <li><button class="dropdown-item text-danger" type="button" @click="logout"><i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>ออกจากระบบ</button></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.admin-avatar {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
}

.admin-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-link {
  border-bottom: 2px solid transparent;
  border-radius: 0;
}

.admin-link:hover {
  color: var(--bs-danger) !important;
}

.admin-link.active {
  color: var(--bs-danger) !important;
  border-bottom-color: var(--bs-danger);
  font-weight: 600;
}
</style>
