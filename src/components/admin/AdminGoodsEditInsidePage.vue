<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteProduct, getAdminProduct, setPrimaryProductImage, updateProduct, uploadProductImages, deleteProductImage } from '../../api/adminProducts'
import { getBrands, getCategories, resolveApiAsset } from '../../api/catalog'
import { formatPrice } from '../../utils/formatters'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const product = ref(null)
const categories = ref([])
const brands = ref([])
const loading = ref(true)
const loadError = ref('')
const notFound = ref(false)

const form = ref(emptyForm())
const specRows = ref([])
const fieldErrors = ref({})
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const selectedImageId = ref(null)
const imageBusy = ref(false)
const imageMessage = ref('')
const imageError = ref('')
const imageInput = ref(null)
const pendingFiles = ref([])
const pendingPreviews = ref([])

const showDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

function emptyForm() {
  return { sku: '', name: '', description: '', price: '', stock: '', categoryId: '', brandId: '', isActive: true }
}

function toSpecRows(specs) {
  let value = specs
  if (typeof value === 'string') {
    try { value = JSON.parse(value) } catch { return [] }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.entries(value).map(([key, raw]) => ({ key, value: raw === null ? '' : String(raw), raw }))
}

function fillForm(data) {
  form.value = {
    sku: data.sku || '',
    name: data.name || '',
    description: data.description || '',
    price: data.price ?? '',
    stock: data.stock ?? '',
    categoryId: data.categoryId ?? '',
    brandId: data.brandId ?? '',
    isActive: data.isActive !== false,
  }
  specRows.value = toSpecRows(data.specs)
}

const images = computed(() => (product.value?.images || []).map((image) => ({ ...image, url: resolveApiAsset(image.imageUrl) })))
const primaryImage = computed(() => images.value.find((image) => image.isPrimary) || images.value[0])
const activeImage = computed(() => images.value.find((image) => image.imageId === selectedImageId.value) || primaryImage.value)
const stockNumber = computed(() => Number(form.value.stock))
const remainingSlots = computed(() => Math.max(0, MAX_IMAGES - images.value.length))
const brandName = computed(() => brands.value.find((brand) => brand.brandId === form.value.brandId)?.name)
const categoryName = computed(() => categories.value.find((category) => category.categoryId === form.value.categoryId)?.name)

async function loadProduct() {
  loading.value = true
  loadError.value = ''
  notFound.value = false
  try {
    const data = await getAdminProduct(props.id)
    product.value = data
    fillForm(data)
    if (!images.value.some((image) => image.imageId === selectedImageId.value)) selectedImageId.value = null
  } catch (error) {
    if (error.response?.status === 404) notFound.value = true
    else loadError.value = error.response?.data?.message || 'โหลดข้อมูลสินค้าไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  const [categoryResult, brandResult] = await Promise.allSettled([getCategories(), getBrands()])
  if (categoryResult.status === 'fulfilled') categories.value = categoryResult.value
  if (brandResult.status === 'fulfilled') brands.value = brandResult.value
}

function validate() {
  const errors = {}
  const sku = String(form.value.sku).trim()
  const name = String(form.value.name).trim()
  const price = Number(form.value.price)
  const stock = Number(form.value.stock)

  if (!sku) errors.sku = 'กรุณากรอก SKU'
  else if (sku.length > 50) errors.sku = 'SKU ต้องไม่เกิน 50 ตัวอักษร'
  if (!name) errors.name = 'กรุณากรอกชื่อสินค้า'
  else if (name.length > 255) errors.name = 'ชื่อสินค้าต้องไม่เกิน 255 ตัวอักษร'
  if (form.value.price === '' || !Number.isFinite(price) || price < 0) errors.price = 'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป'
  else if (!/^\d+(\.\d{1,2})?$/.test(String(form.value.price))) errors.price = 'ราคาทศนิยมได้ไม่เกิน 2 ตำแหน่ง'
  if (form.value.stock === '' || !Number.isInteger(stock) || stock < 0) errors.stock = 'สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป'
  if (!form.value.categoryId) errors.categoryId = 'กรุณาเลือกหมวดหมู่'

  const keys = specRows.value.map((row) => row.key.trim()).filter(Boolean)
  if (new Set(keys).size !== keys.length) errors.specs = 'ชื่อสเปกต้องไม่ซ้ำกัน'
  return errors
}

function buildPayload() {
  const specs = {}
  specRows.value.forEach((row) => {
    const key = row.key.trim()
    if (!key) return
    specs[key] = String(row.raw) === row.value ? row.raw : row.value
  })
  return {
    sku: String(form.value.sku).trim(),
    name: String(form.value.name).trim(),
    description: form.value.description,
    price: Number(form.value.price),
    stock: Number(form.value.stock),
    categoryId: Number(form.value.categoryId),
    brandId: form.value.brandId === '' || form.value.brandId === null ? null : Number(form.value.brandId),
    specs,
    isActive: form.value.isActive,
  }
}

async function save() {
  saveMessage.value = ''
  saveError.value = ''
  fieldErrors.value = validate()
  if (Object.keys(fieldErrors.value).length) {
    saveError.value = 'กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง'
    return
  }

  saving.value = true
  try {
    await updateProduct(props.id, buildPayload())
    await loadProduct()
    saveMessage.value = 'บันทึกการแก้ไขสินค้าเรียบร้อยแล้ว'
  } catch (error) {
    const message = error.response?.data?.message || 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'
    if (error.response?.status === 409) fieldErrors.value = { sku: message }
    else saveError.value = message
  } finally {
    saving.value = false
  }
}

function resetForm() {
  fieldErrors.value = {}
  saveError.value = ''
  saveMessage.value = ''
  if (product.value) fillForm(product.value)
}

function addSpecRow() {
  specRows.value.push({ key: '', value: '', raw: '' })
}

function clearPending() {
  pendingPreviews.value.forEach((url) => URL.revokeObjectURL(url))
  pendingFiles.value = []
  pendingPreviews.value = []
  if (imageInput.value) imageInput.value.value = ''
}

function chooseImages(event) {
  imageError.value = ''
  imageMessage.value = ''
  const files = Array.from(event.target.files || [])
  clearPending()
  if (!files.length) return

  if (files.length > remainingSlots.value) {
    imageError.value = remainingSlots.value
      ? `เพิ่มได้อีกไม่เกิน ${remainingSlots.value} รูป (สูงสุด ${MAX_IMAGES} รูปต่อสินค้า)`
      : `สินค้านี้มีรูปครบ ${MAX_IMAGES} รูปแล้ว`
    event.target.value = ''
    return
  }
  const invalid = files.find((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE)
  if (invalid) {
    imageError.value = `ไฟล์ ${invalid.name} ไม่ถูกต้อง รองรับเฉพาะ JPG, PNG, WebP ขนาดไม่เกิน 5MB`
    event.target.value = ''
    return
  }
  pendingFiles.value = files
  pendingPreviews.value = files.map((file) => URL.createObjectURL(file))
}

async function uploadImages() {
  if (!pendingFiles.value.length) return
  imageBusy.value = true
  imageError.value = ''
  imageMessage.value = ''
  try {
    await uploadProductImages(props.id, pendingFiles.value)
    clearPending()
    await loadProduct()
    imageMessage.value = 'อัปโหลดรูปสินค้าเรียบร้อยแล้ว'
  } catch (error) {
    imageError.value = error.response?.data?.message || 'อัปโหลดรูปไม่สำเร็จ'
  } finally {
    imageBusy.value = false
  }
}

async function makePrimary(image) {
  imageBusy.value = true
  imageError.value = ''
  imageMessage.value = ''
  try {
    await setPrimaryProductImage(props.id, image.imageId)
    await loadProduct()
    imageMessage.value = 'ตั้งเป็นรูปหลักเรียบร้อยแล้ว'
  } catch (error) {
    imageError.value = error.response?.data?.message || 'ตั้งรูปหลักไม่สำเร็จ'
  } finally {
    imageBusy.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteProduct(props.id)
    await router.replace('/admin/goods')
  } catch (error) {
    deleteError.value = error.response?.data?.message || 'ลบสินค้าไม่สำเร็จ'
  } finally {
    deleting.value = false
  }
}

async function removeImage(imageId) {
  if (!confirm('ต้องการลบรูปภาพนี้ใช่หรือไม่?')) return
  
  imageBusy.value = true
  imageError.value = ''
  imageMessage.value = ''
  
  try {
    await deleteProductImage(props.id, imageId) 
    await loadProduct() 
    
    if (selectedImageId.value === imageId) {
      selectedImageId.value = null
    }
    
    imageMessage.value = 'ลบรูปภาพเรียบร้อยแล้ว'
  } catch (error) {
    imageError.value = error.response?.data?.message || 'ลบรูปภาพไม่สำเร็จ'
  } finally {
    imageBusy.value = false
  }
}

onMounted(() => {
  loadOptions()
  loadProduct()
})
onBeforeUnmount(clearPending)
</script>

<template>
  <main class="container py-4">
    <nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
      <span>หลังร้าน</span>
      <span aria-hidden="true">›</span>
      <RouterLink class="link-secondary text-decoration-none" to="/admin/goods">จัดการสินค้า</RouterLink>
      <span aria-hidden="true">›</span>
      <span class="text-danger" aria-current="page">แก้ไขสินค้า</span>
    </nav>

    <div v-if="loading && !product" class="d-flex justify-content-center py-5" role="status">
      <span class="spinner-border text-danger" aria-hidden="true"></span>
      <span class="visually-hidden">กำลังโหลดข้อมูลสินค้า</span>
    </div>
    <div v-else-if="notFound" class="border rounded bg-white p-5 text-center">
      <h1 class="h5">ไม่พบข้อมูล</h1>
      <p class="small text-secondary">ไม่พบสินค้านี้ หรือสินค้าถูกซ่อนหรือลบไปแล้ว</p>
      <RouterLink class="btn btn-outline-danger btn-sm" to="/admin/goods">กลับหน้าจัดการสินค้า</RouterLink>
    </div>
    <div v-else-if="loadError" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{{ loadError }}</span>
      <button class="btn btn-sm btn-outline-danger" type="button" @click="loadProduct">ลองอีกครั้ง</button>
    </div>

    <template v-else-if="product">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 class="h4 fw-bold mb-0">แก้ไขสินค้า</h1>
          <span class="small text-secondary">รหัสสินค้า #{{ product.productId }} · SKU {{ product.sku }}</span>
        </div>
        <div class="d-flex gap-2">
          <RouterLink class="btn btn-outline-secondary" to="/admin/goods"><i class="bi bi-arrow-left me-1" aria-hidden="true"></i>กลับหน้าจัดการสินค้า</RouterLink>
        </div>
      </div>

      <div class="row g-4 align-items-start">
        <section class="col-lg-5" aria-labelledby="images-title">
          <div class="border rounded bg-white p-3">
            <h2 id="images-title" class="h6 fw-bold mb-3">รูปภาพสินค้า</h2>
            <div class="ratio ratio-4x3 bg-light rounded overflow-hidden mb-2">
              <img v-if="activeImage" class="w-100 h-100 object-fit-contain" :src="activeImage.url" :alt="form.name" />
              <div v-else class="d-flex align-items-center justify-content-center text-secondary small">ยังไม่มีรูปสินค้า</div>
            </div>
            <div v-if="activeImage && !activeImage.isPrimary" class="mb-2">
              <button class="btn btn-sm btn-outline-danger" type="button" :disabled="imageBusy" @click="makePrimary(activeImage)">
                <i class="bi bi-star me-1" aria-hidden="true"></i>ตั้งเป็นรูปหลัก
              </button>
            </div>
            <span v-else-if="activeImage" class="badge text-bg-danger mb-2">รูปหลัก</span>

            <div v-if="images.length" class="d-flex flex-wrap gap-2 mb-3">
              <div v-for="image in images" :key="image.imageId" class="thumb position-relative border rounded overflow-hidden" :class="{ 'border-danger border-2': image.imageId === activeImage?.imageId }">
                <button type="button" class="btn p-0 w-100 h-100" :aria-label="`เลือกรูปที่ ${image.imageId}`" @click="selectedImageId = image.imageId">
                  <img :src="image.url" alt="" class="w-100 h-100 object-fit-cover" />
                </button>
                <i v-if="image.isPrimary" class="bi bi-star-fill text-danger position-absolute top-0 start-0 m-1 small" aria-hidden="true" style="pointer-events: none;"></i>
                <button v-if="!image.isPrimary" type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center m-1 shadow-sm" style="width: 20px; height: 20px; z-index: 10;" :disabled="imageBusy" @click.stop="removeImage(image.imageId)" aria-label="ลบรูปภาพ">
                  <i class="bi bi-x" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div class="border-top pt-3">
              <input ref="imageInput" class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple @change="chooseImages" />
              <button class="btn btn-outline-secondary btn-sm" type="button" :disabled="imageBusy || !remainingSlots" @click="imageInput?.click()">
                <i class="bi bi-upload me-1" aria-hidden="true"></i>เลือกรูปที่จะอัปโหลด
              </button>
              <span class="small text-secondary ms-2">เหลืออีก {{ remainingSlots }} จาก {{ MAX_IMAGES }} รูป · JPG, PNG, WebP ≤ 5MB</span>
              <div v-if="pendingPreviews.length" class="mt-2">
                <div class="d-flex flex-wrap gap-2 mb-2">
                  <img v-for="url in pendingPreviews" :key="url" :src="url" alt="ตัวอย่างรูปที่เลือก" class="thumb rounded border object-fit-cover" />
                </div>
                <button class="btn btn-danger btn-sm me-2" type="button" :disabled="imageBusy" @click="uploadImages">
                  <span v-if="imageBusy" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>อัปโหลด {{ pendingFiles.length }} รูป
                </button>
                <button class="btn btn-link btn-sm text-secondary" type="button" :disabled="imageBusy" @click="clearPending">ยกเลิก</button>
              </div>
              <div v-if="imageMessage" class="alert alert-success py-2 small mt-2 mb-0" role="status">{{ imageMessage }}</div>
              <div v-if="imageError" class="alert alert-danger py-2 small mt-2 mb-0" role="alert">{{ imageError }}</div>
            </div>
          </div>

          <div class="border rounded bg-white p-3 mt-3">
            <h2 class="h6 fw-bold mb-2">สรุปหน้าร้าน</h2>
            <div class="small text-secondary">{{ brandName || 'ไม่ระบุแบรนด์' }}<template v-if="categoryName"> · {{ categoryName }}</template></div>
            <div class="fw-semibold my-1">{{ form.name || '-' }}</div>
            <div class="d-flex justify-content-between align-items-center">
              <strong class="fs-5 text-danger">฿{{ formatPrice(form.price) }}</strong>
              <span class="badge" :class="stockNumber > 0 ? 'text-bg-success' : 'text-bg-danger'">{{ stockNumber > 0 ? `คงเหลือ ${formatPrice(stockNumber)} ชิ้น` : 'สินค้าหมด' }}</span>
            </div>
          </div>
        </section>

        <section class="col-lg-7" aria-labelledby="form-title">
          <form class="border rounded bg-white p-3 p-md-4" novalidate @submit.prevent="save">
            <h2 id="form-title" class="h6 fw-bold mb-3">ข้อมูลสินค้า</h2>

            <div v-if="saveMessage" class="alert alert-success py-2" role="status">{{ saveMessage }}</div>
            <div v-if="saveError" class="alert alert-danger py-2" role="alert">{{ saveError }}</div>

            <div class="row g-3">
              <div class="col-12">
                <label class="form-label small fw-semibold" for="p-name">ชื่อสินค้า <span class="text-danger">*</span></label>
                <input id="p-name" v-model="form.name" class="form-control" :class="{ 'is-invalid': fieldErrors.name }" type="text" maxlength="255" />
                <div class="invalid-feedback">{{ fieldErrors.name }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold" for="p-category">หมวดหมู่ <span class="text-danger">*</span></label>
                <select id="p-category" v-model="form.categoryId" class="form-select" :class="{ 'is-invalid': fieldErrors.categoryId }">
                  <option value="" disabled>เลือกหมวดหมู่</option>
                  <option v-for="category in categories" :key="category.categoryId" :value="category.categoryId">{{ category.name }}</option>
                </select>
                <div class="invalid-feedback">{{ fieldErrors.categoryId }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold" for="p-brand">แบรนด์</label>
                <select id="p-brand" v-model="form.brandId" class="form-select">
                  <option value="">ไม่ระบุแบรนด์</option>
                  <option v-for="brand in brands" :key="brand.brandId" :value="brand.brandId">{{ brand.name }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold" for="p-sku">SKU <span class="text-danger">*</span></label>
                <input id="p-sku" v-model="form.sku" class="form-control" :class="{ 'is-invalid': fieldErrors.sku }" type="text" maxlength="50" />
                <div class="invalid-feedback">{{ fieldErrors.sku }}</div>
              </div>
              <div class="col-md-3 col-6">
                <label class="form-label small fw-semibold" for="p-price">ราคา (บาท) <span class="text-danger">*</span></label>
                <input id="p-price" v-model="form.price" class="form-control" :class="{ 'is-invalid': fieldErrors.price }" type="number" min="0" step="0.01" inputmode="decimal" />
                <div class="invalid-feedback">{{ fieldErrors.price }}</div>
              </div>
              <div class="col-md-3 col-6">
                <label class="form-label small fw-semibold" for="p-stock">สต็อก (ชิ้น) <span class="text-danger">*</span></label>
                <input id="p-stock" v-model="form.stock" class="form-control" :class="{ 'is-invalid': fieldErrors.stock }" type="number" min="0" step="1" inputmode="numeric" />
                <div class="invalid-feedback">{{ fieldErrors.stock }}</div>
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold" for="p-desc">รายละเอียดสินค้า</label>
                <textarea id="p-desc" v-model="form.description" class="form-control" rows="3"></textarea>
              </div>

              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="form-label small fw-semibold mb-0">ข้อมูลจำเพาะ (สเปก)</span>
                  <button class="btn btn-outline-secondary btn-sm" type="button" @click="addSpecRow"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>เพิ่มสเปก</button>
                </div>
                <p v-if="!specRows.length" class="small text-secondary mb-0">ยังไม่มีสเปก</p>
                <div v-for="(row, index) in specRows" :key="index" class="row g-2 mb-2">
                  <div class="col-5"><input v-model="row.key" class="form-control form-control-sm" type="text" placeholder="ชื่อ เช่น socket" :aria-label="`ชื่อสเปกแถว ${index + 1}`" /></div>
                  <div class="col"><input v-model="row.value" class="form-control form-control-sm" type="text" placeholder="ค่า เช่น LGA1700" :aria-label="`ค่าสเปกแถว ${index + 1}`" /></div>
                  <div class="col-auto"><button class="btn btn-outline-danger btn-sm" type="button" :aria-label="`ลบสเปกแถว ${index + 1}`" @click="specRows.splice(index, 1)"><i class="bi bi-trash" aria-hidden="true"></i></button></div>
                </div>
                <div v-if="fieldErrors.specs" class="small text-danger">{{ fieldErrors.specs }}</div>
              </div>

              <div class="col-12">
                <div class="form-check form-switch">
                  <input id="p-active" v-model="form.isActive" class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label small" for="p-active">เปิดขายหน้าร้าน (ปิดเพื่อซ่อนสินค้าชั่วคราว)</label>
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap justify-content-end gap-2 border-top pt-3 mt-4">
              <button class="btn btn-outline-secondary" type="button" :disabled="saving" @click="resetForm">ยกเลิกการแก้ไข</button>
              <button class="btn btn-danger" type="submit" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>{{ saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
              </button>
            </div>
          </form>

          <div class="border border-danger-subtle rounded bg-white p-3 mt-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <div class="fw-semibold text-danger">ลบสินค้า</div>
              <div class="small text-secondary">สินค้าจะถูกนำออกจากหน้าร้าน (soft delete)</div>
            </div>
            <button class="btn btn-outline-danger" type="button" @click="showDelete = true; deleteError = ''"><i class="bi bi-trash me-1" aria-hidden="true"></i>ลบสินค้านี้</button>
          </div>
        </section>
      </div>
    </template>

    <template v-if="showDelete">
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="delete-title" @keydown.esc="!deleting && (showDelete = false)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="delete-title" class="modal-title h5">ยืนยันการลบสินค้า</h2>
              <button type="button" class="btn-close" aria-label="ปิด" :disabled="deleting" @click="showDelete = false"></button>
            </div>
            <div class="modal-body">
              <p class="mb-1">ต้องการลบ <strong>{{ product?.name }}</strong> ใช่หรือไม่?</p>
              <p class="small text-secondary mb-0">สินค้าจะไม่แสดงบนหน้าร้านอีก</p>
              <div v-if="deleteError" class="alert alert-danger py-2 small mt-3 mb-0" role="alert">{{ deleteError }}</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" :disabled="deleting" @click="showDelete = false">ยกเลิก</button>
              <button type="button" class="btn btn-danger" :disabled="deleting" @click="confirmDelete">
                <span v-if="deleting" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </template>
  </main>
</template>

<style scoped>
.thumb {
  width: 64px;
  height: 64px;
}
</style>
