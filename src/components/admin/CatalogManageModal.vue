<script setup>
import { computed, onMounted, ref } from 'vue'
import { createBrand, createCategory, deleteBrand, deleteCategory, getBrandById, getCategoryById, updateBrand, updateCategory } from '../../api/adminCatalog'
import { getBrands, getCategories, resolveApiAsset } from '../../api/catalog'

const props = defineProps({ kind: { type: String, required: true } })
const emit = defineEmits(['close', 'changed'])

const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_LOGO_SIZE = 5 * 1024 * 1024
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const isBrand = computed(() => props.kind === 'brand')
const noun = computed(() => (isBrand.value ? 'แบรนด์' : 'หมวดหมู่'))
const idKey = computed(() => (isBrand.value ? 'brandId' : 'categoryId'))

const items = ref([])
const loading = ref(true)
const loadError = ref('')
const message = ref('')

const createForm = ref({ name: '', slug: '' })
const createLogo = ref(null)
const createLogoInput = ref(null)
const createError = ref('')
const creating = ref(false)

const editingId = ref(null)
const editLoading = ref(false)
const editForm = ref({ name: '', slug: '', logoUrl: '' })
const editLogo = ref(null)
const editError = ref('')
const saving = ref(false)

const deleteTarget = ref(null)
const deleting = ref(false)
const deleteError = ref('')

function errorText(error, fallback) {
  const status = error.response?.status
  const text = error.response?.data?.message
  if (status === 409) return text || `ชื่อ${isBrand.value ? '' : 'หรือ slug'}นี้มีอยู่แล้ว`
  return text || fallback
}

async function loadItems() {
  loading.value = true
  loadError.value = ''
  try {
    items.value = isBrand.value ? await getBrands() : await getCategories()
  } catch (error) {
    loadError.value = errorText(error, `โหลดรายการ${noun.value}ไม่สำเร็จ`)
  } finally {
    loading.value = false
  }
}

function checkFile(file) {
  if (!LOGO_TYPES.includes(file.type)) return 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP'
  if (file.size > MAX_LOGO_SIZE) return 'ไฟล์โลโก้ต้องมีขนาดไม่เกิน 5MB'
  return ''
}

function validate(form) {
  if (!form.name.trim()) return `กรุณากรอกชื่อ${noun.value}`
  if (!isBrand.value) {
    if (!form.slug.trim()) return 'กรุณากรอก slug'
    if (!slugPattern.test(form.slug.trim())) return 'slug ใช้ได้เฉพาะตัวพิมพ์เล็ก a-z ตัวเลข และเครื่องหมาย - เช่น graphics-card'
  }
  return ''
}

function buildBrandFormData(form, logo) {
  const formData = new FormData()
  formData.append('name', form.name.trim())
  if (logo) formData.append('logo', logo)
  return formData
}

function pickCreateLogo(event) {
  const file = event.target.files?.[0] || null
  createError.value = ''
  if (file) {
    const problem = checkFile(file)
    if (problem) {
      createError.value = problem
      event.target.value = ''
      return
    }
  }
  createLogo.value = file
}

function pickEditLogo(event) {
  const file = event.target.files?.[0] || null
  editError.value = ''
  if (file) {
    const problem = checkFile(file)
    if (problem) {
      editError.value = problem
      event.target.value = ''
      return
    }
  }
  editLogo.value = file
}

async function submitCreate() {
  createError.value = validate(createForm.value)
  if (createError.value) return
  creating.value = true
  message.value = ''
  try {
    if (isBrand.value) await createBrand(buildBrandFormData(createForm.value, createLogo.value))
    else await createCategory({ name: createForm.value.name.trim(), slug: createForm.value.slug.trim() })
    message.value = `เพิ่ม${noun.value} "${createForm.value.name.trim()}" เรียบร้อยแล้ว`
    createForm.value = { name: '', slug: '' }
    createLogo.value = null
    if (createLogoInput.value) createLogoInput.value.value = ''
    await loadItems()
    emit('changed')
  } catch (error) {
    createError.value = errorText(error, `เพิ่ม${noun.value}ไม่สำเร็จ`)
  } finally {
    creating.value = false
  }
}

async function startEdit(item) {
  editingId.value = item[idKey.value]
  editLoading.value = true
  editError.value = ''
  editLogo.value = null
  editForm.value = { name: item.name || '', slug: item.slug || '', logoUrl: item.logoUrl || '' }
  try {
    const fresh = isBrand.value ? await getBrandById(editingId.value) : await getCategoryById(editingId.value)
    editForm.value = { name: fresh.name || '', slug: fresh.slug || '', logoUrl: fresh.logoUrl || '' }
  } catch (error) {
    editError.value = errorText(error, `โหลดข้อมูล${noun.value}ไม่สำเร็จ`)
  } finally {
    editLoading.value = false
  }
}

