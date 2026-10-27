<script setup>
import { computed, onMounted, ref } from 'vue'
import { advanceShipment, getAdminOrderById, getAdminOrders, getNextShipmentStatus, getOrdersOfCustomer } from '../../api/adminOrders'
import { formatDate, formatPrice } from '../../utils/formatters'
import { getStatusDisplay, shipmentStatusLabels } from '../../utils/statusLabels'

const LIMIT = 10

const orders = ref([])
const pagination = ref({ page: 1, limit: LIMIT, total: 0, totalPages: 1 })
const dateFrom = ref('')
const dateTo = ref('')
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
let latestRequest = 0

// ---- popup เปลี่ยนสถานะพัสดุ ----
const shipModal = ref(false)
const shipOrder = ref(null)
const shipLoading = ref(false)
const shipSubmitting = ref(false)
const shipError = ref('')
const courier = ref('')
const trackingNo = ref('')
const note = ref('')
const nextStatus = computed(() => (shipOrder.value ? getNextShipmentStatus(shipOrder.value.status, shipOrder.value.shipmentStatus) : null))
const needsTracking = computed(() => nextStatus.value === 'shipped')

// ---- popup ออเดอร์ของลูกค้า ----
const customerModal = ref(false)
const customer = ref(null)
const customerOrders = ref([])
const customerLoading = ref(false)
const customerError = ref('')
const customerTruncated = ref(false)
const expanded = ref({})

