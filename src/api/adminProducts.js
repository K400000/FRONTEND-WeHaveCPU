import http from './http'

export async function getAdminProduct(productId) {
  const response = await http.get(`/api/products/${productId}`)
  return response.data
}

export async function updateProduct(productId, payload) {
  const response = await http.put(`/api/products/${productId}`, payload)
  return response.data
}

export async function deleteProduct(productId) {
  const response = await http.delete(`/api/products/${productId}`)
  return response.data
}

export async function uploadProductImages(productId, files) {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))
  const response = await http.post(`/api/products/${productId}/images`, formData)
  return response.data
}

export async function setPrimaryProductImage(productId, imageId) {
  const response = await http.patch(`/api/products/${productId}/images/${imageId}/primary`)
  return response.data
}
