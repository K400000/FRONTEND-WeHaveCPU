<script setup>
import { computed, onMounted, ref } from 'vue'
import { getBrands, getCategories, getPublicProducts, mapCatalogProduct } from '../../api/catalog'
import { createProduct } from '../../api/adminProducts'
import CatalogManageModal from './CatalogManageModal.vue'
import { formatPrice } from '../../utils/formatters'

const sortOptions = [
  { value: 'createdAt:DESC', label: 'สินค้าใหม่ล่าสุด' },
  { value: 'price:ASC', label: 'ราคาต่ำไปสูง' },
  { value: 'price:DESC', label: 'ราคาสูงไปต่ำ' },
  { value: 'name:ASC', label: 'ชื่อสินค้า A-Z' },
  { value: 'stock:ASC', label: 'สต็อกน้อยไปมาก' },
]
const lowStockLimit = 5

const categories = ref([])
const brands = ref([])
const products = ref([])
const searchTerm = ref('')
const categoryId = ref('')
const brandId = ref('')
const sortValue = ref('createdAt:DESC')
const inStockOnly = ref(false)
const loading = ref(true)
const errorMessage = ref('')
const filterError = ref('')
const pagination = ref({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 8 })
let latestRequest = 0

const hasFilter = computed(() => Boolean(searchTerm.value.trim() || categoryId.value || brandId.value || inStockOnly.value))
const rangeText = computed(() => {
  const { totalItems, currentPage, limit } = pagination.value
  if (!totalItems) return ''
  const from = (currentPage - 1) * limit + 1
  return `${from} - ${Math.min(currentPage * limit, totalItems)}`
})
const pageNumbers = computed(() => {
  const { totalPages, currentPage } = pagination.value
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

async function loadFilters() {
  const [categoryResult, brandResult] = await Promise.allSettled([getCategories(), getBrands()])
  if (categoryResult.status === 'fulfilled') categories.value = categoryResult.value
  if (brandResult.status === 'fulfilled') brands.value = brandResult.value
  if (categoryResult.status === 'rejected' || brandResult.status === 'rejected') filterError.value = 'โหลดหมวดหมู่หรือแบรนด์ไม่สำเร็จ'
}

async function loadProducts(page = 1) {
  const requestId = ++latestRequest
  const [sortBy, sortOrder] = sortValue.value.split(':')
  const params = {
    page,
    limit: pagination.value.limit,
    sortBy,
    sortOrder,
    ...(categoryId.value ? { categoryId: categoryId.value } : {}),
    ...(brandId.value ? { brandId: brandId.value } : {}),
    ...(inStockOnly.value ? { inStock: true } : {}),
    ...(searchTerm.value.trim() ? { search: searchTerm.value.trim() } : {}),
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getPublicProducts(params)
    if (requestId !== latestRequest) return
    products.value = response.data.map(mapCatalogProduct)
    pagination.value = response.pagination
  } catch (error) {
    if (requestId !== latestRequest) return
    products.value = []
    pagination.value = { ...pagination.value, totalItems: 0, totalPages: 1, currentPage: 1 }
    errorMessage.value = error.response?.data?.message || 'โหลดสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง'
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

function clearFilters() {
  searchTerm.value = ''
  categoryId.value = ''
  brandId.value = ''
  inStockOnly.value = false
  loadProducts(1)
}

function stockBadge(product) {
  if (product.stockCount <= 0) return { text: 'สินค้าหมด', cls: 'text-bg-danger' }
  if (product.stockCount <= lowStockLimit) return { text: `เหลือน้อย ${product.stockCount} ชิ้น`, cls: 'text-bg-warning' }
  return { text: `คงเหลือ ${product.stockCount} ชิ้น`, cls: 'text-bg-success' }
}

// ---- จัดการหมวดหมู่ / แบรนด์ ----
const manageKind = ref(null)

async function onCatalogChanged() {
  if (categoryId.value && !categories.value.some((item) => item.categoryId === categoryId.value)) categoryId.value = ''
  await loadFilters()
  if (categoryId.value && !categories.value.some((item) => item.categoryId === categoryId.value)) categoryId.value = ''
  if (brandId.value && !brands.value.some((item) => item.brandId === brandId.value)) brandId.value = ''
  await loadProducts(pagination.value.currentPage)
}

// ---- เพิ่มสินค้าใหม่ ----
const showAdd = ref(false)
const adding = ref(false)
const addError = ref('')
const addFieldErrors = ref({})
const createdMessage = ref('')
const createdProductId = ref(null)
const newProduct = ref(emptyProduct())

function emptyProduct() {
  return { sku: '', name: '', description: '', price: '', stock: '0', categoryId: '', brandId: '', isActive: true }
}

function openAdd() {
  newProduct.value = emptyProduct()
  addFieldErrors.value = {}
  addError.value = ''
  showAdd.value = true
}

function closeAdd() {
  if (!adding.value) showAdd.value = false
}

function validateNew() {
  const errors = {}
  const sku = String(newProduct.value.sku).trim()
  const name = String(newProduct.value.name).trim()
  const price = Number(newProduct.value.price)
  const stock = Number(newProduct.value.stock)

  if (!sku) errors.sku = 'กรุณากรอก SKU'
  else if (sku.length > 50) errors.sku = 'SKU ต้องไม่เกิน 50 ตัวอักษร'
  if (!name) errors.name = 'กรุณากรอกชื่อสินค้า'
  else if (name.length > 255) errors.name = 'ชื่อสินค้าต้องไม่เกิน 255 ตัวอักษร'
  if (newProduct.value.price === '' || !Number.isFinite(price) || price < 0) errors.price = 'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป'
  else if (!/^\d+(\.\d{1,2})?$/.test(String(newProduct.value.price))) errors.price = 'ราคาทศนิยมได้ไม่เกิน 2 ตำแหน่ง'
  if (newProduct.value.stock === '' || !Number.isInteger(stock) || stock < 0) errors.stock = 'สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป'
  if (!newProduct.value.categoryId) errors.categoryId = 'กรุณาเลือกหมวดหมู่'
  return errors
}

async function submitAdd() {
  addError.value = ''
  addFieldErrors.value = validateNew()
  if (Object.keys(addFieldErrors.value).length) return

  adding.value = true
  try {
    const result = await createProduct({
      sku: String(newProduct.value.sku).trim(),
      name: String(newProduct.value.name).trim(),
      description: newProduct.value.description,
      price: Number(newProduct.value.price),
      stock: Number(newProduct.value.stock),
      categoryId: Number(newProduct.value.categoryId),
      ...(newProduct.value.brandId ? { brandId: Number(newProduct.value.brandId) } : {}),
      isActive: newProduct.value.isActive,
    })
    createdProductId.value = result?.productId ?? result?.product?.productId ?? null
    createdMessage.value = `เพิ่มสินค้า "${newProduct.value.name.trim()}" เรียบร้อยแล้ว`
    showAdd.value = false
    await loadProducts(1)
  } catch (error) {
    const message = error.response?.data?.message || 'เพิ่มสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง'
    if (error.response?.status === 409) addFieldErrors.value = { sku: message }
    else addError.value = message
  } finally {
    adding.value = false
  }
}

onMounted(() => {
  loadFilters()
  loadProducts()
})
</script>

<template>
  <main class="container py-4">
    <nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
      <span>หลังร้าน</span>
      <span aria-hidden="true">›</span>
      <span class="text-danger" aria-current="page">จัดการสินค้า</span>
    </nav>

    <header class="mb-3">
      <h1 class="h3 fw-bold mb-1">จัดการรายการสินค้าและแก้ไขข้อมูลหน้าร้าน</h1>
      <p class="small text-secondary mb-0">เลือกสินค้าที่ต้องการเพื่อเข้าไปแก้ไขรายละเอียด ราคา และสต็อก</p>
    </header>

    <div class="d-flex flex-wrap justify-content-end gap-2 mb-3">
      <button class="btn btn-outline-secondary" type="button" @click="manageKind = 'category'"><i class="bi bi-tags me-1" aria-hidden="true"></i>จัดการหมวดหมู่</button>
      <button class="btn btn-outline-secondary" type="button" @click="manageKind = 'brand'"><i class="bi bi-award me-1" aria-hidden="true"></i>จัดการแบรนด์</button>
      <button class="btn btn-success" type="button" @click="openAdd"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>เพิ่มสินค้า</button>
    </div>

    <div v-if="createdMessage" class="alert alert-success d-flex flex-wrap justify-content-between align-items-center gap-2" role="status">
      <span>
        {{ createdMessage }}
        <RouterLink v-if="createdProductId" class="alert-link ms-2" :to="`/admin/goods/${createdProductId}/edit`">ไปอัปโหลดรูปและแก้ไขรายละเอียด</RouterLink>
      </span>
      <button type="button" class="btn-close" aria-label="ปิด" @click="createdMessage = ''"></button>
    </div>

    <form class="border rounded bg-white p-3 mb-3" role="search" @submit.prevent="loadProducts(1)">
      <div class="row g-2 align-items-center">
        <div class="col-12 col-lg-4">
          <div class="input-group">
            <span class="input-group-text bg-white"><i class="bi bi-search" aria-hidden="true"></i></span>
            <input v-model="searchTerm" class="form-control" type="search" placeholder="ค้นหาชื่อสินค้า หรือ SKU" aria-label="ค้นหาชื่อสินค้า หรือ SKU" />
          </div>
        </div>
        <div class="col-6 col-lg-2">
          <select v-model="categoryId" class="form-select" aria-label="หมวดหมู่" @change="loadProducts(1)">
            <option value="">ทุกหมวดหมู่</option>
            <option v-for="category in categories" :key="category.categoryId" :value="category.categoryId">{{ category.name }}</option>
          </select>
        </div>
        <div class="col-6 col-lg-2">
          <select v-model="brandId" class="form-select" aria-label="แบรนด์" @change="loadProducts(1)">
            <option value="">ทุกแบรนด์</option>
            <option v-for="brand in brands" :key="brand.brandId" :value="brand.brandId">{{ brand.name }}</option>
          </select>
        </div>
        <div class="col-6 col-lg-2">
          <select v-model="sortValue" class="form-select" aria-label="เรียงลำดับสินค้า" @change="loadProducts(1)">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
        <div class="col-6 col-lg-2 d-flex align-items-center justify-content-between gap-2">
          <label class="form-check mb-0 small text-nowrap">
            <input v-model="inStockOnly" class="form-check-input" type="checkbox" @change="loadProducts(1)" />
            <span class="form-check-label">มีสินค้าเท่านั้น</span>
          </label>
          <button class="btn btn-danger btn-sm" type="submit">ค้นหา</button>
        </div>
      </div>
      <div v-if="filterError" class="small text-warning-emphasis mt-2">{{ filterError }}</div>
    </form>

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 small text-secondary mb-3">
      <span>
        <template v-if="pagination.totalItems">แสดง {{ rangeText }} จากทั้งหมด {{ formatPrice(pagination.totalItems) }} รายการ</template>
        <template v-else>ผลการค้นหา 0 รายการ</template>
      </span>
      <button v-if="hasFilter" class="btn btn-link btn-sm text-danger text-decoration-none p-0" type="button" @click="clearFilters">ล้างตัวกรองทั้งหมด</button>
    </div>

    <div v-if="errorMessage" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{{ errorMessage }}</span>
      <button class="btn btn-sm btn-outline-danger" type="button" @click="loadProducts(pagination.currentPage)">ลองอีกครั้ง</button>
    </div>
    <div v-else-if="loading && !products.length" class="d-flex justify-content-center py-5" role="status">
      <span class="spinner-border text-danger" aria-hidden="true"></span>
      <span class="visually-hidden">กำลังโหลดสินค้า</span>
    </div>
    <div v-else-if="products.length" class="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4" :aria-busy="loading">
      <div v-for="product in products" :key="product.id" class="col">
        <article class="card h-100">
          <RouterLink class="d-block p-3 pb-0 text-decoration-none" :to="`/admin/goods/${product.id}/edit`" :aria-label="`แก้ไข ${product.name}`">
            <div class="ratio ratio-4x3 bg-light rounded overflow-hidden">
              <img v-if="product.image" class="w-100 h-100 object-fit-contain" :src="product.image" :alt="product.name" loading="lazy" />
              <div v-else class="d-flex align-items-center justify-content-center text-secondary small">ไม่มีรูปสินค้า</div>
            </div>
          </RouterLink>
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between gap-2 small text-secondary">
              <span class="text-truncate">{{ product.brand }}<template v-if="product.category"> · {{ product.category }}</template></span>
              <span class="text-nowrap">SKU: {{ product.sku }}</span>
            </div>
            <h2 class="h6 fw-bold mt-2 mb-2 product-name">{{ product.name }}</h2>
            <ul v-if="product.specs.length" class="list-unstyled small text-secondary mb-2">
              <li v-for="spec in product.specs.slice(0, 3)" :key="spec" class="text-truncate">• {{ spec }}</li>
            </ul>
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <strong class="fs-5 text-danger">฿{{ formatPrice(product.price) }}</strong>
                <span class="badge" :class="stockBadge(product).cls">{{ stockBadge(product).text }}</span>
              </div>
              <RouterLink class="btn btn-outline-danger w-100 btn-sm" :to="`/admin/goods/${product.id}/edit`">
                <i class="bi bi-pencil-square me-1" aria-hidden="true"></i>คลิกเพื่อแก้ไขสินค้า
              </RouterLink>
            </div>
          </div>
        </article>
      </div>
    </div>
    <div v-else class="border rounded bg-white p-5 text-center">
      <h2 class="h5">ไม่พบข้อมูล</h2>
      <p class="small text-secondary mb-3">ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
      <button v-if="hasFilter" class="btn btn-outline-danger btn-sm" type="button" @click="clearFilters">ล้างตัวกรอง</button>
    </div>

    <nav v-if="pagination.totalPages > 1" class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4" aria-label="เลือกหน้า">
      <span class="small text-secondary">หน้า {{ pagination.currentPage }} จาก {{ pagination.totalPages }}</span>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" type="button" :disabled="loading || pagination.currentPage <= 1" @click="loadProducts(pagination.currentPage - 1)">ก่อนหน้า</button>
        <button v-for="page in pageNumbers" :key="page" class="btn" :class="page === pagination.currentPage ? 'btn-danger' : 'btn-outline-secondary'" type="button" :disabled="loading" :aria-current="page === pagination.currentPage ? 'page' : undefined" @click="loadProducts(page)">{{ page }}</button>
        <button class="btn btn-outline-secondary" type="button" :disabled="loading || pagination.currentPage >= pagination.totalPages" @click="loadProducts(pagination.currentPage + 1)">ถัดไป</button>
      </div>
    </nav>
    <CatalogManageModal v-if="manageKind" :kind="manageKind" @close="manageKind = null" @changed="onCatalogChanged" />

    <template v-if="showAdd">
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="add-product-title" @keydown.esc="closeAdd">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <form class="modal-content" novalidate @submit.prevent="submitAdd">
            <div class="modal-header">
              <h2 id="add-product-title" class="modal-title h5">เพิ่มสินค้าใหม่</h2>
              <button type="button" class="btn-close" aria-label="ปิด" :disabled="adding" @click="closeAdd"></button>
            </div>
            <div class="modal-body">
              <p class="small text-secondary">กรอกข้อมูลสินค้า (<span class="text-danger">*</span> จำเป็น) หลังเพิ่มแล้วสามารถอัปโหลดรูปได้ที่หน้าแก้ไขสินค้า</p>
              <div v-if="addError" class="alert alert-danger py-2 small" role="alert">{{ addError }}</div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label small fw-semibold" for="new-name">ชื่อสินค้า <span class="text-danger">*</span></label>
                  <input id="new-name" v-model="newProduct.name" class="form-control" :class="{ 'is-invalid': addFieldErrors.name }" type="text" maxlength="255" autofocus />
                  <div class="invalid-feedback">{{ addFieldErrors.name }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold" for="new-sku">SKU <span class="text-danger">*</span></label>
                  <input id="new-sku" v-model="newProduct.sku" class="form-control" :class="{ 'is-invalid': addFieldErrors.sku }" type="text" maxlength="50" />
                  <div class="invalid-feedback">{{ addFieldErrors.sku }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold" for="new-category">หมวดหมู่ <span class="text-danger">*</span></label>
                  <select id="new-category" v-model="newProduct.categoryId" class="form-select" :class="{ 'is-invalid': addFieldErrors.categoryId }">
                    <option value="" disabled>เลือกหมวดหมู่</option>
                    <option v-for="category in categories" :key="category.categoryId" :value="category.categoryId">{{ category.name }}</option>
                  </select>
                  <div class="invalid-feedback">{{ addFieldErrors.categoryId }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold" for="new-brand">แบรนด์</label>
                  <select id="new-brand" v-model="newProduct.brandId" class="form-select">
                    <option value="">ไม่ระบุแบรนด์</option>
                    <option v-for="brand in brands" :key="brand.brandId" :value="brand.brandId">{{ brand.name }}</option>
                  </select>
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label small fw-semibold" for="new-price">ราคา (บาท) <span class="text-danger">*</span></label>
                  <input id="new-price" v-model="newProduct.price" class="form-control" :class="{ 'is-invalid': addFieldErrors.price }" type="number" min="0" step="0.01" inputmode="decimal" />
                  <div class="invalid-feedback">{{ addFieldErrors.price }}</div>
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label small fw-semibold" for="new-stock">สต็อก (ชิ้น)</label>
                  <input id="new-stock" v-model="newProduct.stock" class="form-control" :class="{ 'is-invalid': addFieldErrors.stock }" type="number" min="0" step="1" inputmode="numeric" />
                  <div class="invalid-feedback">{{ addFieldErrors.stock }}</div>
                </div>
                <div class="col-12">
                  <label class="form-label small fw-semibold" for="new-desc">รายละเอียดสินค้า</label>
                  <textarea id="new-desc" v-model="newProduct.description" class="form-control" rows="3"></textarea>
                </div>
                <div class="col-12">
                  <div class="form-check form-switch">
                    <input id="new-active" v-model="newProduct.isActive" class="form-check-input" type="checkbox" role="switch" />
                    <label class="form-check-label small" for="new-active">เปิดขายหน้าร้านทันที</label>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" :disabled="adding" @click="closeAdd">ยกเลิก</button>
              <button type="submit" class="btn btn-success" :disabled="adding">
                <span v-if="adding" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>{{ adding ? 'กำลังเพิ่ม...' : 'ยืนยันเพิ่มสินค้า' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </template>
  </main>
</template>

<style scoped>
.product-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6em;
}
</style>
