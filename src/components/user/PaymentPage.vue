<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addCartItem } from '../../api/cart'
import { cancelOrder, checkoutOrder, payOrder } from '../../api/orders'
import { resolveApiAsset } from '../../api/catalog'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import { formatPrice } from '../../utils/formatters'

const auth = useAuthStore()
const cart = useCartStore()
const route = useRoute()
const router = useRouter()
const submittingCheckout = ref(false)
const submittingPayment = ref(false)
const submittingCancellation = ref(false)
const paymentModalOpen = ref(false)
const payConfirmationOpen = ref(false)
const cancelConfirmationOpen = ref(false)
const cancelReasonOpen = ref(false)
const checkoutError = ref('')
const paymentError = ref('')
const cancelError = ref('')
const order = ref(null)
const orderItems = ref([])
const cancelReason = ref('')
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

const orderTotal = computed(() => Number(order.value?.totalAmount ?? cart.cart.totalAmount) || 0)

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
		installment: 'ผ่อนชำระ',
	}[method]
}

async function submitCheckout() {
	submittingCheckout.value = true
	checkoutError.value = ''
	try {
		const response = await checkoutOrder({
			recipientName: form.value.recipientName.trim(),
			recipientPhone: form.value.recipientPhone.trim(),
			shippingAddress: form.value.shippingAddress.trim(),
			note: form.value.note.trim(),
		})
		order.value = response.order
		orderItems.value = (response.items || []).map((item) => ({
			...item,
			imageUrl: resolveApiAsset(item.imageUrl),
		}))
		await cart.refreshCart()
		paymentModalOpen.value = true
	} catch (error) {
		checkoutError.value = error.response?.data?.message || 'สร้างคำสั่งซื้อไม่สำเร็จ กรุณาตรวจสอบสินค้าในตะกร้า'
	} finally {
		submittingCheckout.value = false
	}
}

async function confirmPayment() {
	if (!order.value?.orderId) return
	submittingPayment.value = true
	paymentError.value = ''
	try {
		await payOrder(order.value.orderId)
		paymentModalOpen.value = false
		await router.replace(`/user/orders/${order.value.orderId}/progress`)
	} catch (error) {
		paymentError.value = error.response?.data?.message || 'ยืนยันการชำระเงินไม่สำเร็จ'
		payConfirmationOpen.value = false
	} finally {
		submittingPayment.value = false
	}
}

