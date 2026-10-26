import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '../api/http'

async function requestCurrentUser() {
	const response = await http.get('/api/auth/me')
	return response.data
}

export async function hasAuthSession() {
	try {
		await requestCurrentUser()
		return true
	} catch {
		return false
	}
}

export const useAuthStore = defineStore('auth', () => {
	const user = ref(null)
	const isAuthenticated = ref(false)
	const isInitialized = ref(false)

	async function refreshSession() {
		try {
			user.value = await requestCurrentUser()
			isAuthenticated.value = true
			return user.value
		} catch {
			user.value = null
			isAuthenticated.value = false
			return null
		} finally {
			isInitialized.value = true
		}
	}

	async function login(credentials) {
		const response = await http.post('/api/auth/login', credentials)
		user.value = response.data.user
		isAuthenticated.value = true
		isInitialized.value = true
		return user.value
	}

	async function register(userDetails) {
		const response = await http.post('/api/auth/register', userDetails)
		user.value = response.data.user
		isAuthenticated.value = true
		isInitialized.value = true
		return user.value
	}

	async function logout() {
		try {
			await http.post('/api/auth/logout')
		} finally {
			user.value = null
			isAuthenticated.value = false
			isInitialized.value = true
		}
	}

	return { user, isAuthenticated, isInitialized, refreshSession, login, register, logout }
})
