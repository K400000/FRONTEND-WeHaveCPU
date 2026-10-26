import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { addCartItem, getCart, removeCartItem, updateCartItem } from '../api/cart'
import { resolveApiAsset } from '../api/catalog'

const emptyCart = () => ({ orderId: null, items: [], totalQty: 0, totalAmount: 0 })

export function shouldRedirectToCart(errorMessage = '') {
	return errorMessage.toLowerCase().includes('inconsistent types deduced for parameter $1')
}

export const useCartStore = defineStore('cart', () => {
	const cart = ref(emptyCart())
	const loading = ref(false)
	const errorMessage = ref('')
	const itemCount = computed(() => Number(cart.value.totalQty) || 0)

	async function refreshCart() {
		loading.value = true
		errorMessage.value = ''
		try {
			const response = await getCart()
			cart.value = {
				...response,
				items: (response.items || []).map((item) => ({
					...item,
					imageUrl: resolveApiAsset(item.imageUrl),
				})),
			}
			return true
		} catch (error) {
			errorMessage.value = error.response?.data?.message || 'โหลดตะกร้าสินค้าไม่สำเร็จ'
			return false
		} finally {
			loading.value = false
		}
	}

	async function addItem(productId, quantity = 1) {
		errorMessage.value = ''
		try {
			await addCartItem(productId, quantity)
			return await refreshCart()
		} catch (error) {
			errorMessage.value = error.response?.data?.message || 'เพิ่มสินค้าในตะกร้าไม่สำเร็จ'
			return false
		}
	}

	async function setItemQuantity(itemId, quantity) {
		errorMessage.value = ''
		try {
			await updateCartItem(itemId, quantity)
			return await refreshCart()
		} catch (error) {
			errorMessage.value = error.response?.data?.message || 'เปลี่ยนจำนวนสินค้าไม่สำเร็จ'
			return false
		}
	}

	async function deleteItem(itemId) {
		errorMessage.value = ''
		try {
			await removeCartItem(itemId)
			return await refreshCart()
		} catch (error) {
			errorMessage.value = error.response?.data?.message || 'นำสินค้าออกจากตะกร้าไม่สำเร็จ'
			return false
		}
	}

	async function clearCart() {
		loading.value = true
		errorMessage.value = ''
		try {
			for (const item of cart.value.items) await removeCartItem(item.orderItemId)
			return await refreshCart()
		} catch (error) {
			errorMessage.value = error.response?.data?.message || 'ลบสินค้าในตะกร้าไม่สำเร็จ'
			await refreshCart()
			return false
		} finally {
			loading.value = false
		}
	}

	function resetCart() {
		cart.value = emptyCart()
		errorMessage.value = ''
		loading.value = false
	}

	return { cart, itemCount, loading, errorMessage, refreshCart, addItem, setItemQuantity, deleteItem, clearCart, resetCart }
})
