// import { defineStore } from "pinia";
// import {ref} from "vue"
import { defineStore } from 'pinia'
import { ref } from 'vue'

const tokenKeys = ['access_token', 'accessToken', 'auth_token', 'token']
const sessionKeys = ['auth_session', 'session_id', 'session']

function getStorages() {
	if (typeof window === 'undefined') return []
	return [window.localStorage, window.sessionStorage]
}

function hasStoredSession() {
	return getStorages().some((storage) =>
		[...tokenKeys, ...sessionKeys].some((key) => {
			const value = storage.getItem(key)?.trim()
			return value && !['false', 'null', 'undefined'].includes(value)
		}),
	)
}

function clearStoredSession() {
	for (const storage of getStorages()) {
		for (const key of [...tokenKeys, ...sessionKeys]) storage.removeItem(key)
	}
}

export function hasAuthSession() {
	return hasStoredSession()
}

export const useAuthStore = defineStore('auth', () => {
	const isAuthenticated = ref(hasStoredSession())

	function refreshSession() {
		isAuthenticated.value = hasStoredSession()
	}

	function logout() {
		clearStoredSession()
		isAuthenticated.value = false
	}

	return { isAuthenticated, refreshSession, logout }
})
// // สร้าง Composition Function เพื่อสร้าง Store เพื่อเก็บ State
// export const useAuthStore = defineStore( 'auth',()=>{
//     // สร้างตัวแปรที่ต้องการสื่อสาร
//     const isLogin =ref(false)
//     // สร้าง Action เพื่อเปลี่ยนแปลงสถานะของตัวแปรนั้นๆ
//     const login=()=>{
//         isLogin.value=true
//         console.log(isLogin.value)
//     }
//     const logout=()=>{
//         isLogin.value=false
//         console.log(isLogin.value)
//     }


//     // ส่งออกState และ Action เพื่อให้ Component อื่นใช้งาน
//     return {isLogin,login,logout }
// })
