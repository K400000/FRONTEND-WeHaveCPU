<script setup>
import { onMounted, ref } from 'vue'
import { getBrands, getCategories, getPublicProducts, mapCatalogProduct } from '../../api/catalog'
import ProductCard from './ProductCard.vue'

const categories = ref([])
const brands = ref([])
const catalogLoading = ref(true)
const catalogError = ref(false)
const products = ref([])
const productsLoading = ref(true)
const productsError = ref('')
const nextPage = ref(1)
const hasMoreProducts = ref(false)

onMounted(async () => {
  const [categoryResult, brandResult, productResult] = await Promise.allSettled([
    getCategories(),
    getBrands(),
    getPublicProducts({ page: 1, limit: 12 }),
  ])

  if (categoryResult.status === 'fulfilled') categories.value = categoryResult.value
  if (brandResult.status === 'fulfilled') brands.value = brandResult.value
  catalogError.value = categoryResult.status === 'rejected' || brandResult.status === 'rejected'
  catalogLoading.value = false

  if (productResult.status === 'fulfilled') {
    products.value = productResult.value.data.map(mapCatalogProduct)
    nextPage.value = productResult.value.pagination.currentPage + 1
    hasMoreProducts.value = productResult.value.pagination.currentPage < productResult.value.pagination.totalPages
  } else {
    productsError.value = 'โหลดสินค้าไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง'
  }
  productsLoading.value = false
})

async function loadMoreProducts() {
  productsLoading.value = true
  productsError.value = ''

  try {
    const response = await getPublicProducts({ page: nextPage.value, limit: 12 })
    products.value.push(...response.data.map(mapCatalogProduct))
    nextPage.value = response.pagination.currentPage + 1
    hasMoreProducts.value = response.pagination.currentPage < response.pagination.totalPages
  } catch {
    productsError.value = 'โหลดสินค้าเพิ่มเติมไม่สำเร็จ กรุณาลองอีกครั้ง'
  } finally {
    productsLoading.value = false
  }
}
</script>

<template>
  <main class="container py-4">
    <nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
      <RouterLink class="link-secondary text-decoration-none" to="/user/goods">หน้าหลัก</RouterLink>
      <span aria-hidden="true">›</span>
      <span aria-current="page">สินค้าแนะนำ</span>
    </nav>

    <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
      <div>
        <h1 class="h3 fw-bold mb-1">สินค้าแนะนำ</h1>
        <p class="small text-secondary mb-0">เลือกชมสินค้าไอทีสำหรับการใช้งานและประกอบคอมพิวเตอร์</p>
      </div>
    </div>

    <div v-if="!catalogError" class="d-flex flex-wrap gap-2 mb-3 small" aria-label="สรุปข้อมูลสินค้าในร้าน">
      <span class="badge text-bg-light border text-secondary">{{ catalogLoading ? '…' : categories.length }} หมวดหมู่</span>
      <span class="badge text-bg-light border text-secondary">{{ catalogLoading ? '…' : brands.length }} แบรนด์</span>
    </div>

    <div v-if="productsError" class="alert alert-danger" role="alert">{{ productsError }}</div>
    <div v-else-if="productsLoading && !products.length" class="d-flex justify-content-center py-5" role="status">
      <span class="spinner-border text-danger" aria-hidden="true"></span>
      <span class="visually-hidden">กำลังโหลดสินค้า</span>
    </div>
    <div v-else-if="products.length" class="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3" :aria-busy="productsLoading">
      <div v-for="product in products" :key="product.id" class="col">
        <ProductCard :product="product" />
      </div>
    </div>
    <div v-else class="border rounded p-5 text-center">
      <h2 class="h5">ยังไม่มีสินค้าแนะนำ</h2>
      <p class="small text-secondary mb-0">ไม่พบสินค้าที่เปิดจำหน่ายในขณะนี้</p>
    </div>

    <div v-if="hasMoreProducts" class="text-center mt-4">
      <button class="btn btn-outline-secondary" type="button" :disabled="productsLoading" @click="loadMoreProducts">
        {{ productsLoading ? 'กำลังโหลด...' : 'โหลดสินค้าเพิ่มเติม' }}
      </button>
    </div>
  </main>
</template>
