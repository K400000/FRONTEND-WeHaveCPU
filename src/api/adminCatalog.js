import http from './http'

// หมวดหมู่ (รายการทั้งหมดใช้ getCategories ใน catalog.js)
export async function createCategory(payload) {
  const response = await http.post('/api/categories', payload)
  return response.data
}

export async function getCategoryById(categoryId) {
  const response = await http.get(`/api/categories/${categoryId}`)
  return response.data.category ?? response.data
}

export async function updateCategory(categoryId, payload) {
  const response = await http.put(`/api/categories/${categoryId}`, payload)
  return response.data
}

export async function deleteCategory(categoryId) {
  const response = await http.delete(`/api/categories/${categoryId}`)
  return response.data
}

// แบรนด์ (รายการทั้งหมดใช้ getBrands ใน catalog.js) — สร้าง/แก้ไขส่งเป็น multipart: name, logo
export async function createBrand(formData) {
  const response = await http.post('/api/categories/brands', formData)
  return response.data
}

export async function getBrandById(brandId) {
  const response = await http.get(`/api/categories/brands/${brandId}`)
  return response.data.brand ?? response.data
}

export async function updateBrand(brandId, formData) {
  const response = await http.put(`/api/categories/brands/${brandId}`, formData)
  return response.data
}

export async function deleteBrand(brandId) {
  const response = await http.delete(`/api/categories/brands/${brandId}`)
  return response.data
}
