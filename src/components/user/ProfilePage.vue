<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMyProfile, updateMyPassword, updateMyProfile } from '../../api/profile'
import { resolveApiAsset } from '../../api/catalog'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const profile = ref({ firstName: '', lastName: '', email: '', phone: '', address: '', avatarUrl: '', role: '', status: '', createdAt: '' })
const activeSection = ref('profile')
const loading = ref(true)
const savingProfile = ref(false)
const savingPassword = ref(false)
const profileMessage = ref('')
const profileError = ref('')
const passwordMessage = ref('')
const passwordError = ref('')
const selectedAvatar = ref(null)
const avatarPreview = ref('')
const avatarInput = ref(null)
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

function setProfile(user) {
	profile.value = {
		firstName: user.firstName || '',
		lastName: user.lastName || '',
		email: user.email || '',
		phone: user.phone || '',
		address: user.address || '',
		avatarUrl: user.avatarUrl || '',
		role: user.role || '',
		status: user.status || '',
		createdAt: user.createdAt || '',
	}
	avatarPreview.value = resolveApiAsset(user.avatarUrl)
}

async function loadProfile() {
	loading.value = true
	profileError.value = ''
	try {
		const user = await getMyProfile()
		setProfile(user)
		auth.user = user
		auth.isAuthenticated = true
		auth.isInitialized = true
	} catch (error) {
		profileError.value = error.response?.data?.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ'
		if (error.response?.status === 401) {
			await router.replace({ name: 'auth-login', query: { redirect: route.fullPath } })
		}
	} finally {
		loading.value = false
	}
}

function chooseAvatar(event) {
	const file = event.target.files?.[0]
	profileError.value = ''
	profileMessage.value = ''
	if (!file) return

	if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
		profileError.value = 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP'
		event.target.value = ''
		return
	}
	if (file.size > 5 * 1024 * 1024) {
		profileError.value = 'ไฟล์รูปต้องมีขนาดไม่เกิน 5MB'
		event.target.value = ''
		return
	}

	if (avatarPreview.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
	selectedAvatar.value = file
	avatarPreview.value = URL.createObjectURL(file)
}