function cancelEdit() {
  editingId.value = null
  editError.value = ''
  editLogo.value = null
}

async function submitEdit() {
  editError.value = validate(editForm.value)
  if (editError.value) return
  saving.value = true
  message.value = ''
  try {
    if (isBrand.value) await updateBrand(editingId.value, buildBrandFormData(editForm.value, editLogo.value))
    else await updateCategory(editingId.value, { name: editForm.value.name.trim(), slug: editForm.value.slug.trim() })
    message.value = `แก้ไข${noun.value}เรียบร้อยแล้ว`
    cancelEdit()
    await loadItems()
    emit('changed')
  } catch (error) {
    editError.value = errorText(error, `แก้ไข${noun.value}ไม่สำเร็จ`)
  } finally {
    saving.value = false
  }
}

function askDelete(item) {
  deleteTarget.value = item
  deleteError.value = ''
}

async function confirmDelete() {
  deleting.value = true
  deleteError.value = ''
  try {
    const id = deleteTarget.value[idKey.value]
    if (isBrand.value) await deleteBrand(id)
    else await deleteCategory(id)
    message.value = `ลบ${noun.value} "${deleteTarget.value.name}" เรียบร้อยแล้ว`
    deleteTarget.value = null
    if (editingId.value === id) cancelEdit()
    await loadItems()
    emit('changed')
  } catch (error) {
    deleteError.value = errorText(error, `ลบ${noun.value}ไม่สำเร็จ`)
  } finally {
    deleting.value = false
  }
}

function close() {
  if (!creating.value && !saving.value && !deleting.value) emit('close')
}

onMounted(loadItems)
</script>

