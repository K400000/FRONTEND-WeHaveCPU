<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMyOrderById, getMyOrderTracking } from '../../api/orders'
import { cancelReasonLabels, getStatusDisplay } from '../../utils/statusLabels'
import { formatDate, formatPrice } from '../../utils/formatters'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const tracking = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const steps = [
	{ title: 'ยืนยันคำสั่งซื้อ', description: 'ได้รับคำสั่งซื้อแล้ว' },
	{ title: 'ตรวจสอบและแพ็คสินค้า', description: 'ชำระเงินและเตรียมสินค้า' },
	{ title: 'ร้านค้าเตรียมจัดส่ง', description: 'เตรียมพัสดุส่งให้ขนส่ง' },
	{ title: 'ระหว่างจัดส่ง', description: 'พัสดุกำลังเดินทาง' },
	{ title: 'ส่งมอบสำเร็จ', description: 'จัดส่งถึงผู้รับแล้ว' },
]

const activeStep = computed(() => {
	if (!order.value || order.value.status === 'cancelled') return -1
	if (order.value.status === 'pending') return 0
	const shipmentStatusValue = tracking.value?.shipmentStatus || order.value.shipment?.status
	if (order.value.status === 'completed' || shipmentStatusValue === 'delivered') return 4
	if (['shipped', 'in_transit', 'out_for_delivery'].includes(shipmentStatusValue) || order.value.status === 'shipped') return 3
	if (shipmentStatusValue === 'preparing') return 2
	if (order.value.status === 'paid') return 1
	return 0
})

function isStepComplete(index) {
	return index < activeStep.value || activeStep.value === steps.length - 1
}

const orderStatus = computed(() => getStatusDisplay(order.value?.status))
const cancelReasonLabel = computed(() => cancelReasonLabels[order.value?.cancelReason] || order.value?.cancelReason)
const shipmentStatusValue = computed(() => tracking.value?.shipmentStatus || order.value?.shipment?.status || '')
const shipmentStatus = computed(() => shipmentStatusValue.value ? getStatusDisplay(shipmentStatusValue.value) : null)
const courier = computed(() => tracking.value?.courier || order.value?.shipment?.courier)
const trackingNo = computed(() => tracking.value?.trackingNo || order.value?.shipment?.trackingNo)
const trackingEvents = computed(() => tracking.value?.timeline?.length
	? tracking.value.timeline
	: tracking.value?.events?.length
		? tracking.value.events
		: order.value?.shipment?.events || [])

async function loadOrder() {
	loading.value = true
	errorMessage.value = ''
	try {
		const [detailResult, trackingResult] = await Promise.allSettled([
			getMyOrderById(route.params.id),
			getMyOrderTracking(route.params.id),
		])
		if (detailResult.status === 'rejected') throw detailResult.reason
		order.value = detailResult.value
		tracking.value = trackingResult.status === 'fulfilled' ? trackingResult.value : null
	} catch (error) {
		errorMessage.value = error.response?.data?.message || 'โหลดรายละเอียดคำสั่งซื้อไม่สำเร็จ'
		if (error.response?.status === 401) {
			await router.replace({ name: 'auth-login', query: { redirect: route.fullPath } })
		}
	} finally {
		loading.value = false
	}
}

onMounted(loadOrder)
</script>