async function saveProfile() {
	savingProfile.value = true
	profileMessage.value = ''
	profileError.value = ''
	try {
		const response = await updateMyProfile(profile.value, selectedAvatar.value)
		const user = response.user || await getMyProfile()
		if (avatarPreview.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
		setProfile(user)
		auth.user = user
		selectedAvatar.value = null
		if (avatarInput.value) avatarInput.value.value = ''
		profileMessage.value = response.message || 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว'
	} catch (error) {
		profileError.value = error.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง'
	} finally {
		savingProfile.value = false
	}
}

function cancelProfileEdit() {
	if (avatarPreview.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
	selectedAvatar.value = null
	if (avatarInput.value) avatarInput.value.value = ''
	loadProfile()
}

async function changePassword() {
	passwordMessage.value = ''
	passwordError.value = ''
	if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
		passwordError.value = 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน'
		return
	}

	savingPassword.value = true
	try {
		const response = await updateMyPassword(passwordForm.value.currentPassword, passwordForm.value.newPassword)
		passwordMessage.value = response.message || 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว'
		passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
	} catch (error) {
		passwordError.value = error.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาตรวจสอบรหัสผ่านเดิม'
	} finally {
		savingPassword.value = false
	}
}

async function logout() {
	await auth.logout()
	await router.replace({ name: 'auth-login' })
}

onMounted(loadProfile)
onBeforeUnmount(() => {
	if (avatarPreview.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
})
</script>

<template>
	<main class="container py-4">
		<nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
			<RouterLink class="link-secondary text-decoration-none" :to="auth.isAdmin ? '/admin/dashboard' : '/user/goods/recommended'">{{ auth.isAdmin ? 'แดชบอร์ด' : 'หน้าหลัก' }}</RouterLink>
			<span aria-hidden="true">›</span>
			<RouterLink class="link-secondary text-decoration-none" :to="auth.isAdmin ? '/admin/profile' : '/user/profile'">บัญชีของฉัน</RouterLink>
			<span aria-hidden="true">›</span>
			<span aria-current="page">ข้อมูลโปรไฟล์</span>
		</nav>

		<div class="row g-4 align-items-start">
			<aside class="col-lg-3" aria-label="เมนูบัญชี">
				<section class="border rounded bg-white p-3 mb-3 text-center">
					<img v-if="avatarPreview" :src="avatarPreview" :alt="`รูปโปรไฟล์ ${profile.firstName}`" class="rounded-circle border object-fit-cover mb-2" width="80" height="80" />
					<div v-else class="profile-placeholder rounded-circle border bg-light mx-auto mb-2 d-flex align-items-center justify-content-center text-secondary">
						<i class="bi bi-person-fill fs-3" aria-hidden="true"></i>
					</div>
					<div class="fw-semibold">{{ [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'สมาชิก' }}</div>
					<div class="small text-secondary text-truncate">{{ profile.email }}</div>
					  <span v-if="profile.role" class="badge mt-2" :class="profile.role === 'admin' ? 'text-bg-danger' : 'text-bg-light border'">{{ profile.role === 'admin' ? 'Admin (ผู้ดูแลระบบ)' : 'Member' }}</span>
				</section>

				<nav class="list-group mb-3" aria-label="การตั้งค่าบัญชี">
					<button class="list-group-item list-group-item-action" :class="{ active: activeSection === 'profile' }" type="button" @click="activeSection = 'profile'">
						<i class="bi bi-person-vcard me-2" aria-hidden="true"></i>ข้อมูลโปรไฟล์
					</button>
					<button class="list-group-item list-group-item-action" :class="{ active: activeSection === 'security' }" type="button" @click="activeSection = 'security'">
						<i class="bi bi-shield-lock me-2" aria-hidden="true"></i>ความปลอดภัยและรหัสผ่าน
					</button>
					<button class="list-group-item list-group-item-action text-danger" type="button" @click="logout">
						<i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>ออกจากระบบ
					</button>
				</nav>
			</aside>

			<section class="col-lg-9">
				<div v-if="loading" class="d-flex justify-content-center py-5" role="status">
					<span class="spinner-border text-danger" aria-hidden="true"></span>
					<span class="visually-hidden">กำลังโหลดโปรไฟล์</span>
				</div>
				<div v-else-if="profileError && !profile.email" class="alert alert-danger" role="alert">{{ profileError }}</div>

				<section v-else-if="activeSection === 'profile'" class="border rounded bg-white p-3 p-md-4" aria-labelledby="profile-title">
					<div class="d-flex flex-wrap justify-content-between align-items-start gap-3 border-bottom pb-3 mb-4">
						<div>
							<h1 id="profile-title" class="h4 fw-bold mb-1">ข้อมูลส่วนตัวและการตั้งค่าโปรไฟล์</h1>
							<p class="small text-secondary mb-0">จัดการข้อมูลผู้ใช้ ชื่อ-นามสกุล เบอร์โทรศัพท์ และรูปโปรไฟล์</p>
						</div>
						<span v-if="profile.status" class="badge" :class="profile.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'">{{ profile.status }}</span>
					</div>

					<div v-if="profileMessage" class="alert alert-success py-2" role="status">{{ profileMessage }}</div>
					<div v-if="profileError" class="alert alert-danger py-2" role="alert">{{ profileError }}</div>

					<div class="d-flex flex-wrap align-items-center gap-3 mb-4">
						<img v-if="avatarPreview" :src="avatarPreview" :alt="`รูปโปรไฟล์ ${profile.firstName}`" class="rounded-circle border object-fit-cover" width="88" height="88" />
						<div v-else class="profile-placeholder rounded-circle border bg-light d-flex align-items-center justify-content-center text-secondary">
							<i class="bi bi-person-fill fs-2" aria-hidden="true"></i>
						</div>
						<div>
							<input ref="avatarInput" class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" @change="chooseAvatar" />
							<button class="btn btn-outline-secondary btn-sm" type="button" @click="avatarInput?.click()">
								<i class="bi bi-upload me-1" aria-hidden="true"></i>{{ selectedAvatar ? 'เปลี่ยนรูป' : 'อัปโหลดรูปโปรไฟล์' }}
							</button>
							<button v-if="selectedAvatar" class="btn btn-link btn-sm text-secondary" type="button" @click="selectedAvatar = null; avatarPreview = resolveApiAsset(profile.avatarUrl)">ยกเลิกรูปใหม่</button>
							<p class="small text-secondary mt-2 mb-0">รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5MB</p>
						</div>
					</div>

					<form class="row g-3" @submit.prevent="saveProfile">
						<div class="col-md-6">
							<label class="form-label small fw-semibold" for="profile-first-name">ชื่อ <span class="text-danger">*</span></label>
							<input id="profile-first-name" v-model="profile.firstName" class="form-control" type="text" autocomplete="given-name" required />
						</div>
						<div class="col-md-6">
							<label class="form-label small fw-semibold" for="profile-last-name">นามสกุล <span class="text-danger">*</span></label>
							<input id="profile-last-name" v-model="profile.lastName" class="form-control" type="text" autocomplete="family-name" required />
						</div>
						<div class="col-md-6">
							<label class="form-label small fw-semibold" for="profile-phone">เบอร์โทรศัพท์</label>
							<input id="profile-phone" v-model="profile.phone" class="form-control" type="tel" autocomplete="tel" />
						</div>
						<div class="col-md-6">
							<label class="form-label small fw-semibold" for="profile-email">อีเมล</label>
							<input id="profile-email" v-model="profile.email" class="form-control" type="email" autocomplete="email" readonly />
						</div>
						<div class="col-12">
							<label class="form-label small fw-semibold" for="profile-address">ที่อยู่</label>
							<textarea id="profile-address" v-model="profile.address" class="form-control" rows="3" autocomplete="street-address"></textarea>
						</div>
						<div class="col-12 d-flex flex-wrap justify-content-end gap-2 border-top pt-3">
							  <button class="btn btn-outline-secondary" type="button" :disabled="savingProfile" @click="cancelProfileEdit">ยกเลิก</button>
							<button class="btn btn-danger" type="submit" :disabled="savingProfile">
								<span v-if="savingProfile" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
								{{ savingProfile ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
							</button>
						</div>
					</form>
				</section>

				<section v-else class="border rounded bg-white p-3 p-md-4" aria-labelledby="password-title">
					<div class="border-bottom pb-3 mb-4">
						<h1 id="password-title" class="h4 fw-bold mb-1">ความปลอดภัยและรหัสผ่าน</h1>
						<p class="small text-secondary mb-0">เปลี่ยนรหัสผ่านเพื่อรักษาความปลอดภัยของบัญชี</p>
					</div>
					<div v-if="passwordMessage" class="alert alert-success py-2" role="status">{{ passwordMessage }}</div>
					<div v-if="passwordError" class="alert alert-danger py-2" role="alert">{{ passwordError }}</div>
					<form class="row g-3" @submit.prevent="changePassword">
						<div class="col-12">
							<label class="form-label small fw-semibold" for="current-password">รหัสผ่านปัจจุบัน</label>
							<input id="current-password" v-model="passwordForm.currentPassword" class="form-control" type="password" autocomplete="current-password" required />
						</div>
						<div class="col-md-6">
							<label class="form-label small fw-semibold" for="new-password">รหัสผ่านใหม่</label>
							<input id="new-password" v-model="passwordForm.newPassword" class="form-control" type="password" autocomplete="new-password" minlength="6" required />
						</div>
						<div class="col-md-6">
							<label class="form-label small fw-semibold" for="confirm-new-password">ยืนยันรหัสผ่านใหม่</label>
							<input id="confirm-new-password" v-model="passwordForm.confirmPassword" class="form-control" type="password" autocomplete="new-password" minlength="6" required />
						</div>
						<div class="col-12 d-flex justify-content-end border-top pt-3">
							<button class="btn btn-danger" type="submit" :disabled="savingPassword">
								<span v-if="savingPassword" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
								{{ savingPassword ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน' }}
							</button>
						</div>
					</form>
				</section>
			</section>
		</div>
	</main>
</template>

<style scoped>
.profile-placeholder {
	width: 88px;
	height: 88px;
}
</style>