const dateError = computed(() => (dateFrom.value && dateTo.value && dateFrom.value > dateTo.value ? 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' : ''))

function customerLabel(order) {
  return order.customer.name || order.customer.email || 'ไม่ทราบชื่อ'
}

function canAdvance(order) {
  return Boolean(getNextShipmentStatus(order.status, order.shipmentStatus)) || order.status === 'paid'
}

async function loadOrders(page = 1) {
  if (dateError.value) return
  const requestId = ++latestRequest
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await getAdminOrders({
      page,
      limit: LIMIT,
      ...(dateFrom.value ? { dateFrom: dateFrom.value } : {}),
      ...(dateTo.value ? { dateTo: dateTo.value } : {}),
    })
    if (requestId !== latestRequest) return
    orders.value = result.items
    pagination.value = result.pagination
  } catch (error) {
    if (requestId !== latestRequest) return
    orders.value = []
    errorMessage.value = error.response?.data?.message || 'โหลดรายการคำสั่งซื้อไม่สำเร็จ'
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

function clearDates() {
  dateFrom.value = ''
  dateTo.value = ''
  loadOrders(1)
}

// เปิด popup แล้วโหลดสถานะล่าสุดจากเซิร์ฟเวอร์ก่อนเสมอ เพื่อไม่เลื่อนจากข้อมูลที่เก่า
async function openShipModal(order) {
  shipModal.value = true
  shipOrder.value = order
  shipLoading.value = true
  shipError.value = ''
  courier.value = ''
  trackingNo.value = ''
  note.value = ''
  try {
    shipOrder.value = await getAdminOrderById(order.orderId)
  } catch (error) {
    shipError.value = error.response?.data?.message || 'โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ'
  } finally {
    shipLoading.value = false
  }
}

function closeShipModal() {
  if (!shipSubmitting.value) shipModal.value = false
}

async function confirmShip() {
  shipError.value = ''
  if (needsTracking.value && (!courier.value.trim() || !trackingNo.value.trim())) {
    shipError.value = 'กรุณากรอกชื่อขนส่งและเลขพัสดุ'
    return
  }
  shipSubmitting.value = true
  try {
    await advanceShipment(shipOrder.value.orderId, {
      status: nextStatus.value,
      ...(needsTracking.value ? { courier: courier.value.trim(), trackingNo: trackingNo.value.trim() } : {}),
      ...(note.value.trim() ? { note: note.value.trim() } : {}),
    })
    successMessage.value = `เปลี่ยนสถานะคำสั่งซื้อ #${shipOrder.value.orderNo} เป็น "${shipmentStatusLabels[nextStatus.value].label}" เรียบร้อยแล้ว`
    shipModal.value = false
    await loadOrders(pagination.value.page)
  } catch (error) {
    shipError.value = error.response?.data?.message || 'เปลี่ยนสถานะไม่สำเร็จ'
    // 409/400: อาจมีแอดมินอื่นเลื่อนไปก่อน โหลดข้อมูลใหม่
    if ([400, 409].includes(error.response?.status)) {
      try { shipOrder.value = await getAdminOrderById(shipOrder.value.orderId) } catch { /* คงข้อความผิดพลาดเดิม */ }
      await loadOrders(pagination.value.page)
    }
  } finally {
    shipSubmitting.value = false
  }
}

async function openCustomer(order) {
  customer.value = order.customer
  customerModal.value = true
  customerOrders.value = []
  customerError.value = ''
  customerTruncated.value = false
  expanded.value = {}
  customerLoading.value = true
  try {
    const result = await getOrdersOfCustomer(order.customer)
    customerOrders.value = result.orders
    customerTruncated.value = result.truncated
  } catch (error) {
    customerError.value = error.response?.data?.message || 'โหลดออเดอร์ของลูกค้าไม่สำเร็จ'
  } finally {
    customerLoading.value = false
  }
}

async function toggleOrder(order) {
  if (order.status === 'cancelled' && order.cancelReason === 'payment_timeout') {
    return
  }
  const current = expanded.value[order.orderId]
  if (current) {
    expanded.value = { ...expanded.value, [order.orderId]: null }
    return
  }
  expanded.value = { ...expanded.value, [order.orderId]: { loading: true, error: '', order: null } }
  try {
    const detail = await getAdminOrderById(order.orderId)
    expanded.value = { ...expanded.value, [order.orderId]: { loading: false, error: '', order: detail } }
  } catch (error) {
    expanded.value = { ...expanded.value, [order.orderId]: { loading: false, error: error.response?.data?.message || 'โหลดรายละเอียดไม่สำเร็จ', order: null } }
  }
}

onMounted(() => loadOrders())
</script>

<template>
  <main class="container py-4">
    <nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
      <span>หลังร้าน</span>
      <span aria-hidden="true">›</span>
      <span class="text-danger" aria-current="page">จัดการคำสั่งซื้อ</span>
    </nav>

    <header class="mb-3">
      <h1 class="h3 fw-bold mb-1">ระบบจัดการคำสั่งซื้อและการจัดส่ง</h1>
      <p class="small text-secondary mb-0">ดูคำสั่งซื้อทั้งหมด ตรวจสอบผู้สั่ง และเลื่อนสถานะพัสดุทีละขั้น</p>
    </header>

    <div v-if="successMessage" class="alert alert-success d-flex justify-content-between align-items-center" role="status">
      <span>{{ successMessage }}</span>
      <button type="button" class="btn-close" aria-label="ปิด" @click="successMessage = ''"></button>
    </div>

    <form class="border rounded bg-white p-3 mb-3" @submit.prevent="loadOrders(1)">
      <div class="row g-2 align-items-end">
        <div class="col-6 col-md-3">
          <label class="form-label small fw-semibold mb-1" for="date-from">ตั้งแต่วันที่</label>
          <input id="date-from" v-model="dateFrom" class="form-control" type="date" />
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label small fw-semibold mb-1" for="date-to">ถึงวันที่</label>
          <input id="date-to" v-model="dateTo" class="form-control" type="date" />
        </div>
        <div class="col-12 col-md-auto d-flex gap-2">
          <button class="btn btn-danger" type="submit" :disabled="Boolean(dateError)">ค้นหา</button>
          <button v-if="dateFrom || dateTo" class="btn btn-outline-secondary" type="button" @click="clearDates">ล้างวันที่</button>
        </div>
        <div class="col-12 col-md text-md-end small text-secondary">พบ {{ formatPrice(pagination.total) }} คำสั่งซื้อ</div>
      </div>
      <div v-if="dateError" class="small text-danger mt-2">{{ dateError }}</div>
    </form>

    <div v-if="errorMessage" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{{ errorMessage }}</span>
      <button class="btn btn-sm btn-outline-danger" type="button" @click="loadOrders(pagination.page)">ลองอีกครั้ง</button>
    </div>
    <div v-else-if="loading" class="d-flex justify-content-center py-5" role="status">
      <span class="spinner-border text-danger" aria-hidden="true"></span>
      <span class="visually-hidden">กำลังโหลดคำสั่งซื้อ</span>
    </div>
    <div v-else-if="!orders.length" class="border rounded bg-white p-5 text-center text-secondary">ไม่พบข้อมูล</div>
    <div v-else class="border rounded bg-white">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">คำสั่งซื้อ</th>
              <th scope="col">ผู้สั่ง</th>
              <th scope="col" class="text-end">ยอดรวม</th>
              <th scope="col">สถานะบิล</th>
              <th scope="col">สถานะพัสดุ</th>
              <th scope="col" class="text-end">เปลี่ยนสถานะ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.orderId">
              <td>
                <div class="fw-semibold text-danger">#{{ order.orderNo }}</div>
                <div class="small text-secondary">{{ formatDate(order.placedAt) }}</div>
              </td>
              <td>
                <button class="btn btn-link p-0 text-start text-decoration-none fw-semibold" type="button" :title="'ดูออเดอร์ทั้งหมดของ ' + customerLabel(order)" @click="openCustomer(order)">{{ customerLabel(order) }}</button>
                <div v-if="order.customer.name && order.customer.email" class="small text-secondary">{{ order.customer.email }}</div>
              </td>
              <td class="text-end fw-semibold">฿{{ formatPrice(order.totalAmount) }}</td>
              <td><span class="badge" :class="`text-bg-${getStatusDisplay(order.status).variant}`">{{ getStatusDisplay(order.status).label }}</span></td>
              <td>
                <template v-if="order.shipmentStatus">
                  <span class="badge" :class="`text-bg-${getStatusDisplay(order.shipmentStatus).variant}`">{{ getStatusDisplay(order.shipmentStatus).label }}</span>
                  <div v-if="order.trackingNo" class="small text-secondary">{{ order.courier }} {{ order.trackingNo }}</div>
                </template>
                <span v-else class="text-secondary small">-</span>
              </td>
              <td class="text-end">
                <button v-if="canAdvance(order)" class="btn btn-sm btn-outline-danger" type="button" @click="openShipModal(order)">
                  <i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>เปลี่ยนสถานะ
                </button>
                <span v-else class="small text-secondary">{{ order.status === 'pending' ? 'รอชำระเงิน' : (order.status === 'cancelled' && order.cancelReason === 'payment_timeout' ? 'เลยเวลาชำระเงิน' : '-') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="pagination.totalPages > 1" class="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 border-top">
        <span class="small text-secondary">หน้า {{ pagination.page }} จาก {{ pagination.totalPages }}</span>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" type="button" :disabled="pagination.page <= 1" @click="loadOrders(pagination.page - 1)">ก่อนหน้า</button>
          <button class="btn btn-outline-secondary" type="button" :disabled="pagination.page >= pagination.totalPages" @click="loadOrders(pagination.page + 1)">ถัดไป</button>
        </div>
      </div>
    </div>

    <!-- popup ยืนยันเปลี่ยนสถานะพัสดุ -->
    <template v-if="shipModal">
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="ship-title" @keydown.esc="closeShipModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="ship-title" class="modal-title h5">ยืนยันการเปลี่ยนสถานะพัสดุ</h2>
              <button type="button" class="btn-close" aria-label="ปิด" :disabled="shipSubmitting" @click="closeShipModal"></button>
            </div>
            <div class="modal-body">
              <div v-if="shipLoading" class="d-flex justify-content-center py-3" role="status">
                <span class="spinner-border text-danger" aria-hidden="true"></span>
                <span class="visually-hidden">กำลังโหลด</span>
              </div>
              <template v-else>
                <p class="mb-2">คำสั่งซื้อ <strong>#{{ shipOrder?.orderNo }}</strong> · {{ customerLabel(shipOrder) }}</p>
                <div v-if="nextStatus" class="d-flex align-items-center gap-2 mb-3">
                  <span class="badge text-bg-secondary">{{ shipOrder.shipmentStatus ? getStatusDisplay(shipOrder.shipmentStatus).label : 'ยังไม่มีพัสดุ' }}</span>
                  <i class="bi bi-arrow-right" aria-hidden="true"></i>
                  <span class="badge text-bg-danger">{{ shipmentStatusLabels[nextStatus].label }}</span>
                </div>
                <p v-else class="text-secondary">คำสั่งซื้อนี้ไม่มีขั้นถัดไปที่เลื่อนได้</p>

                <template v-if="nextStatus">
                  <div v-if="needsTracking" class="row g-2 mb-2">
                    <div class="col-6">
                      <label class="form-label small fw-semibold" for="ship-courier">ขนส่ง <span class="text-danger">*</span></label>
                      <input id="ship-courier" v-model="courier" class="form-control" type="text" placeholder="เช่น Kerry, Flash" />
                    </div>
                    <div class="col-6">
                      <label class="form-label small fw-semibold" for="ship-tracking">เลขพัสดุ <span class="text-danger">*</span></label>
                      <input id="ship-tracking" v-model="trackingNo" class="form-control" type="text" />
                    </div>
                  </div>
                  <label class="form-label small fw-semibold" for="ship-note">หมายเหตุ (ไม่บังคับ)</label>
                  <input id="ship-note" v-model="note" class="form-control" type="text" />
                  <p class="small text-secondary mt-2 mb-0">เลื่อนได้ทีละขั้นเท่านั้น ย้อนกลับไม่ได้</p>
                </template>
              </template>
              <div v-if="shipError" class="alert alert-danger py-2 small mt-3 mb-0" role="alert">{{ shipError }}</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" :disabled="shipSubmitting" @click="closeShipModal">ยกเลิก</button>
              <button type="button" class="btn btn-danger" :disabled="shipSubmitting || shipLoading || !nextStatus" @click="confirmShip">
                <span v-if="shipSubmitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>ยืนยันเปลี่ยนสถานะ
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </template>

    <!-- popup ออเดอร์ทั้งหมดของลูกค้า -->
    <template v-if="customerModal">
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="customer-title" @keydown.esc="customerModal = false">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h2 id="customer-title" class="modal-title h5">ออเดอร์ทั้งหมดของ {{ customer?.name || customer?.email || 'ลูกค้า' }}</h2>
                <div class="small text-secondary">{{ customer?.email }}<template v-if="customer?.phone"> · {{ customer.phone }}</template></div>
              </div>
              <button type="button" class="btn-close" aria-label="ปิด" @click="customerModal = false"></button>
            </div>
            <div class="modal-body">
              <div v-if="customerLoading" class="d-flex justify-content-center py-4" role="status">
                <span class="spinner-border text-danger" aria-hidden="true"></span>
                <span class="visually-hidden">กำลังโหลดออเดอร์</span>
              </div>
              <div v-else-if="customerError" class="alert alert-danger mb-0" role="alert">{{ customerError }}</div>
              <p v-else-if="!customerOrders.length" class="text-center text-secondary mb-0 py-3">ไม่พบข้อมูล</p>
              <template v-else>
                <div v-if="customerTruncated" class="alert alert-warning py-2 small">แสดงเฉพาะส่วนที่โหลดได้ อาจไม่ครบทุกออเดอร์</div>
                <div v-for="order in customerOrders" :key="order.orderId" class="border rounded mb-2">
                  <button class="btn w-100 text-start d-flex flex-wrap justify-content-between align-items-center gap-2 p-3" type="button" :aria-expanded="Boolean(expanded[order.orderId])" @click="toggleOrder(order)">
                    <span>
                      <span class="fw-semibold text-danger">#{{ order.orderNo }}</span>
                      <span class="small text-secondary ms-2">{{ formatDate(order.placedAt) }}</span>
                    </span>
                    <span class="d-flex align-items-center gap-2">
                      <span class="badge" :class="`text-bg-${getStatusDisplay(order.status).variant}`">{{ getStatusDisplay(order.status).label }}</span>
                      <strong>฿{{ formatPrice(order.totalAmount) }}</strong>
                      <i class="bi" :class="expanded[order.orderId] ? 'bi-chevron-up' : 'bi-chevron-down'" aria-hidden="true"></i>
                    </span>
                  </button>
                  <div v-if="expanded[order.orderId]" class="border-top px-3 py-2">
                    <div v-if="expanded[order.orderId].loading" class="text-center py-2" role="status"><span class="spinner-border spinner-border-sm text-danger" aria-hidden="true"></span></div>
                    <div v-else-if="expanded[order.orderId].error" class="small text-danger">{{ expanded[order.orderId].error }}</div>
                    <template v-else-if="expanded[order.orderId].order">
                      <p v-if="!expanded[order.orderId].order.items.length" class="small text-secondary mb-0">ไม่พบรายการสินค้า</p>
                      <div v-for="item in expanded[order.orderId].order.items" :key="item.orderItemId ?? item.productId" class="d-flex align-items-center gap-3 py-2 border-bottom">
                        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.productName" width="48" height="48" class="rounded border object-fit-contain bg-white" />
                        <div class="flex-grow-1 small">
                          <div class="fw-semibold">{{ item.productName }}</div>
                          <div class="text-secondary">฿{{ formatPrice(item.unitPrice) }} × {{ item.quantity }}</div>
                        </div>
                        <strong class="small">฿{{ formatPrice(item.subtotal) }}</strong>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="customerModal = false">ปิด</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </template>
  </main>
</template>
