<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { checkoutOrder, payOrder } from '../../api/orders'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import { formatPrice } from '../../utils/formatters'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const submittingPayment = ref(false)
const paymentModalOpen = ref(false)
const paymentError = ref('')
const order = ref(null)
const selectedPaymentMethod = ref('promptpay')
const form = ref({ recipientName: '', recipientPhone: '', shippingAddress: '', note: '' })

const qrCells = computed(() => Array.from({ length: 441 }, (_, index) => {
	const x = index % 21
	const y = Math.floor(index / 21)
	const finders = [[0, 0], [14, 0], [0, 14]]
	const finder = finders.find(([left, top]) => x >= left && x < left + 7 && y >= top && y < top + 7)

	if (finder) {
		const localX = x - finder[0]
		const localY = y - finder[1]
		return localX === 0 || localX === 6 || localY === 0 || localY === 6 || (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4)
	}
	return ((x * 17 + y * 31 + x * y * 7) % 13) < 6
}))

watch(() => auth.user, (user) => {
	if (!user) return
	form.value.recipientName ||= [user.firstName, user.lastName].filter(Boolean).join(' ')
	form.value.recipientPhone ||= user.phone || ''
	form.value.shippingAddress ||= user.address || ''
}, { immediate: true })

onMounted(async () => {
	await auth.refreshSession()
	await auth.refreshSession()
	if (auth.user) {
		form.value.recipientName ||= [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ')
		form.value.recipientPhone ||= auth.user.phone || ''
		form.value.shippingAddress ||= auth.user.address || ''
	}
	await cart.refreshCart()
	if (!cart.cart.items.length) await router.replace('/user/cart')
})

function paymentMethodLabel(method) {
	return {
		promptpay: 'PromptPay QR',
		bank: 'โอนผ่านธนาคาร',
	}[method]
}

function submitCheckout() {
	paymentError.value = ''
	paymentModalOpen.value = true
}

async function confirmPayment() {
	submittingPayment.value = true
	paymentError.value = ''
	try {
		if (!order.value?.orderId) {
			const response = await checkoutOrder({
				recipientName: form.value.recipientName.trim(),
				recipientPhone: form.value.recipientPhone.trim(),
				shippingAddress: form.value.shippingAddress.trim(),
				note: form.value.note.trim(),
			})
			order.value = response.order
			await cart.refreshCart()
		}

		if (!order.value?.orderId) {
			throw new Error('ไม่พบหมายเลขคำสั่งซื้อ')
		}

		await payOrder(order.value.orderId)
		paymentModalOpen.value = false
		await router.replace(`/user/orders/${order.value.orderId}/progress`)
	} catch (error) {
		paymentError.value = error.response?.data?.message || (
			order.value?.orderId
				? 'ยืนยันการชำระเงินไม่สำเร็จ'
				: 'สร้างคำสั่งซื้อไม่สำเร็จ กรุณาตรวจสอบสินค้าในตะกร้า'
		)
	} finally {
		submittingPayment.value = false
	}
}
</script>

<template>
	<main class="container py-4">
		<nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
			<RouterLink class="link-secondary text-decoration-none" to="/user/cart">ตะกร้าสินค้า</RouterLink>
			<span aria-hidden="true">›</span>
			<span aria-current="page">ชำระเงิน</span>
		</nav>

		<h1 class="h3 fw-bold mb-4">ชำระเงิน</h1>

		<form class="row g-4" @submit.prevent="submitCheckout">
			<section class="col-lg-8 d-grid gap-3" aria-label="ข้อมูลจัดส่ง">
				<div class="border rounded bg-white p-3 p-md-4">
					<h2 class="h5 fw-bold mb-3">ข้อมูลผู้รับสินค้า</h2>
					<div class="row g-3">
						<div class="col-md-6">
							<label class="form-label small fw-semibold" for="recipient-name">ชื่อผู้รับ <span class="text-danger">*</span></label>
							<input id="recipient-name" v-model="form.recipientName" class="form-control" autocomplete="name" required />
						</div>
						<div class="col-md-6">
							<label class="form-label small fw-semibold" for="recipient-phone">เบอร์โทรศัพท์ <span class="text-danger">*</span></label>
							<input id="recipient-phone" v-model="form.recipientPhone" class="form-control" type="tel" autocomplete="tel" required />
						</div>
						<div class="col-12">
							<label class="form-label small fw-semibold" for="shipping-address">ที่อยู่จัดส่ง <span class="text-danger">*</span></label>
							<textarea id="shipping-address" v-model="form.shippingAddress" class="form-control" rows="3" autocomplete="street-address" required></textarea>
						</div>
						<div class="col-12">
							<label class="form-label small fw-semibold" for="order-note">หมายเหตุเพิ่มเติม</label>
							<textarea id="order-note" v-model="form.note" class="form-control" rows="2" placeholder="เช่น เวลาที่สะดวกรับสินค้า"></textarea>
						</div>
					</div>
				</div>

				<div class="border rounded bg-white p-3 p-md-4">
					<h2 class="h5 fw-bold mb-3">เลือกช่องทางชำระเงิน</h2>
					<div class="row row-cols-1 row-cols-sm-2 g-2">
						<div class="col">
							<label class="border rounded p-3 d-flex align-items-center gap-2 h-100 w-100" :class="{ 'border-danger': selectedPaymentMethod === 'promptpay' }">
								<input v-model="selectedPaymentMethod" class="form-check-input mt-0" type="radio" value="promptpay" />
								<span><i class="bi bi-qr-code me-1 text-danger"></i><span class="small fw-semibold">PromptPay</span></span>
							</label>
						</div>
						<div class="col">
							<label class="border rounded p-3 d-flex align-items-center gap-2 h-100 w-100" :class="{ 'border-danger': selectedPaymentMethod === 'bank' }">
								<input v-model="selectedPaymentMethod" class="form-check-input mt-0" type="radio" value="bank" />
								<span><i class="bi bi-bank me-1 text-danger"></i><span class="small fw-semibold">โอนธนาคาร</span></span>
							</label>
						</div>
					</div>
					<p class="small text-secondary mt-3 mb-0">ช่องทางชำระเงินในหน้านี้เป็นข้อมูลตัวอย่าง ระบบจะยืนยันการชำระผ่าน Mock API</p>
				</div>
			</section>

			<aside class="col-lg-4" aria-label="สรุปคำสั่งซื้อ">
				<section class="border rounded bg-white p-3">
					<h2 class="h6 fw-bold border-bottom pb-3">สรุปคำสั่งซื้อ</h2>
					<div v-for="item in cart.cart.items" :key="item.orderItemId" class="d-flex justify-content-between gap-3 small mb-2">
						<span class="text-secondary text-truncate">{{ item.productName }} × {{ item.quantity }}</span>
						<span class="text-nowrap">฿{{ formatPrice(item.subtotal) }}</span>
					</div>
					<div class="d-flex justify-content-between small border-top pt-3 mt-3">
						<span>รวมสินค้า {{ cart.cart.totalQty }} ชิ้น</span><span>฿{{ formatPrice(cart.cart.totalAmount) }}</span>
					</div>
					<div class="d-flex justify-content-between align-items-baseline mt-2">
						<strong>ยอดชำระ</strong><strong class="fs-5 text-danger">฿{{ formatPrice(cart.cart.totalAmount) }}</strong>
					</div>
					<button class="btn btn-danger w-100 mt-3" type="submit" :disabled="cart.loading || !cart.cart.items.length">
						ยืนยันที่อยู่และชำระเงิน
					</button>
					<RouterLink class="btn btn-link link-secondary text-decoration-none w-100 mt-2" to="/user/cart">กลับไปแก้ไขตะกร้า</RouterLink>
				</section>
			</aside>
		</form>

		<div v-if="paymentModalOpen" class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
			<div class="modal-dialog modal-dialog-centered">
				<section class="modal-content">
					<header class="modal-header">
						<div>
							<h2 id="payment-modal-title" class="modal-title fs-5 fw-bold">ยืนยันการชำระเงิน</h2>
							<p class="small text-secondary mb-0">ช่องทาง: {{ paymentMethodLabel(selectedPaymentMethod) }}</p>
						</div>
						<button class="btn-close" type="button" aria-label="ปิด" :disabled="submittingPayment" @click="paymentModalOpen = false"></button>
					</header>
					<div class="modal-body">
						<div class="text-center mb-3">
							<div v-if="selectedPaymentMethod === 'promptpay'" class="mock-qr mx-auto mb-2" aria-label="QR code ตัวอย่าง PromptPay">
								<span v-for="(cell, index) in qrCells" :key="index" :class="{ 'mock-qr__cell--dark': cell }"></span>
							</div>
							<div v-else class="border rounded bg-light p-3 mb-2">
								<div class="small text-secondary">บัญชีธนาคาร (ข้อมูลจำลอง)</div>
								<div class="fw-semibold">WeHaveCPU Mock Bank</div>
								<div class="fs-3 fw-bold font-monospace text-dark">1234567890</div>
								<div class="small">ชื่อบัญชี บริษัท วีแฮฟซีพียู จำกัด</div>
							</div>
							<span class="badge text-bg-warning">ข้อมูลจำลองสำหรับทดสอบ</span>
						</div>
						<dl class="row small mb-0">
							<dt class="col-5 text-secondary fw-normal">ยอดชำระ</dt><dd class="col-7 fs-5 fw-bold text-danger">฿{{ formatPrice(cart.cart.totalAmount) }}</dd>
						</dl>
						<div v-if="paymentError" class="alert alert-danger py-2 small mt-3 mb-0" role="alert">{{ paymentError }}</div>
					</div>
					<footer class="modal-footer d-flex justify-content-between">
						<button class="btn btn-outline-secondary" type="button" :disabled="submittingPayment" @click="paymentModalOpen = false">ยกเลิก</button>
						<button class="btn btn-danger" type="button" :disabled="submittingPayment" @click="confirmPayment">
							<span v-if="submittingPayment" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
							{{ submittingPayment ? 'กำลังยืนยัน...' : 'ยืนยันการชำระเงิน' }}
						</button>
					</footer>
				</section>
			</div>
		</div>
		<div v-if="paymentModalOpen" class="modal-backdrop show"></div>
	</main>
</template>

<style scoped>
.mock-qr {
	display: grid;
	width: 11rem;
	aspect-ratio: 1;
	grid-template-columns: repeat(21, 1fr);
	padding: 0.5rem;
	border: 1px solid #dee2e6;
	background: white;
}

.mock-qr span.mock-qr__cell--dark { background: #111; }

@media (max-width: 575.98px) {
	.modal-dialog { margin: 0.5rem; }
}
</style>