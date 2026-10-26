<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getBrands, getCategories, getPublicProducts, mapCatalogProduct } from '../../api/catalog'
import ProductCard from './ProductCard.vue'
import ryzenImage from '../../assets/ryzen-7-7800x3d.jpg'
import intelI9Image from '../../assets/intel-core-i9-14900k.jpg'
import intelI5Image from '../../assets/intel-core-i5-14400f.jpg'

const categories = ref([])
const brands = ref([])
const catalogLoading = ref(true)
const catalogError = ref(false)
const products = ref([])
const productsLoading = ref(true)
const productsError = ref('')
const activeSlideIndex = ref(0)
const promoHovered = ref(false)
let promoTimer
const nextPage = ref(1)
const hasMoreProducts = ref(false)
const promoSlides = [
  {
    eyebrow: 'AMD RYZEN 7000',
    title: 'เกมลื่นขึ้น ด้วย Ryzen 7 7800X3D',
    copy: '8 Cores / 16 Threads พร้อม 3D V-Cache สำหรับเครื่องเล่นเกมของคุณ',
    image: ryzenImage,
    imageAlt: 'AMD Ryzen 7 7800X3D processor',
    background: 'bg-dark',
  },
  {
    eyebrow: 'INTEL CORE 14TH GEN',
    title: 'พลังประมวลผลสำหรับทุกงาน',
    copy: 'เลือก Intel Core ให้เหมาะกับการเล่นเกม ทำงาน และสร้างสรรค์คอนเทนต์',
    image: intelI9Image,
    imageAlt: 'Intel Core i9 14th Gen processor',
    background: 'bg-secondary',
  },
  {
    eyebrow: 'CPU FOR YOUR BUILD',
    title: 'เริ่มประกอบเครื่องในแบบของคุณ',
    copy: 'ดูซีพียูและอุปกรณ์คอมพิวเตอร์ทั้งหมดในร้าน',
    image: intelI5Image,
    imageAlt: 'Intel Core i5 14th Gen processor',
    background: 'bg-danger',
  },
]

onMounted(async () => {
  promoTimer = window.setInterval(() => {
    if (!promoHovered.value) advancePromo()
  }, 5000)

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

onUnmounted(() => window.clearInterval(promoTimer))

function advancePromo() {
  activeSlideIndex.value = (activeSlideIndex.value + 1) % promoSlides.length
}

function previousPromo() {
  activeSlideIndex.value = (activeSlideIndex.value + promoSlides.length - 1) % promoSlides.length
}

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

    <section class="carousel rounded-3 overflow-hidden mb-4" aria-label="สินค้าแนะนำ" aria-roledescription="carousel" @mouseenter="promoHovered = true" @mouseleave="promoHovered = false">
      <div class="carousel-indicators">
        <button v-for="(slide, index) in promoSlides" :key="slide.eyebrow" type="button" :class="{ active: index === activeSlideIndex }" :aria-current="index === activeSlideIndex ? 'true' : undefined" :aria-label="`ไปยังภาพที่ ${index + 1}`" @click="activeSlideIndex = index"></button>
      </div>
      <div class="carousel-inner">
        <div class="row g-0 align-items-stretch text-white" :class="promoSlides[activeSlideIndex].background" aria-live="polite">
          <div class="col-md-6 d-flex flex-column justify-content-center p-4 p-lg-5">
            <span class="badge bg-white text-dark align-self-start mb-3">{{ promoSlides[activeSlideIndex].eyebrow }}</span>
            <h2 class="h3 fw-bold mb-2">{{ promoSlides[activeSlideIndex].title }}</h2>
            <p class="mb-3 opacity-75">{{ promoSlides[activeSlideIndex].copy }}</p>
            <RouterLink class="btn btn-outline-light align-self-start" to="/user/goods">เลือกดูสินค้า</RouterLink>
          </div>
          <div class="col-md-6 bg-white">
            <div class="ratio ratio-16x9 h-100">
              <img :key="activeSlideIndex" class="promo-image w-100 h-100 object-fit-contain p-3" :src="promoSlides[activeSlideIndex].image" :alt="promoSlides[activeSlideIndex].imageAlt" />
            </div>
          </div>
        </div>
      </div>
      <button class="carousel-control-prev" type="button" aria-label="ภาพก่อนหน้า" @click="previousPromo">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      </button>
      <button class="carousel-control-next" type="button" aria-label="ภาพถัดไป" @click="advancePromo">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
      </button>
    </section>

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

<style scoped>
.promo-image { animation: promo-image-in 0.35s ease; }
@keyframes promo-image-in {
  from { opacity: 0.45; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .promo-image { animation: none; }
}
</style>
