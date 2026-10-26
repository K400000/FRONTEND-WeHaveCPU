<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const phone = ref('')
const address = ref('')
const acceptTerms = ref(false)
const passwordVisible = ref(false)
const confirmationVisible = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

async function submitRegistration() {
	errorMessage.value = ''

	if (password.value !== confirmPassword.value) {
		errorMessage.value = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน'
		return
	}

	submitting.value = true
	try {
		await auth.register({
			email: email.value.trim(),
			password: password.value,
			firstName: firstName.value.trim(),
			lastName: lastName.value.trim(),
			phone: phone.value.trim(),
			address: address.value.trim(),
		})
		const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
			? route.query.redirect
			: '/user/profile'
		await router.replace(redirect)
	} catch (error) {
		errorMessage.value = error.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง'
	} finally {
		submitting.value = false
	}
}
</script>

<template>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
	<main class="container py-3 pb-5">
		<nav class="d-flex align-items-center gap-2 small text-secondary" aria-label="เส้นทางนำทาง">
			<RouterLink class="link-secondary text-decoration-none" to="/user/goods/recommended">หน้าหลัก</RouterLink>
			<span aria-hidden="true">›</span>
			<RouterLink class="link-secondary text-decoration-none" to="/auth/login">เข้าสู่ระบบ</RouterLink>
			<span aria-hidden="true">›</span>
			<span aria-current="page">สมัครสมาชิก</span>
		</nav>

		<section class="card auth-card auth-card--register mx-auto mt-4 p-3 p-sm-4" aria-labelledby="register-title">
			<header class="text-center mb-3">
                <img src="../../assets/WHClogo.png" alt="We Have CPU" class="mb-2" width="150" height="60" />
				<h1 id="register-title" class="h4 fw-bold mb-1">สมัครสมาชิกใหม่</h1>
				<p class="small text-secondary mb-0">สร้างบัญชีเพื่อสะสมแต้ม ติดตามสถานะคำสั่งซื้อ และรับสิทธิพิเศษก่อนใคร</p>
			</header>

			<div v-if="errorMessage" class="alert alert-danger py-2 small" role="alert">{{ errorMessage }}</div>
			<form class="d-grid gap-3" @submit.prevent="submitRegistration">
				<div class="row g-2">
					<div class="col-sm-6">
						<label class="form-label small fw-semibold mb-1" for="register-first-name">ชื่อ <span class="text-danger">*</span></label>
						<input id="register-first-name" v-model="firstName" class="form-control" type="text" autocomplete="given-name" placeholder="สมชาย" required />
					</div>
					<div class="col-sm-6">
						<label class="form-label small fw-semibold mb-1" for="register-last-name">นามสกุล <span class="text-danger">*</span></label>
						<input id="register-last-name" v-model="lastName" class="form-control" type="text" autocomplete="family-name" placeholder="ใจดี" required />
					</div>
				</div>

				<div>
					<div class="d-flex justify-content-between align-items-center gap-2 mb-1">
						<label class="form-label small fw-semibold mb-0" for="register-phone">เบอร์โทรศัพท์มือถือ <span class="text-danger">*</span></label>
					</div>
					<div class="input-group">
						<input id="register-phone" v-model="phone" class="form-control" type="tel" autocomplete="tel" placeholder="08X-XXX-XXXX" />
					</div>
				</div>

				<div>
					<label class="form-label small fw-semibold mb-1" for="register-email">อีเมล (Email) <span class="text-danger">*</span></label>
					<input id="register-email" v-model="email" class="form-control" type="email" autocomplete="email" placeholder="example@email.com" required />
				</div>

				<div>
    <div class="d-flex justify-content-between align-items-center mb-1">
        <label class="form-label small fw-semibold mb-0" for="register-password">รหัสผ่าน <span class="text-danger">*</span></label>
        <button class="btn btn-link p-0 small text-danger text-decoration-none" type="button" @click="passwordVisible = !passwordVisible" :aria-label="passwordVisible ? 'Hide password' : 'Show password'">
            <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
        </button>
    </div>
	<input id="register-password" v-model="password" class="form-control" :type="passwordVisible ? 'text' : 'password'" autocomplete="new-password" minlength="6" placeholder="กำหนดรหัสผ่านความปลอดภัยสูง" required />
    <div class="row row-cols-2 g-1 mt-2 small text-secondary">
        <div class="col d-flex align-items-center gap-2"><span class="password-indicator rounded-circle border"></span>อย่างน้อย 8 ตัวอักษร</div>
        <div class="col d-flex align-items-center gap-2"><span class="password-indicator rounded-circle border"></span>มีตัวพิมพ์ใหญ่ (A-Z)</div>
        <div class="col d-flex align-items-center gap-2"><span class="password-indicator rounded-circle border"></span>มีตัวเลขอย่างน้อย 1 ตัว</div>
        <div class="col d-flex align-items-center gap-2"><span class="password-indicator rounded-circle border"></span>รหัสผ่านปลอดภัย</div>
    </div>
</div>

<div>
    <div class="d-flex justify-content-between align-items-center mb-1">
        <label class="form-label small fw-semibold mb-0" for="register-confirm-password">ยืนยันรหัสผ่าน <span class="text-danger">*</span></label>
        <button class="btn btn-link p-0 small text-danger text-decoration-none" type="button" @click="confirmationVisible = !confirmationVisible" :aria-label="confirmationVisible ? 'Hide confirm password' : 'Show confirm password'">
            <i :class="confirmationVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
        </button>
    </div>
    <input id="register-confirm-password" v-model="confirmPassword" class="form-control" :type="confirmationVisible ? 'text' : 'password'" autocomplete="new-password" minlength="6" placeholder="กรอกรหัสผ่านอีกครั้ง" required />
</div>

<div>
    <label class="form-label small fw-semibold mb-1" for="register-address">ที่อยู่</label>
    <textarea id="register-address" v-model="address" class="form-control" rows="2" autocomplete="street-address" placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด"></textarea>
</div>

				<div class="d-grid gap-2 small">
					<label class="form-check d-flex align-items-start gap-2 mb-0">
						<input v-model="acceptTerms" class="form-check-input flex-shrink-0 mt-1" type="checkbox" required />
						<span>ฉันยอมรับ <a class="link-danger text-decoration-none" href="#terms">ข้อกำหนดการใช้งาน</a> และ <a class="link-danger text-decoration-none" href="#privacy">นโยบายความเป็นส่วนตัว</a> ของ WEHAVECPU</span>
					</label>
				</div>

				<button class="btn btn-danger w-100 fw-semibold" type="submit" :disabled="submitting || !acceptTerms">
					<span v-if="submitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
					{{ submitting ? 'กำลังสมัครสมาชิก...' : 'ยืนยันการสมัครสมาชิก' }} <span v-if="!submitting" aria-hidden="true">→</span>
				</button>
			</form>

			<p class="text-center small text-secondary mt-4 mb-0">มีบัญชีผู้ใช้งานอยู่แล้ว? <RouterLink class="link-danger fw-semibold text-decoration-none" to="/auth/login">เข้าสู่ระบบ</RouterLink></p>
		</section>
	</main>
</template>

<style scoped>
.auth-card { width: min(100%, 31rem); }
.auth-card--register { max-width: 34rem; }
.password-indicator { width: 0.65rem; height: 0.65rem; flex: 0 0 auto; }
</style>