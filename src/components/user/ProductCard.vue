<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { shouldRedirectToCart, useCartStore } from '../../stores/cartStore'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  horizontal: {
    type: Boolean,
    default: false,
  },
})

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const adding = ref(false)
const added = ref(false)
const addError = ref('')

const formatPrice = (price) => new Intl.NumberFormat('th-TH').format(price)

async function addToCart() {
  adding.value = true
  added.value = false
  addError.value = ''
  added.value = await cart.addItem(props.product.id, 1)
  if (!added.value) {
    addError.value = cart.errorMessage
    if (shouldRedirectToCart(addError.value)) await router.push('/user/cart')
  }
  adding.value = false
}
</script>

<template>
  <article class="card h-100" :class="{ 'flex-md-row': horizontal }">
    <div class="position-relative p-3 pb-0" :class="{ 'col-md-4 p-md-3': horizontal }">
      <RouterLink class="d-block text-decoration-none" :to="`/user/goods/${product.id}`" :aria-label="`ดูรายละเอียด ${product.name}`">
        <div class="ratio ratio-16x9 bg-light rounded overflow-hidden">
          <img v-if="product.image" class="w-100 h-100 object-fit-cover" :src="product.image" :alt="product.name" />
          <div v-else class="d-flex align-items-center justify-content-center text-secondary small">ไม่มีรูปสินค้า</div>
        </div>
      </RouterLink>
      <span v-if="product.badge" class="badge text-bg-danger position-absolute top-0 start-0 m-4">{{ product.badge }}</span>
    </div>

    <div class="card-body d-flex flex-column" :class="{ 'col-md-8': horizontal }">
      <div class="d-flex justify-content-between gap-2 small text-secondary">
        <span>{{ product.category || product.brand }}</span>
        <span v-if="product.sku" class="text-nowrap">SKU: {{ product.sku }}</span>
        <span v-else-if="product.warranty" class="text-nowrap">{{ product.warranty }}</span>
      </div>
      <h2 class="h6 fw-bold mt-2 mb-1"><RouterLink class="link-dark text-decoration-none" :to="`/user/goods/${product.id}`">{{ product.name }}</RouterLink></h2>
      <p class="small text-secondary mb-2">{{ product.description }}</p>

      <div v-if="product.specs?.length" class="row g-1 mb-3">
        <div v-for="spec in product.specs" :key="spec" class="col-6">
          <span class="d-block border rounded px-2 py-1 small text-secondary">{{ spec }}</span>
        </div>
      </div>

      <div class="small mb-2">
        <span :class="product.stockCount > 0 ? 'text-success' : 'text-danger'">●</span>
        <span class="text-secondary"> {{ product.stock }} (เหลือ {{ product.stockCount }} ชิ้น)</span>
      </div>

      <div class="d-flex align-items-baseline gap-2 mt-auto">
        <strong class="fs-5 text-danger">฿{{ formatPrice(product.price) }}</strong>
        <del v-if="product.originalPrice && product.originalPrice > product.price" class="small text-secondary">฿{{ formatPrice(product.originalPrice) }}</del>
      </div>

      <RouterLink v-if="!auth.isAuthenticated" class="btn btn-danger w-100 mt-3" to="/auth/login">เข้าสู่ระบบเพื่อสั่งซื้อ</RouterLink>
      <button v-else class="btn btn-danger w-100 mt-3" type="button" :disabled="adding || product.stockCount <= 0" @click="addToCart">
        {{ adding ? 'กำลังเพิ่ม...' : added ? 'เพิ่มลงตะกร้าแล้ว' : product.stockCount > 0 ? 'เพิ่มลงตะกร้า' : 'สินค้าหมด' }}
      </button>
      <p v-if="addError" class="small text-danger mt-2 mb-0" role="alert">{{ addError }}</p>
    </div>
  </article>
</template>