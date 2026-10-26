<script setup>
import { onMounted } from 'vue'
import { ref } from 'vue'
import { useCartStore } from '../../stores/cartStore'
import { formatPrice } from '../../utils/formatters'

const cartStore = useCartStore()
const confirmingClear = ref(false)

onMounted(() => cartStore.refreshCart())
</script>

<template>
  <main class="container py-4">
    <nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
      <RouterLink class="link-secondary text-decoration-none" to="/user/goods/recommended">หน้าหลัก</RouterLink>
      <span aria-hidden="true">›</span>
      <span aria-current="page">ตะกร้าสินค้า</span>
    </nav>

    <h1 class="h3 fw-bold mb-4">ตะกร้าสินค้า</h1>
    <div v-if="cartStore.errorMessage" class="alert alert-danger" role="alert">{{ cartStore.errorMessage }}</div>
    <div v-if="confirmingClear && cartStore.cart.items.length" class="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
      <span>ต้องการลบสินค้าทุกรายการในตะกร้าหรือไม่?</span>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="cartStore.loading" @click="confirmingClear = false">ยกเลิก</button>
        <button class="btn btn-sm btn-danger" type="button" :disabled="cartStore.loading" @click="cartStore.clearCart(); confirmingClear = false">ยืนยันลบทั้งหมด</button>
      </div>
    </div>
    <div v-if="cartStore.loading && !cartStore.cart.items.length" class="d-flex justify-content-center py-5" role="status">
      <span class="spinner-border text-danger" aria-hidden="true"></span>
      <span class="visually-hidden">กำลังโหลดตะกร้า</span>
    </div>
    <div v-else-if="!cartStore.cart.items.length" class="border rounded bg-white p-5 text-center">
      <h2 class="h5">ยังไม่มีสินค้าในตะกร้า</h2>
      <p class="small text-secondary">เลือกสินค้าที่ต้องการ แล้วกลับมาชำระเงินได้ที่นี่</p>
      <RouterLink class="btn btn-danger" to="/user/goods">เลือกซื้อสินค้า</RouterLink>
    </div>

    <div v-else class="row g-4 align-items-start">
      <section class="col-lg-8" aria-label="รายการสินค้าในตะกร้า">
        <div class="table-responsive border rounded bg-white">
          <table class="table align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col">สินค้า</th>
                <th scope="col" class="text-nowrap">ราคาต่อชิ้น</th>
                <th scope="col">จำนวน</th>
                <th scope="col" class="text-end text-nowrap">รวม</th>
                <th scope="col"><span class="visually-hidden">ลบสินค้า</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in cartStore.cart.items" :key="item.orderItemId">
                <td>
                  <div class="d-flex align-items-center gap-3" style="min-width: 15rem">
                    <RouterLink :to="`/user/goods/${item.productId}`" class="flex-shrink-0">
                      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.productName" width="72" height="64" class="rounded border object-fit-contain bg-white" />
                      <span v-else class="d-inline-flex align-items-center justify-content-center rounded border bg-light text-secondary small" style="width:72px;height:64px">ไม่มีรูป</span>
                    </RouterLink>
                    <div>
                      <RouterLink class="link-dark fw-semibold text-decoration-none" :to="`/user/goods/${item.productId}`">{{ item.productName }}</RouterLink>
                      <div class="small text-secondary">SKU: {{ item.productSku }}</div>
                      <div class="small" :class="item.isActive && !item.deletedAt ? 'text-success' : 'text-danger'">
                        {{ item.isActive && !item.deletedAt ? `เหลือ ${item.stock} ชิ้น` : 'สินค้านี้ไม่พร้อมจำหน่าย' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="text-nowrap">฿{{ formatPrice(item.unitPrice) }}</td>
                <td>
                  <div class="input-group input-group-sm" style="min-width: 7.5rem">
                    <button class="btn btn-outline-secondary" type="button" :disabled="cartStore.loading" :aria-label="`ลดจำนวน ${item.productName}`" @click="cartStore.setItemQuantity(item.orderItemId, Math.max(0, item.quantity - 1))">−</button>
                    <span class="input-group-text bg-white justify-content-center flex-grow-1">{{ item.quantity }}</span>
                    <button class="btn btn-outline-secondary" type="button" :disabled="cartStore.loading || item.quantity >= item.stock || !item.isActive" :aria-label="`เพิ่มจำนวน ${item.productName}`" @click="cartStore.setItemQuantity(item.orderItemId, item.quantity + 1)">+</button>
                  </div>
                </td>
                <td class="text-end fw-semibold text-nowrap">฿{{ formatPrice(item.subtotal) }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-danger" type="button" :disabled="cartStore.loading" :aria-label="`นำ ${item.productName} ออกจากตะกร้า`" @click="cartStore.deleteItem(item.orderItemId)">ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <RouterLink class="btn btn-link link-secondary text-decoration-none px-0 mt-3" to="/user/goods">← เลือกซื้อสินค้าต่อ</RouterLink>
      </section>

      <aside class="col-lg-4" aria-label="สรุปคำสั่งซื้อ">
        <section class="border rounded bg-white p-3">
          <h2 class="h6 fw-bold border-bottom pb-3">สรุปคำสั่งซื้อ</h2>
          <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-sm btn-outline-danger" type="button" :disabled="cartStore.loading" @click="confirmingClear = true">ลบสินค้าทั้งหมด</button>
          </div>
          <div class="d-flex justify-content-between small mb-2">
            <span>จำนวนสินค้า</span><span>{{ cartStore.cart.totalQty }} ชิ้น</span>
          </div>
          <div class="d-flex justify-content-between align-items-baseline border-top pt-3 mt-3">
            <strong>ยอดรวม</strong>
            <strong class="fs-5 text-danger">฿{{ formatPrice(cartStore.cart.totalAmount) }}</strong>
          </div>
          <RouterLink class="btn btn-danger w-100 mt-3" to="/user/payment">ดำเนินการสั่งซื้อ</RouterLink>
        </section>
      </aside>
    </div>
  </main>
</template>