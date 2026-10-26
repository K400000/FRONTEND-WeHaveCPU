<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders } from '../../api/orders'
import { cancelReasonLabels, getStatusDisplay } from '../../utils/statusLabels'
import { formatDate, formatPrice } from '../../utils/formatters'

const router = useRouter()
const orders = ref([])
const loading = ref(true)
const errorMessage = ref('')

async function loadOrders() {
  loading.value = true
  errorMessage.value = ''
  try {
    orders.value = await getMyOrders()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'โหลดประวัติคำสั่งซื้อไม่สำเร็จ'
    if (error.response?.status === 401) {
      await router.replace({ name: 'auth-login', query: { redirect: '/user/orders' } })
    }
  } finally {
    loading.value = false
  }
}

function openOrder(orderId) {
  router.push(`/user/orders/${orderId}/progress`)
}

onMounted(loadOrders)
</script>

<template>
  <main class="container py-4">
    <nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
      <RouterLink class="link-secondary text-decoration-none" to="/user/goods/recommended">หน้าหลัก</RouterLink>
      <span aria-hidden="true">›</span>
      <span aria-current="page">Order ของฉัน</span>
    </nav>

    <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1">Order ของฉัน</h1>
        <p class="small text-secondary mb-0">ประวัติการสั่งซื้อและสถานะการจัดส่ง</p>
      </div>
      <RouterLink class="btn btn-outline-secondary btn-sm" to="/user/goods">เลือกซื้อสินค้าต่อ</RouterLink>
    </div>

    <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
    <div v-else-if="loading" class="d-flex justify-content-center py-5" role="status">
      <span class="spinner-border text-danger" aria-hidden="true"></span>
      <span class="visually-hidden">กำลังโหลดคำสั่งซื้อ</span>
    </div>
    <div v-else-if="!orders.length" class="border rounded bg-white p-5 text-center">
      <h2 class="h5">ยังไม่มีประวัติการสั่งซื้อ</h2>
      <p class="small text-secondary">เมื่อสั่งซื้อสินค้าแล้ว รายการจะปรากฏที่นี่</p>
      <RouterLink class="btn btn-danger" to="/user/goods">เลือกซื้อสินค้า</RouterLink>
    </div>

    <div v-else class="table-responsive border rounded bg-white">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th scope="col">Order</th>
            <th scope="col">วันที่สั่งซื้อ</th>
            <th scope="col">รายการสินค้า</th>
            <th scope="col" class="text-center">จำนวน</th>
            <th scope="col">สถานะ</th>
            <th scope="col" class="text-end">ยอดรวม</th>
            <th scope="col"><span class="visually-hidden">ดูรายละเอียด</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.orderId" class="order-row" tabindex="0" @click="openOrder(order.orderId)" @keydown.enter="openOrder(order.orderId)">
            <td>
              <span class="fw-semibold">#{{ order.orderNo }}</span>
              <span v-if="order.cancelReason" class="d-block small text-secondary">{{ cancelReasonLabels[order.cancelReason] || order.cancelReason }}</span>
            </td>
            <td class="text-nowrap">{{ formatDate(order.createdAt) }}</td>
            <td>
              <div class="d-flex align-items-center gap-2" v-for="item in order.items.slice(0, 2)" :key="item.orderItemId">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.productName" width="48" height="42" class="rounded border object-fit-contain bg-white flex-shrink-0" />
                <span v-else class="d-inline-flex align-items-center justify-content-center rounded border bg-light text-secondary small flex-shrink-0" style="width:48px;height:42px">—</span>
                <span class="small text-truncate order-item-name">{{ item.productName }}</span>
              </div>
              <small v-if="order.items.length > 2" class="text-secondary">และอีก {{ order.items.length - 2 }} รายการ</small>
            </td>
            <td class="text-center">{{ order.totalQty }}</td>
            <td><span class="badge" :class="`text-bg-${getStatusDisplay(order.status).variant}`">{{ getStatusDisplay(order.status).label }}</span></td>
            <td class="text-end text-nowrap fw-semibold">฿{{ formatPrice(order.totalAmount) }}</td>
            <td class="text-end"><button class="btn btn-sm btn-outline-secondary" type="button" @click.stop="openOrder(order.orderId)">รายละเอียด</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.order-row { cursor: pointer; }
.order-item-name { max-width: 14rem; }
</style>