<template>
	<main class="container py-4">
		<nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
			<RouterLink class="link-secondary text-decoration-none" to="/user/orders">Order ของฉัน</RouterLink>
			<span aria-hidden="true">›</span>
			<span aria-current="page">ติดตามคำสั่งซื้อ</span>
		</nav>

		<div v-if="loading" class="d-flex justify-content-center py-5" role="status">
			<span class="spinner-border text-danger" aria-hidden="true"></span>
			<span class="visually-hidden">กำลังโหลดคำสั่งซื้อ</span>
		</div>
		<div v-else-if="errorMessage" class="alert alert-danger" role="alert">
			<p class="mb-2">{{ errorMessage }}</p>
			<RouterLink class="btn btn-outline-secondary btn-sm" to="/user/orders">กลับไปประวัติคำสั่งซื้อ</RouterLink>
		</div>

		<template v-else-if="order">
			<section class="border rounded bg-white p-3 p-lg-4 mb-4" aria-labelledby="order-heading">
				<div class="d-flex flex-wrap justify-content-between align-items-start gap-3 border-bottom pb-3">
					<div>
						<div class="d-flex flex-wrap align-items-center gap-2 mb-1">
							<h1 id="order-heading" class="h5 fw-bold mb-0">คำสั่งซื้อ #{{ order.orderNo }}</h1>
							<span class="badge" :class="`text-bg-${orderStatus.variant}`">{{ orderStatus.label }}</span>
						</div>
						<p class="small text-secondary mb-0">สั่งซื้อเมื่อ {{ formatDate(order.createdAt) }}</p>
					</div>
					<RouterLink class="btn btn-outline-secondary btn-sm" to="/user/orders">กลับไป Order ของฉัน</RouterLink>
				</div>

				<div v-if="order.status === 'cancelled'" class="alert alert-danger mt-3 mb-0">
					คำสั่งซื้อนี้ถูกยกเลิก{{ cancelReasonLabel ? `: ${cancelReasonLabel}` : '' }}
				</div>

				<div v-else class="progress-stepper d-flex overflow-auto pt-4 pb-2" aria-label="สถานะการจัดส่ง">
					<div v-for="(step, index) in steps" :key="step.title" class="progress-step text-center">
						<div class="d-flex align-items-center mb-2">
							<span class="progress-step__connector" :class="{ 'invisible': index === 0, 'is-complete': index <= activeStep }"></span>
							<span class="progress-step__node d-inline-flex align-items-center justify-content-center rounded-circle border flex-shrink-0" :class="isStepComplete(index) ? 'bg-success border-success text-white' : index === activeStep ? 'bg-danger border-danger text-white' : 'bg-light text-secondary'">
								<i v-if="isStepComplete(index)" class="bi bi-check-lg" aria-hidden="true"></i>
								<i v-else-if="index === 0" class="bi bi-bag-check" aria-hidden="true"></i>
								<i v-else-if="index === 1" class="bi bi-box-seam" aria-hidden="true"></i>
								<i v-else-if="index === 2" class="bi bi-box2" aria-hidden="true"></i>
								<i v-else-if="index === 3" class="bi bi-truck" aria-hidden="true"></i>
								<i v-else class="bi bi-house-check" aria-hidden="true"></i>
							</span>
							<span class="progress-step__connector" :class="{ 'invisible': index === steps.length - 1, 'is-complete': index < activeStep }"></span>
						</div>
						<div class="small fw-semibold" :class="isStepComplete(index) ? 'text-success' : index === activeStep ? 'text-danger' : 'text-secondary'">{{ step.title }}</div>
						<div class="small text-secondary">{{ step.description }}</div>
					</div>
				</div>

				<div class="row g-3 mt-2">
					<div class="col-md-6">
						<div class="border rounded p-3 h-100">
							<h2 class="h6 fw-bold"><i class="bi bi-truck me-2 text-danger" aria-hidden="true"></i>ข้อมูลการจัดส่ง</h2>
							<p v-if="courier" class="small mb-1">ขนส่ง: {{ courier }}</p>
							<p v-if="trackingNo" class="small mb-1">เลขพัสดุ: <span class="fw-semibold">{{ trackingNo }}</span></p>
							<p v-if="shipmentStatus" class="small mb-0">สถานะ: <span class="badge" :class="`text-bg-${shipmentStatus.variant}`">{{ shipmentStatus.label }}</span></p>
							<p v-if="!courier && !trackingNo" class="small text-secondary mb-0">ยังไม่มีข้อมูลเลขพัสดุ</p>
						</div>
					</div>
					<div class="col-md-6">
						<div class="border rounded p-3 h-100">
							<h2 class="h6 fw-bold"><i class="bi bi-geo-alt me-2 text-danger" aria-hidden="true"></i>ที่อยู่จัดส่ง</h2>
							<p class="small fw-semibold mb-1">{{ order.recipientName }} · {{ order.recipientPhone }}</p>
							<p class="small text-secondary mb-0">{{ order.shippingAddress }}</p>
						</div>
					</div>
				</div>
			</section>

			<div class="row g-4 align-items-start">
				<section class="col-lg-8" aria-labelledby="items-heading">
					<div class="border rounded bg-white p-3">
						<h2 id="items-heading" class="h6 fw-bold mb-3">รายการสินค้า ({{ order.items.length }} รายการ, {{ order.totalQty }} ชิ้น)</h2>
						<div v-for="item in order.items" :key="item.orderItemId" class="d-flex align-items-center gap-3 border-top py-3">
							<RouterLink class="flex-shrink-0" :to="`/user/goods/${item.productId}`">
								<img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.productName" width="76" height="68" class="rounded border object-fit-contain bg-white" />
								<span v-else class="d-inline-flex align-items-center justify-content-center rounded border bg-light text-secondary small" style="width:76px;height:68px">ไม่มีรูป</span>
							</RouterLink>
							<div class="flex-grow-1">
								<RouterLink class="link-dark fw-semibold text-decoration-none" :to="`/user/goods/${item.productId}`">{{ item.productName }}</RouterLink>
								<div class="small text-secondary">SKU: {{ item.productSku }}</div>
								<div class="small text-secondary">฿{{ formatPrice(item.unitPrice) }} × {{ item.quantity }}</div>
							</div>
							<strong class="text-nowrap">฿{{ formatPrice(item.subtotal) }}</strong>
						</div>
					</div>

					<section v-if="trackingEvents.length" class="border rounded bg-white p-3 mt-4" aria-labelledby="timeline-heading">
						<div class="d-flex justify-content-between align-items-center gap-2 mb-3">
							<h2 id="timeline-heading" class="h6 fw-bold mb-0">ประวัติการติดตามพัสดุ</h2>
							<span class="small text-secondary">อัปเดต {{ formatDate(trackingEvents[trackingEvents.length - 1].createdAt) }}</span>
						</div>
						<div v-for="(event, index) in [...trackingEvents].reverse()" :key="event.eventId || index" class="d-flex gap-3 border-top py-3">
							<span class="text-danger"><i class="bi" :class="index === 0 ? 'bi-record-circle-fill' : 'bi-circle'" aria-hidden="true"></i></span>
							<div>
								<div class="small fw-semibold">{{ getStatusDisplay(event.status).label }}</div>
								<p v-if="event.note" class="small text-secondary mb-1">{{ event.note }}</p>
								<time class="small text-secondary">{{ formatDate(event.createdAt) }}</time>
							</div>
						</div>
					</section>
				</section>

				<aside class="col-lg-4" aria-label="สรุปคำสั่งซื้อ">
					<section class="border rounded bg-white p-3">
						<h2 class="h6 fw-bold border-bottom pb-3">สรุปคำสั่งซื้อ</h2>
						<div class="d-flex justify-content-between small mb-2"><span>สินค้า</span><span>{{ order.totalQty }} ชิ้น</span></div>
						<div class="d-flex justify-content-between small mb-2"><span>ยอดสินค้า</span><span>฿{{ formatPrice(order.totalAmount) }}</span></div>
						<div v-if="order.paidAt" class="d-flex justify-content-between small mb-2"><span>ชำระเงินเมื่อ</span><span>{{ formatDate(order.paidAt) }}</span></div>
						<div class="d-flex justify-content-between align-items-baseline border-top pt-3 mt-3">
							<strong>ยอดรวม</strong><strong class="fs-5 text-danger">฿{{ formatPrice(Number(order.totalAmount || 0)) }}</strong>
						</div>
						<p v-if="cancelReasonLabel" class="small text-danger mt-2 mb-0">{{ cancelReasonLabel }}</p>
					</section>
				</aside>
			</div>
		</template>
	</main>
</template>

<style scoped>
.progress-step {
	flex: 1 0 9.5rem;
}

.progress-step__connector {
	flex: 1 1 0;
	border-top: 2px solid var(--bs-border-color);
}

.progress-step__connector.is-complete {
	border-color: var(--bs-success);
}

.progress-step__node {
	width: 2.25rem;
	height: 2.25rem;
}
</style>