async function cancelPendingOrder() {
	if (!order.value?.orderId || !cancelReason.value.trim()) {
		cancelError.value = 'กรุณาระบุสาเหตุการยกเลิก'
		return
	}

	submittingCancellation.value = true
	cancelError.value = ''
	try {
		await cancelOrder(order.value.orderId, cancelReason.value.trim())
		for (const item of orderItems.value) {
			await addCartItem(item.productId, item.quantity)
		}
		await cart.refreshCart()
		await router.replace('/user/cart')
	} catch (error) {
		cancelError.value = error.response?.data?.message || 'ยกเลิกคำสั่งซื้อไม่สำเร็จ'
	} finally {
		submittingCancellation.value = false
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
		<div v-if="checkoutError" class="alert alert-danger" role="alert">{{ checkoutError }}</div>

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
					<div class="row row-cols-1 row-cols-sm-3 g-2">
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
						<div class="col">
							<label class="border rounded p-3 d-flex align-items-center gap-2 h-100 w-100" :class="{ 'border-danger': selectedPaymentMethod === 'installment' }">
								<input v-model="selectedPaymentMethod" class="form-check-input mt-0" type="radio" value="installment" />
								<span><i class="bi bi-lightning-charge me-1 text-danger"></i><span class="small fw-semibold">ผ่อนชำระ</span></span>
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
					<button class="btn btn-danger w-100 mt-3" type="submit" :disabled="submittingCheckout || cart.loading || !cart.cart.items.length">
						<span v-if="submittingCheckout" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
						{{ submittingCheckout ? 'กำลังสร้างคำสั่งซื้อ...' : 'ยืนยันที่อยู่และไปชำระเงิน' }}
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
							<h2 id="payment-modal-title" class="modal-title fs-5 fw-bold">ชำระเงินคำสั่งซื้อ #{{ order?.orderNo }}</h2>
							<p class="small text-secondary mb-0">ช่องทาง: {{ paymentMethodLabel(selectedPaymentMethod) }}</p>
						</div>
						<button class="btn-close" type="button" aria-label="ปิด" @click="paymentModalOpen = false"></button>
					</header>
					<div class="modal-body">
						<div class="text-center mb-3">
							<div v-if="selectedPaymentMethod === 'promptpay'" class="mock-qr mx-auto mb-2" aria-label="QR code ตัวอย่าง PromptPay">
								<span v-for="(cell, index) in qrCells" :key="index" :class="{ 'mock-qr__cell--dark': cell }"></span>
							</div>
							<div v-else class="border rounded bg-light p-4 mb-2">
								<i :class="selectedPaymentMethod === 'bank' ? 'bi bi-bank fs-1 text-danger' : 'bi bi-credit-card-2-front fs-1 text-danger'" aria-hidden="true"></i>
							</div>
							<span class="badge text-bg-warning">ข้อมูลจำลองสำหรับทดสอบ</span>
						</div>
						<dl class="row small mb-0">
							<dt class="col-5 text-secondary fw-normal">ธนาคาร</dt><dd class="col-7">WeHaveCPU Mock Bank</dd>
							<dt class="col-5 text-secondary fw-normal">ชื่อบัญชี</dt><dd class="col-7">บริษัท วีแฮฟซีพียู จำกัด</dd>
							<dt class="col-5 text-secondary fw-normal">เลขบัญชี</dt><dd class="col-7 fw-semibold">123-4-56789-0</dd>
							<dt class="col-5 text-secondary fw-normal">ยอดชำระ</dt><dd class="col-7 fs-5 fw-bold text-danger">฿{{ formatPrice(orderTotal) }}</dd>
						</dl>
						<div v-if="paymentError" class="alert alert-danger py-2 small mt-3 mb-0" role="alert">{{ paymentError }}</div>
					</div>
					<footer class="modal-footer d-flex justify-content-between">
						<button class="btn btn-outline-danger" type="button" @click="cancelConfirmationOpen = true">ยกเลิกคำสั่งซื้อ</button>
						<button class="btn btn-danger" type="button" @click="payConfirmationOpen = true">ยืนยันการชำระเงิน</button>
					</footer>
				</section>
			</div>
		</div>
		<div v-if="paymentModalOpen" class="modal-backdrop show"></div>

		<div v-if="payConfirmationOpen" class="modal d-block confirmation-modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="pay-confirm-title">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<section class="modal-content">
					<div class="modal-body text-center p-4">
						<i class="bi bi-question-circle fs-1 text-warning" aria-hidden="true"></i>
						<h2 id="pay-confirm-title" class="h5 mt-2">ยืนยันการชำระเงินจริงหรือไม่?</h2>
						<p class="small text-secondary">ระบบจะเปลี่ยนสถานะคำสั่งซื้อเป็นชำระเงินแล้ว</p>
						<div class="d-flex justify-content-center gap-2">
							<button class="btn btn-outline-secondary" type="button" :disabled="submittingPayment" @click="payConfirmationOpen = false">กลับไปตรวจสอบ</button>
							<button class="btn btn-danger" type="button" :disabled="submittingPayment" @click="confirmPayment">
								{{ submittingPayment ? 'กำลังยืนยัน...' : 'ยืนยันชำระเงิน' }}
							</button>
						</div>
					</div>
				</section>
			</div>
		</div>

		<div v-if="cancelConfirmationOpen" class="modal d-block confirmation-modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="cancel-confirm-title">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<section class="modal-content">
					<div class="modal-body text-center p-4">
						<i class="bi bi-exclamation-triangle fs-1 text-danger" aria-hidden="true"></i>
						<h2 id="cancel-confirm-title" class="h5 mt-2">ต้องการยกเลิกคำสั่งซื้อจริงหรือไม่?</h2>
						<p class="small text-secondary">สต็อกสินค้าจะถูกคืนเมื่อยกเลิกสำเร็จ</p>
						<div class="d-flex justify-content-center gap-2">
							<button class="btn btn-outline-secondary" type="button" @click="cancelConfirmationOpen = false">ไม่ยกเลิก</button>
							<button class="btn btn-danger" type="button" @click="cancelConfirmationOpen = false; cancelReasonOpen = true">ใช่ ดำเนินการต่อ</button>
						</div>
					</div>
				</section>
			</div>
		</div>

		<div v-if="cancelReasonOpen" class="modal d-block confirmation-modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="cancel-reason-title">
			<div class="modal-dialog modal-dialog-centered">
				<section class="modal-content">
					<header class="modal-header">
						<h2 id="cancel-reason-title" class="modal-title fs-5">ระบุสาเหตุการยกเลิก</h2>
						<button class="btn-close" type="button" aria-label="ปิด" @click="cancelReasonOpen = false"></button>
					</header>
					<div class="modal-body">
						<label class="form-label small fw-semibold" for="cancel-reason">สาเหตุ <span class="text-danger">*</span></label>
						<textarea id="cancel-reason" v-model="cancelReason" class="form-control" rows="3" maxlength="300" required></textarea>
						<div v-if="cancelError" class="alert alert-danger py-2 small mt-3 mb-0" role="alert">{{ cancelError }}</div>
					</div>
					<footer class="modal-footer">
						<button class="btn btn-outline-secondary" type="button" :disabled="submittingCancellation" @click="cancelReasonOpen = false">กลับ</button>
						<button class="btn btn-danger" type="button" :disabled="submittingCancellation || !cancelReason.trim()" @click="cancelPendingOrder">
							{{ submittingCancellation ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิกคำสั่งซื้อ' }}
						</button>
					</footer>
				</section>
			</div>
		</div>

		<div v-if="payConfirmationOpen || cancelConfirmationOpen || cancelReasonOpen" class="modal-backdrop show confirmation-backdrop"></div>
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
.confirmation-modal { z-index: 1070; }
.confirmation-backdrop { z-index: 1060; }

@media (max-width: 575.98px) {
	.modal-dialog { margin: 0.5rem; }
}
</style>