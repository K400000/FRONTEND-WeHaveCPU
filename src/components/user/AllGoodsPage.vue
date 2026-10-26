<script setup>
import { computed, onMounted, ref } from 'vue'
import { getBrands, getCategories, getPublicProducts, mapCatalogProduct } from '../../api/catalog'
import ProductCard from './ProductCard.vue'

const categories = ref([])
const brands = ref([])
const products = ref([])
const selectedCategoryId = ref(null)
const selectedBrandId = ref(null)
const inStockOnly = ref(false)
const minimumPrice = ref('')
const maximumPrice = ref('')
const searchTerm = ref('')
const sortValue = ref('createdAt:DESC')
const viewMode = ref('grid')
const filtersOpen = ref(false)
const loading = ref(false)
const catalogLoading = ref(true)
const errorMessage = ref('')
const filterError = ref('')
const pagination = ref({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 12 })
let latestRequest = 0

const selectedCategory = computed(() => categories.value.find((category) => category.categoryId === selectedCategoryId.value))
const allCategoryCount = computed(() => categories.value.reduce((total, category) => total + Number(category.productCount || 0), 0))
const activeFilterCount = computed(() =>
	Number(Boolean(selectedCategoryId.value)) + Number(Boolean(selectedBrandId.value)) + Number(inStockOnly.value) +
	Number(minimumPrice.value !== '' || maximumPrice.value !== '') + Number(Boolean(searchTerm.value.trim())),
)

async function loadCatalogFilters() {
	catalogLoading.value = true
	filterError.value = ''
	const [categoryResult, brandResult] = await Promise.allSettled([getCategories(), getBrands()])

	if (categoryResult.status === 'fulfilled') categories.value = categoryResult.value
	else filterError.value = 'โหลดหมวดหมู่ไม่สำเร็จ'

	if (brandResult.status === 'fulfilled') brands.value = brandResult.value
	else filterError.value = filterError.value ? 'โหลดหมวดหมู่และแบรนด์ไม่สำเร็จ' : 'โหลดแบรนด์ไม่สำเร็จ'

	catalogLoading.value = false
}

async function loadProducts(page = 1) {
	const requestId = ++latestRequest
	const [sortBy, sortOrder] = sortValue.value.split(':')
	const params = {
		page,
		limit: pagination.value.limit,
		sortBy,
		sortOrder,
		...(selectedCategoryId.value ? { categoryId: selectedCategoryId.value } : {}),
		...(selectedBrandId.value ? { brandId: selectedBrandId.value } : {}),
		...(inStockOnly.value ? { inStock: true } : {}),
		...(minimumPrice.value !== '' ? { minPrice: minimumPrice.value } : {}),
		...(maximumPrice.value !== '' ? { maxPrice: maximumPrice.value } : {}),
		...(searchTerm.value.trim() ? { search: searchTerm.value.trim() } : {}),
	}

	loading.value = true
	errorMessage.value = ''
	try {
		const response = await getPublicProducts(params)
		if (requestId !== latestRequest) return
		products.value = response.data.map(mapCatalogProduct)
		pagination.value = response.pagination
	} catch {
		if (requestId !== latestRequest) return
		products.value = []
		pagination.value = { ...pagination.value, totalItems: 0, totalPages: 1, currentPage: 1 }
		errorMessage.value = 'โหลดสินค้าไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง'
	} finally {
		if (requestId === latestRequest) loading.value = false
	}
}

function selectCategory(categoryId) {
	selectedCategoryId.value = categoryId
	loadProducts(1)
}

function selectBrand(brandId) {
	selectedBrandId.value = brandId
	loadProducts(1)
}

function clearFilters() {
	selectedCategoryId.value = null
	selectedBrandId.value = null
	inStockOnly.value = false
	minimumPrice.value = ''
	maximumPrice.value = ''
	searchTerm.value = ''
	loadProducts(1)
}

onMounted(() => {
	loadCatalogFilters()
	loadProducts()
})
</script>

