<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const passwordVisible = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

async function submitLogin() {
	submitting.value = true
	errorMessage.value = ''

	try {
		const user = await auth.login({ email: email.value.trim(), password: password.value })
		const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
			? route.query.redirect
			: user?.role === 'admin' ? '/admin/dashboard' : '/user/profile'
		await router.replace(redirect)
	} catch (error) {
		errorMessage.value = error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน'
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
			<span aria-current="page">เข้าสู่ระบบ</span>
		</nav>

		<section class="card auth-card mx-auto mt-4 p-3 p-sm-4" aria-labelledby="login-title">
			<header class="mb-3 text-center">
                <img src="../../assets/WHClogo.png" alt="We Have CPU" class="mb-2" width="150" height="60" />
                <h1 id="login-title" class="h3 fw-bold mb-1">เข้าสู่ระบบ</h1>
                <p class="small text-secondary mb-0">ยินดีต้อนรับสู่ WEHAVECPU ศูนย์รวมคอมพิวเตอร์และอุปกรณ์ไอทีชั้นนำ</p>
            </header>

			<div v-if="errorMessage" class="alert alert-danger py-2 small" role="alert">{{ errorMessage }}</div>
			<form class="d-grid gap-3 mt-3" @submit.prevent="submitLogin">
				<div>
					<label class="form-label small fw-semibold mb-1" for="login-identity">อีเมล</label>
					<input id="login-identity" v-model="email" class="form-control" type="email" autocomplete="username" placeholder="yourname@email.com" required />
				</div>

				<div>
					<div class="d-flex justify-content-between align-items-center mb-1">
						<label class="form-label small fw-semibold mb-0" for="login-password">รหัสผ่าน</label>
					</div>
					<div class="input-group">
	    <input id="login-password"
           class="form-control" 
           :type="passwordVisible ? 'text' : 'password'" 
		    v-model="password"
           autocomplete="current-password" 
		    placeholder="กรอกรหัสผ่านของคุณ" required />
    
    <button class="btn btn-outline-secondary" 
            type="button" 
            @click="passwordVisible = !passwordVisible"
            :aria-label="passwordVisible ? 'Hide password' : 'Show password'">
        <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
    </button>
</div>
				</div>

				<div class="d-flex justify-content-between align-items-center small">
					<label class="form-check-label"><input class="form-check-input me-1" type="checkbox" />จำฉันไว้ในระบบ</label>
				</div>

				<button class="btn btn-danger w-100 fw-semibold" type="submit" :disabled="submitting">
					<span v-if="submitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
					{{ submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }} <span v-if="!submitting" aria-hidden="true">→</span>
				</button>
			</form>

			<div class="mt-4 text-center small">
				<p class="mb-1">ยังไม่มีบัญชีผู้ใช้งาน? <RouterLink class="link-danger fw-semibold text-decoration-none" to="/auth/register">สมัครสมาชิกใหม่</RouterLink></p>
			</div>

		</section>
	</main>
</template>

<style scoped>
.auth-card { width: min(100%, 31rem); }
.nav-pills .nav-link.active { background-color: var(--bs-danger); }
</style>