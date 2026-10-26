<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPublicProductById, mapCatalogProductDetail } from '../../api/catalog'
import { useAuthStore } from '../../stores/authStore'
import { shouldRedirectToCart, useCartStore } from '../../stores/cartStore'
import { formatPrice } from '../../utils/formatters'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const product = ref(null)
const selectedImage = ref('')
const quantity = ref(1)
const loading = ref(true)
const adding = ref(false)
const added = ref(false)
const errorMessage = ref('')
const activeImage = computed(() => selectedImage.value || product.value?.image || '')
let latestRequest = 0

async function loadProduct() {
	const requestId = ++latestRequest
	loading.value = true
	errorMessage.value = ''
	product.value = null
	try {
		const response = await getPublicProductById(route.params.id)
		if (requestId !== latestRequest) return
		product.value = mapCatalogProductDetail(response)
		selectedImage.value = product.value.images.find((image) => image.isPrimary)?.imageUrl || product.value.images[0]?.imageUrl || product.value.image
		quantity.value = 1
	} catch (error) {
		if (requestId !== latestRequest) return
		errorMessage.value = error.response?.data?.message || 'โหลดรายละเอียดสินค้าไม่สำเร็จ'
	} finally {
		if (requestId === latestRequest) loading.value = false
	}
}

async function addToCart() {
	if (!product.value) return
	adding.value = true
	added.value = false
	errorMessage.value = ''
	added.value = await cart.addItem(product.value.id, quantity.value)
	if (!added.value) {
		errorMessage.value = cart.errorMessage
		if (shouldRedirectToCart(errorMessage.value)) await router.push('/user/cart')
	}
	adding.value = false
}

onMounted(loadProduct)
watch(() => route.params.id, loadProduct)
</script>

<template>
	<main class="container py-4">
		<nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
			<RouterLink class="link-secondary text-decoration-none" to="/user/goods">สินค้าทั้งหมด</RouterLink>
			<span aria-hidden="true">›</span>
			<span aria-current="page">{{ product?.name || 'รายละเอียดสินค้า' }}</span>
		</nav>

		<div v-if="loading" class="d-flex justify-content-center py-5" role="status">
			<span class="spinner-border text-danger" aria-hidden="true"></span>
			<span class="visually-hidden">กำลังโหลดรายละเอียดสินค้า</span>
		</div>

		<div v-else-if="errorMessage && !product" class="alert alert-warning" role="alert">
			<p class="mb-2">{{ errorMessage }}</p>
			<RouterLink class="btn btn-outline-secondary btn-sm" to="/user/goods">กลับไปเลือกสินค้า</RouterLink>
		</div>

		<template v-else-if="product">
			<div v-if="errorMessage" class="alert" :class="added ? 'alert-success' : 'alert-danger'" role="status">{{ errorMessage }}</div>
			<div v-else-if="added" class="alert alert-success" role="status">เพิ่มสินค้าในตะกร้าแล้ว</div>

			<div class="row g-4 align-items-start">
				<section class="col-lg-6" aria-label="รูปภาพสินค้า">
					<div class="ratio ratio-4x3 rounded border bg-white overflow-hidden">
						<img v-if="activeImage" :src="activeImage" :alt="product.name" class="w-100 h-100 object-fit-contain p-3" />
						<div v-else class="d-flex align-items-center justify-content-center text-secondary">ไม่มีรูปสินค้า</div>
					</div>
					<div v-if="product.images.length > 1" class="d-flex flex-wrap gap-2 mt-3">
						<button v-for="image in product.images" :key="image.imageId" class="btn p-1 border" :class="{ 'border-danger': selectedImage === image.imageUrl }" type="button" :aria-label="`ดูรูปที่ ${image.sortOrder + 1}`" @click="selectedImage = image.imageUrl">
							<img :src="image.imageUrl" :alt="product.name" width="72" height="64" class="object-fit-contain" />
						</button>
					</div>
				</section>

				<section class="col-lg-6" aria-labelledby="product-title">
					<div class="d-flex flex-wrap gap-2 small text-secondary mb-2">
						<span>{{ product.category }}</span>
						<span v-if="product.brand">· {{ product.brand }}</span>
						<span v-if="product.sku">· SKU: {{ product.sku }}</span>
					</div>
					<h1 id="product-title" class="h3 fw-bold mb-2">{{ product.name }}</h1>
					<p class="text-secondary">{{ product.description || 'รายละเอียดสินค้ายังไม่มี' }}</p>

					<div class="border-top border-bottom py-3 my-3">
						<strong class="fs-3 text-danger">฿{{ formatPrice(product.price) }}</strong>
					</div>

					<p class="mb-3">
						<span :class="product.stockCount > 0 ? 'text-success' : 'text-danger'">●</span>
						<span class="ms-1">{{ product.stockCount > 0 ? `พร้อมจัดส่ง (${product.stockCount} ชิ้น)` : 'สินค้าหมด' }}</span>
					</p>

					<section v-if="product.specs.length" class="mb-4">
						<h2 class="h6 fw-bold">ข้อมูลจำเพาะ</h2>
						<dl class="row small mb-0">
							<template v-for="spec in product.specs" :key="spec">
								<dt class="col-5 text-secondary fw-normal">{{ spec.split(':')[0] }}</dt>
								<dd class="col-7">{{ spec.includes(':') ? spec.slice(spec.indexOf(':') + 1).trim() : spec }}</dd>
							</template>
						</dl>
					</section>

					<div v-if="auth.isAuthenticated" class="d-flex flex-wrap align-items-end gap-2">
						<label class="small text-secondary">
							จำนวน
							<input v-model.number="quantity" class="form-control mt-1" type="number" min="1" :max="product.stockCount" :disabled="product.stockCount <= 0" />
						</label>
						<button class="btn btn-danger flex-grow-1" type="button" :disabled="adding || product.stockCount <= 0 || quantity < 1 || quantity > product.stockCount" @click="addToCart">
							{{ adding ? 'กำลังเพิ่ม...' : added ? 'เพิ่มลงตะกร้าแล้ว' : 'เพิ่มลงตะกร้า' }}
						</button>
					</div>
					<RouterLink v-else class="btn btn-danger w-100" :to="{ name: 'auth-login', query: { redirect: route.fullPath } }">เข้าสู่ระบบเพื่อสั่งซื้อ</RouterLink>
				</section>
			</div>
		</template>
	</main>
</template>