<template>
	<main class="container py-4">
		<nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
			<RouterLink class="link-secondary text-decoration-none" to="/user/goods/recommended">หน้าหลัก</RouterLink>
			<span aria-hidden="true">›</span>
			<span>อุปกรณ์คอมพิวเตอร์ (Hardware)</span>
			<span aria-hidden="true">›</span>
			<span class="text-danger" aria-current="page">{{ selectedCategory?.name || 'สินค้าทั้งหมด' }}</span>
		</nav>

		<div class="row g-4">
			<aside class="col-lg-3 col-xl-2" aria-label="ตัวกรองสินค้า">
				<button class="btn btn-outline-secondary w-100 d-lg-none mb-3" type="button" :aria-expanded="filtersOpen" @click="filtersOpen = !filtersOpen">
					{{ filtersOpen ? 'ซ่อนตัวกรอง' : `ตัวกรองสินค้า${activeFilterCount ? ` (${activeFilterCount})` : ''}` }}
				</button>

				<div :class="filtersOpen ? 'd-block' : 'd-none d-lg-block'">
					<div v-if="filterError" class="alert alert-warning py-2 small">{{ filterError }}</div>
					<section class="border-bottom pb-3 mb-3">
						<label class="form-check">
							<input v-model="inStockOnly" class="form-check-input" type="checkbox" @change="loadProducts(1)" />
							<span class="form-check-label">แสดงสินค้าพร้อมขายเท่านั้น</span>
						</label>
					</section>

					<section class="border-bottom pb-3 mb-3">
                        <h2 class="h6 fw-semibold mb-2">หมวดหมู่สินค้า</h2>
                        <div class="list-group list-group-flush bg-transparent">
                            <p v-if="catalogLoading" class="small text-secondary mb-2">กำลังโหลดหมวดหมู่...</p>
                            
                            <!-- สินค้าทั้งหมด -->
                            <button 
                                class="list-group-item list-group-item-action bg-transparent border-0 d-flex justify-content-between align-items-center px-0 py-2" 
                                :class="{ 'text-danger fw-semibold': !selectedCategoryId }" 
                                type="button" 
                                @click="selectCategory(null)"
                            >
                                <span>สินค้าทั้งหมด</span>
                                <span class="small">{{ allCategoryCount }}</span>
                            </button>

                            <!-- หมวดหมู่ย่อย -->
                            <button 
                                v-for="category in categories" 
                                :key="category.categoryId" 
                                class="list-group-item list-group-item-action bg-transparent border-0 d-flex justify-content-between align-items-center px-0 py-2" 
                                :class="{ 'text-danger fw-semibold': selectedCategoryId === category.categoryId }" 
                                type="button" 
                                :disabled="!category.productCount" 
                                @click="selectCategory(category.categoryId)"
                            >
                                <span>{{ category.name }}</span>
                                <span class="small">{{ category.productCount }}</span>
                            </button>
                        </div>
                    </section>

					<section class="border-bottom pb-3 mb-3">
						<h2 class="h6 fw-semibold mb-2">ช่วงราคา</h2>
						<div class="input-group input-group-sm">
							<input v-model="minimumPrice" class="form-control" type="number" min="0" placeholder="ต่ำสุด" aria-label="ราคาต่ำสุด" @change="loadProducts(1)" />
							<span class="input-group-text">ถึง</span>
							<input v-model="maximumPrice" class="form-control" type="number" min="0" placeholder="สูงสุด" aria-label="ราคาสูงสุด" @change="loadProducts(1)" />
						</div>
					</section>

					<section class="border-bottom pb-3 mb-3">
						<h2 class="h6 fw-semibold mb-2">แบรนด์</h2>
						<p v-if="catalogLoading" class="small text-secondary mb-2">กำลังโหลดแบรนด์...</p>
						<label class="form-check mb-2">
							<input class="form-check-input" type="radio" name="catalog-brand" :checked="!selectedBrandId" @change="selectBrand(null)" />
							<span class="form-check-label d-flex justify-content-between w-100">ทุกแบรนด์</span>
						</label>
						<label v-for="brand in brands" :key="brand.brandId" class="form-check mb-2">
							<input class="form-check-input" type="radio" name="catalog-brand" :checked="selectedBrandId === brand.brandId" :disabled="!brand.productCount" @change="selectBrand(brand.brandId)" />
							<span class="form-check-label d-flex justify-content-between w-100">{{ brand.name }} <small class="text-secondary">({{ brand.productCount }})</small></span>
						</label>
					</section>

					<button class="btn btn-link btn-sm text-danger text-decoration-none p-0" type="button" @click="clearFilters">ล้างตัวกรองทั้งหมด</button>
				</div>
			</aside>

			<section class="col-lg-9 col-xl-10" aria-labelledby="goods-title">
				<div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
					<div>
						<h1 id="goods-title" class="h4 fw-bold mb-1">ผลการค้นหา “{{ selectedCategory?.name || 'สินค้าทั้งหมด' }}”</h1>
						<p class="small text-secondary mb-0">พบสินค้า {{ pagination.totalItems }} รายการ</p>
					</div>
					<div class="d-flex flex-wrap align-items-center gap-2 ms-auto">
						<div class="btn-group btn-group-sm" role="group" aria-label="รูปแบบการแสดงผล">
							<button class="btn" :class="viewMode === 'grid' ? 'btn-dark' : 'btn-outline-secondary'" type="button" aria-label="แสดงแบบกริด" :aria-pressed="viewMode === 'grid'" @click="viewMode = 'grid'">▦</button>
							<button class="btn" :class="viewMode === 'list' ? 'btn-dark' : 'btn-outline-secondary'" type="button" aria-label="แสดงแบบรายการ" :aria-pressed="viewMode === 'list'" @click="viewMode = 'list'">☰</button>
						</div>
						<label class="d-flex align-items-center gap-2 small text-secondary">
							เรียงตาม
							<select v-model="sortValue" class="form-select form-select-sm w-auto" aria-label="เรียงลำดับสินค้า" @change="loadProducts(1)">
								<option value="createdAt:DESC">สินค้าใหม่</option>
								<option value="price:ASC">ราคาต่ำไปสูง</option>
								<option value="price:DESC">ราคาสูงไปต่ำ</option>
								<option value="name:ASC">ชื่อสินค้า A-Z</option>
							</select>
						</label>
					</div>
				</div>

				<form class="input-group mb-3" role="search" @submit.prevent="loadProducts(1)">
					<input v-model="searchTerm" class="form-control" type="search" placeholder="ค้นหาชื่อสินค้า หรือ SKU" aria-label="ค้นหาชื่อสินค้า หรือ SKU" />
					<button class="btn btn-outline-secondary" type="submit">ค้นหา</button>
				</form>

				<div v-if="activeFilterCount" class="d-flex flex-wrap align-items-center gap-2 border-bottom pb-3 mb-3 small">
					<span class="fw-semibold">ตัวกรองที่เลือก:</span>
					<span v-if="selectedCategory" class="badge text-bg-light border text-secondary">{{ selectedCategory.name }}</span>
					<span v-if="selectedBrandId" class="badge text-bg-light border text-secondary">{{ brands.find((brand) => brand.brandId === selectedBrandId)?.name }}</span>
					<span v-if="inStockOnly" class="badge text-bg-light border text-secondary">พร้อมขาย</span>
					<span v-if="minimumPrice !== '' || maximumPrice !== ''" class="badge text-bg-light border text-secondary">{{ minimumPrice || 0 }} - {{ maximumPrice || 'ไม่จำกัด' }} บาท</span>
					<span v-if="searchTerm.trim()" class="badge text-bg-light border text-secondary">ค้นหา: {{ searchTerm }}</span>
					<button class="btn btn-link btn-sm text-danger text-decoration-none p-0" type="button" @click="clearFilters">ล้างทั้งหมด</button>
				</div>

				<div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
				<div v-else-if="loading && !products.length" class="d-flex justify-content-center py-5" role="status">
					<span class="spinner-border text-danger" aria-hidden="true"></span>
					<span class="visually-hidden">กำลังโหลดสินค้า</span>
				</div>
				<div v-else-if="products.length" class="row g-3" :class="viewMode === 'grid' ? 'row-cols-1 row-cols-sm-2 row-cols-xxl-3' : 'row-cols-1'" :aria-busy="loading">
					<div v-for="product in products" :key="product.id" class="col">
						<ProductCard :product="product" :horizontal="viewMode === 'list'" />
					</div>
				</div>
				<div v-else class="border rounded p-5 text-center">
					<h2 class="h5">ไม่พบสินค้าที่ตรงกับตัวกรอง</h2>
					<p class="small text-secondary">ลองปรับหมวดหมู่ แบรนด์ หรือช่วงราคาแล้วค้นหาอีกครั้ง</p>
					<button class="btn btn-outline-danger btn-sm" type="button" @click="clearFilters">ล้างตัวกรอง</button>
				</div>

				<div v-if="pagination.totalPages > 1" class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
					<span class="small text-secondary">หน้า {{ pagination.currentPage }} จาก {{ pagination.totalPages }}</span>
					<div class="btn-group btn-group-sm">
						<button class="btn btn-outline-secondary" type="button" :disabled="loading || pagination.currentPage <= 1" @click="loadProducts(pagination.currentPage - 1)">ก่อนหน้า</button>
						<button class="btn btn-outline-secondary" type="button" :disabled="loading || pagination.currentPage >= pagination.totalPages" @click="loadProducts(pagination.currentPage + 1)">ถัดไป</button>
					</div>
				</div>
			</section>
		</div>
	</main>
</template>