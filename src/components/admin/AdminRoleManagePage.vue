<script setup>
import { computed, onMounted, ref } from 'vue'
import { getAdminUsers, setUserRoleByEmail } from '../../api/adminUsers'
import { resolveApiAsset } from '../../api/catalog'
import { useAuthStore } from '../../stores/authStore'
import { formatDate } from '../../utils/formatters'
import { userStatusLabels } from '../../utils/statusLabels'

const auth = useAuthStore()
const LIMIT = 10

const admins = ref([])
const pagination = ref({ page: 1, limit: LIMIT, total: 0, totalPages: 1 })
const searchTerm = ref('')
const loading = ref(true)
const errorMessage = ref('')
let latestRequest = 0

const showModal = ref(false)
const step = ref('form')
const email = ref('')
const emailError = ref('')
const submitting = ref(false)
const submitError = ref('')
const successMessage = ref('')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const normalizedEmail = computed(() => email.value.trim().toLowerCase())

function fullName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || '-'
}

async function loadAdmins(page = 1) {
  const requestId = ++latestRequest
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await getAdminUsers({
      role: 'admin',
      page,
      limit: LIMIT,
      ...(searchTerm.value.trim() ? { search: searchTerm.value.trim() } : {}),
    })
    if (requestId !== latestRequest) return
    admins.value = result.items
    pagination.value = result.pagination
  } catch (error) {
    if (requestId !== latestRequest) return
    admins.value = []
    errorMessage.value = error.response?.data?.message || 'โหลดรายชื่อผู้ดูแลระบบไม่สำเร็จ'
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

function openModal() {
  email.value = ''
  emailError.value = ''
  submitError.value = ''
  step.value = 'form'
  showModal.value = true
}

function closeModal() {
  if (!submitting.value) showModal.value = false
}

function goConfirm() {
  emailError.value = ''
  if (!normalizedEmail.value) emailError.value = 'กรุณากรอกอีเมลของสมาชิก'
  else if (!emailPattern.test(normalizedEmail.value)) emailError.value = 'รูปแบบอีเมลไม่ถูกต้อง'
  else if (normalizedEmail.value === auth.user?.email?.toLowerCase()) emailError.value = 'คุณเป็นผู้ดูแลระบบอยู่แล้ว'
  else step.value = 'confirm'
}

function explain(error) {
  const status = error.response?.status
  const message = error.response?.data?.message
  if (status === 404) return 'ไม่พบสมาชิกอีเมลนี้ ให้ผู้ใช้สมัครสมาชิกก่อน'
  if (status === 403) return 'คุณไม่มีสิทธิ์ดำเนินการนี้'
  if (status === 400) return message || 'ไม่สามารถเพิ่มได้ อาจเป็น admin อยู่แล้ว หรือบัญชีไม่อยู่ในสถานะใช้งานปกติ'
  return message || 'เพิ่มผู้ดูแลระบบไม่สำเร็จ กรุณาลองอีกครั้ง'
}

async function confirmAdd() {
  submitting.value = true
  submitError.value = ''
  try {
    await setUserRoleByEmail(normalizedEmail.value, 'admin')
    showModal.value = false
    successMessage.value = `เพิ่ม ${normalizedEmail.value} เป็นผู้ดูแลระบบเรียบร้อยแล้ว`
    searchTerm.value = ''
    await loadAdmins(1)
  } catch (error) {
    submitError.value = explain(error)
    step.value = 'form'
  } finally {
    submitting.value = false
  }
}

onMounted(() => loadAdmins())
</script>

<template>
  <main class="container py-4">
    <nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
      <span>หลังร้าน</span>
      <span aria-hidden="true">›</span>
      <span class="text-danger" aria-current="page">จัดการสิทธิ์ผู้ดูแลระบบ</span>
    </nav>

    <header class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
      <div>
        <h1 class="h3 fw-bold mb-1">ระบบจัดการสิทธิ์และผู้ดูแลระบบ</h1>
        <p class="small text-secondary mb-0">ดูรายชื่อผู้ดูแลระบบ และเพิ่มสมาชิกที่สมัครไว้แล้วให้เป็นผู้ดูแลระบบ</p>
      </div>
      <button class="btn btn-danger" type="button" @click="openModal"><i class="bi bi-person-plus me-1" aria-hidden="true"></i>เพิ่มผู้ดูแลระบบใหม่</button>
    </header>

    <div v-if="successMessage" class="alert alert-success d-flex justify-content-between align-items-center" role="status">
      <span>{{ successMessage }}</span>
      <button type="button" class="btn-close" aria-label="ปิด" @click="successMessage = ''"></button>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-12 col-md-4">
        <div class="border rounded bg-white p-3">
          <div class="small text-secondary">ผู้ดูแลระบบทั้งหมด</div>
          <div class="fs-3 fw-bold">{{ pagination.total }} <span class="fs-6 fw-normal text-secondary">บัญชี</span></div>
        </div>
      </div>
    </div>

    <form class="border rounded bg-white p-3 mb-3" role="search" @submit.prevent="loadAdmins(1)">
      <div class="input-group">
        <span class="input-group-text bg-white"><i class="bi bi-search" aria-hidden="true"></i></span>
        <input v-model="searchTerm" class="form-control" type="search" placeholder="ค้นหาด้วยอีเมลหรือชื่อ" aria-label="ค้นหาผู้ดูแลระบบ" />
        <button class="btn btn-outline-secondary" type="submit">ค้นหา</button>
      </div>
    </form>

    <div v-if="errorMessage" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{{ errorMessage }}</span>
      <button class="btn btn-sm btn-outline-danger" type="button" @click="loadAdmins(pagination.page)">ลองอีกครั้ง</button>
    </div>
    <div v-else-if="loading" class="d-flex justify-content-center py-5" role="status">
      <span class="spinner-border text-danger" aria-hidden="true"></span>
      <span class="visually-hidden">กำลังโหลดรายชื่อ</span>
    </div>
    <div v-else-if="!admins.length" class="border rounded bg-white p-5 text-center text-secondary">ไม่พบข้อมูล</div>
    <div v-else class="border rounded bg-white">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">ผู้ดูแลระบบ</th>
              <th scope="col">อีเมล</th>
              <th scope="col">สถานะ</th>
              <th scope="col">วันที่สมัคร</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in admins" :key="user.userId ?? user.email">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <img v-if="user.avatarUrl" :src="resolveApiAsset(user.avatarUrl)" :alt="`รูปโปรไฟล์ ${fullName(user)}`" class="avatar rounded-circle object-fit-cover" />
                  <span v-else class="avatar rounded-circle bg-secondary text-white fw-semibold d-inline-flex align-items-center justify-content-center">{{ user.firstName?.charAt(0) || 'A' }}</span>
                  <div>
                    <span class="fw-semibold">{{ fullName(user) }}</span>
                    <span v-if="user.email === auth.user?.email" class="badge text-bg-light border ms-1">คุณ</span>
                    <div class="small text-secondary">{{ user.role === 'admin' || !user.role ? 'ผู้ดูแลระบบ' : user.role }}</div>
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td><span class="badge" :class="`text-bg-${(userStatusLabels[user.status] || { variant: 'secondary' }).variant}`">{{ (userStatusLabels[user.status] || { label: user.status || '-' }).label }}</span></td>
              <td class="small">{{ formatDate(user.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="pagination.totalPages > 1" class="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 border-top">
        <span class="small text-secondary">หน้า {{ pagination.page }} จาก {{ pagination.totalPages }} · ทั้งหมด {{ pagination.total }} รายการ</span>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" type="button" :disabled="pagination.page <= 1" @click="loadAdmins(pagination.page - 1)">ก่อนหน้า</button>
          <button class="btn btn-outline-secondary" type="button" :disabled="pagination.page >= pagination.totalPages" @click="loadAdmins(pagination.page + 1)">ถัดไป</button>
        </div>
      </div>
    </div>

    <template v-if="showModal">
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="add-admin-title" @keydown.esc="closeModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="add-admin-title" class="modal-title h5">{{ step === 'form' ? 'เพิ่มผู้ดูแลระบบใหม่' : 'ยืนยันการเพิ่มผู้ดูแลระบบ' }}</h2>
              <button type="button" class="btn-close" aria-label="ปิด" :disabled="submitting" @click="closeModal"></button>
            </div>

            <form v-if="step === 'form'" novalidate @submit.prevent="goConfirm">
              <div class="modal-body">
                <div v-if="submitError" class="alert alert-danger py-2 small" role="alert">{{ submitError }}</div>
                <label class="form-label small fw-semibold" for="admin-email">อีเมลของสมาชิก <span class="text-danger">*</span></label>
                <input id="admin-email" v-model="email" class="form-control" :class="{ 'is-invalid': emailError }" type="email" autocomplete="off" placeholder="example@gmail.com" autofocus />
                <div class="invalid-feedback">{{ emailError }}</div>
                <p class="form-text mb-0">ผู้ที่จะเพิ่มต้อง<strong>สมัครสมาชิกไว้แล้ว</strong>และบัญชีอยู่ในสถานะใช้งานปกติ</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="closeModal">ยกเลิก</button>
                <button type="submit" class="btn btn-danger">ถัดไป</button>
              </div>
            </form>

            <template v-else>
              <div class="modal-body">
                <p class="mb-1">ต้องการให้สิทธิ์ผู้ดูแลระบบแก่ <strong>{{ normalizedEmail }}</strong> ใช่หรือไม่?</p>
                <p class="small text-secondary mb-0">สิทธิ์จะมีผลทันที ผู้นี้จะเข้าถึงหน้าจัดการหลังร้านได้</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" :disabled="submitting" @click="step = 'form'">ย้อนกลับ</button>
                <button type="button" class="btn btn-danger" :disabled="submitting" @click="confirmAdd">
                  <span v-if="submitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>ยืนยันเพิ่มเป็น Admin
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </template>
  </main>
</template>

<style scoped>
.avatar {
  width: 36px;
  height: 36px;
}
</style>
