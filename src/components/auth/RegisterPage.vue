<script setup>
import { ref } from 'vue'

const passwordVisible = ref(false)
const confirmationVisible = ref(false)
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

			<form class="d-grid gap-3" @submit.prevent>
				<div>
					<label class="form-label small fw-semibold mb-1" for="register-name">ชื่อ - นามสกุล <span class="text-danger">*</span></label>
					<input id="register-name" class="form-control" type="text" autocomplete="name" placeholder="เช่น สมชาย ใจดี" />
				</div>

				<div>
					<div class="d-flex justify-content-between align-items-center gap-2 mb-1">
						<label class="form-label small fw-semibold mb-0" for="register-phone">เบอร์โทรศัพท์มือถือ <span class="text-danger">*</span></label>
					</div>
					<div class="input-group">
						<input id="register-phone" class="form-control" type="tel" autocomplete="tel" placeholder="08X-XXX-XXXX" />
					</div>
				</div>

				<div>
					<label class="form-label small fw-semibold mb-1" for="register-email">อีเมล (Email) <span class="text-danger">*</span></label>
					<input id="register-email" class="form-control" type="email" autocomplete="email" placeholder="example@email.com" />
				</div>

				<div>
    <div class="d-flex justify-content-between align-items-center mb-1">
        <label class="form-label small fw-semibold mb-0" for="register-password">รหัสผ่าน <span class="text-danger">*</span></label>
        <button class="btn btn-link p-0 small text-danger text-decoration-none" type="button" @click="passwordVisible = !passwordVisible" :aria-label="passwordVisible ? 'Hide password' : 'Show password'">
            <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
        </button>
    </div>
    <input id="register-password" class="form-control" :type="passwordVisible ? 'text' : 'password'" autocomplete="new-password" placeholder="กำหนดรหัสผ่านความปลอดภัยสูง" />
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
    <input id="register-confirm-password" class="form-control" :type="confirmationVisible ? 'text' : 'password'" autocomplete="new-password" placeholder="กรอกรหัสผ่านอีกครั้ง" />
</div>

				<div class="d-grid gap-2 small">
					<label class="form-check d-flex align-items-start gap-2 mb-0">
						<input class="form-check-input flex-shrink-0 mt-1" type="checkbox" />
						<span>ฉันยอมรับ <a class="link-danger text-decoration-none" href="#terms">ข้อกำหนดการใช้งาน</a> และ <a class="link-danger text-decoration-none" href="#privacy">นโยบายความเป็นส่วนตัว</a> ของ WEHAVECPU</span>
					</label>
				</div>

				<button class="btn btn-danger w-100 fw-semibold" type="submit">ยืนยันการสมัครสมาชิก <span aria-hidden="true">→</span></button>
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