<template>
  <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="catalog-title" @keydown.esc="deleteTarget ? (deleteTarget = null) : close()">
    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="catalog-title" class="modal-title h5">จัดการ{{ noun }}</h2>
          <button type="button" class="btn-close" aria-label="ปิด" @click="close"></button>
        </div>

        <div class="modal-body">
          <div v-if="message" class="alert alert-success py-2 small d-flex justify-content-between align-items-center" role="status">
            <span>{{ message }}</span>
            <button type="button" class="btn-close btn-sm" aria-label="ปิด" @click="message = ''"></button>
          </div>

          <form class="border rounded p-3 mb-3 bg-light" novalidate @submit.prevent="submitCreate">
            <div class="fw-semibold small mb-2">เพิ่ม{{ noun }}ใหม่</div>
            <div class="row g-2 align-items-end">
              <div class="col-12" :class="isBrand ? 'col-md-5' : 'col-md-4'">
                <label class="form-label small mb-1" for="create-name">ชื่อ{{ noun }} <span class="text-danger">*</span></label>
                <input id="create-name" v-model="createForm.name" class="form-control form-control-sm" type="text" />
              </div>
              <div v-if="!isBrand" class="col-12 col-md-4">
                <label class="form-label small mb-1" for="create-slug">slug <span class="text-danger">*</span></label>
                <input id="create-slug" v-model="createForm.slug" class="form-control form-control-sm" type="text" placeholder="เช่น graphics-card" />
              </div>
              <div v-else class="col-12 col-md-4">
                <label class="form-label small mb-1" for="create-logo">โลโก้ (ไม่บังคับ)</label>
                <input id="create-logo" ref="createLogoInput" class="form-control form-control-sm" type="file" accept="image/png,image/jpeg,image/webp" @change="pickCreateLogo" />
              </div>
              <div class="col-12 col-md-auto">
                <button class="btn btn-success btn-sm w-100" type="submit" :disabled="creating">
                  <span v-if="creating" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>เพิ่ม{{ noun }}
                </button>
              </div>
            </div>
            <div v-if="createError" class="small text-danger mt-2" role="alert">{{ createError }}</div>
          </form>

          <div v-if="loadError" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <span>{{ loadError }}</span>
            <button class="btn btn-sm btn-outline-danger" type="button" @click="loadItems">ลองอีกครั้ง</button>
          </div>
          <div v-else-if="loading" class="d-flex justify-content-center py-4" role="status">
            <span class="spinner-border text-danger" aria-hidden="true"></span>
            <span class="visually-hidden">กำลังโหลด</span>
          </div>
          <p v-else-if="!items.length" class="text-center text-secondary py-3 mb-0">ไม่พบข้อมูล</p>

          <div v-else class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th v-if="isBrand" scope="col">โลโก้</th>
                  <th scope="col">ชื่อ{{ noun }}</th>
                  <th v-if="!isBrand" scope="col">slug</th>
                  <th scope="col" class="text-end">จำนวนสินค้า</th>
                  <th scope="col" class="text-end">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="item in items" :key="item[idKey]">
                  <tr v-if="editingId !== item[idKey]">
                    <td v-if="isBrand" style="width: 64px">
                      <img v-if="item.logoUrl" :src="resolveApiAsset(item.logoUrl)" :alt="`โลโก้ ${item.name}`" class="logo rounded border object-fit-contain bg-white" />
                      <span v-else class="logo rounded border bg-light d-inline-block"></span>
                    </td>
                    <td class="fw-semibold">{{ item.name }}</td>
                    <td v-if="!isBrand" class="text-secondary">{{ item.slug }}</td>
                    <td class="text-end">{{ item.productCount ?? 0 }}</td>
                    <td class="text-end text-nowrap">
                      <button class="btn btn-sm btn-outline-secondary me-1" type="button" @click="startEdit(item)"><i class="bi bi-pencil" aria-hidden="true"></i> แก้ไข</button>
                      <button class="btn btn-sm btn-outline-danger" type="button" @click="askDelete(item)"><i class="bi bi-trash" aria-hidden="true"></i> ลบ</button>
                    </td>
                  </tr>
                  <tr v-else class="table-warning">
                    <td :colspan="isBrand ? 4 : 4">
                      <div v-if="editLoading" class="text-center py-2" role="status"><span class="spinner-border spinner-border-sm text-danger" aria-hidden="true"></span></div>
                      <form v-else class="row g-2 align-items-end" novalidate @submit.prevent="submitEdit">
                        <div class="col-12 col-md">
                          <label class="form-label small mb-1" :for="`edit-name-${item[idKey]}`">ชื่อ{{ noun }}</label>
                          <input :id="`edit-name-${item[idKey]}`" v-model="editForm.name" class="form-control form-control-sm" type="text" />
                        </div>
                        <div v-if="!isBrand" class="col-12 col-md">
                          <label class="form-label small mb-1" :for="`edit-slug-${item[idKey]}`">slug</label>
                          <input :id="`edit-slug-${item[idKey]}`" v-model="editForm.slug" class="form-control form-control-sm" type="text" />
                        </div>
                        <div v-else class="col-12 col-md">
                          <label class="form-label small mb-1" :for="`edit-logo-${item[idKey]}`">เปลี่ยนโลโก้ (ไม่บังคับ)</label>
                          <input :id="`edit-logo-${item[idKey]}`" class="form-control form-control-sm" type="file" accept="image/png,image/jpeg,image/webp" @change="pickEditLogo" />
                        </div>
                        <div class="col-12 col-md-auto d-flex gap-1">
                          <button class="btn btn-sm btn-danger" type="submit" :disabled="saving">
                            <span v-if="saving" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>บันทึก
                          </button>
                          <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="saving" @click="cancelEdit">ยกเลิก</button>
                        </div>
                      </form>
                      <div v-if="editError" class="small text-danger mt-2" role="alert">{{ editError }}</div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" @click="close">ปิด</button>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop show"></div>

  <!-- popup ยืนยันการลบ -->
  <template v-if="deleteTarget">
    <div class="modal d-block confirm-modal" tabindex="-1" role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="confirm-delete-title" class="modal-title h6">ยืนยันการลบ{{ noun }}</h3>
          </div>
          <div class="modal-body">
            <p class="mb-1">ต้องการลบ <strong>{{ deleteTarget.name }}</strong> ใช่หรือไม่?</p>
            <p v-if="deleteTarget.productCount" class="small text-warning-emphasis mb-0">มีสินค้าใช้{{ noun }}นี้อยู่ {{ deleteTarget.productCount }} รายการ ระบบอาจไม่อนุญาตให้ลบ</p>
            <div v-if="deleteError" class="alert alert-danger py-2 small mt-2 mb-0" role="alert">{{ deleteError }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="deleting" @click="deleteTarget = null">ยกเลิก</button>
            <button type="button" class="btn btn-danger btn-sm" :disabled="deleting" @click="confirmDelete">
              <span v-if="deleting" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>ยืนยันลบ
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop show confirm-backdrop"></div>
  </template>
</template>

<style scoped>
.logo {
  width: 40px;
  height: 40px;
}

.confirm-modal {
  z-index: 1065;
}

.confirm-backdrop {
  z-index: 1060;
}
</style>
