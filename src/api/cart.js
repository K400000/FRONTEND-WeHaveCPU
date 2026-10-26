import http from './http'

export async function getCart() {
  const response = await http.get('/api/cart')
  return response.data
}

export async function addCartItem(productId, quantity = 1) {
  const response = await http.post('/api/cart/items', { productId, quantity })
  return response.data
}

export async function updateCartItem(itemId, quantity) {
  const response = await http.put(`/api/cart/items/${itemId}`, { quantity })
  return response.data
}

export async function removeCartItem(itemId) {
  const response = await http.delete(`/api/cart/items/${itemId}`)
  return response.data
}