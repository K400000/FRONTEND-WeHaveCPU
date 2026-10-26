import http from './http'

const apiOrigin = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || window.location.origin

export async function getPublicProducts(params = {}) {
  const response = await http.get('/api/products', { params })
  return response.data
}

export async function getCategories() {
  const response = await http.get('/api/categories')
  return response.data
}

export async function getBrands() {
  const response = await http.get('/api/categories/brands/all')
  return response.data
}

function normalizeSpecs(specs) {
  let value = specs

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return value ? [value] : []
    }
  }

  if (Array.isArray(value)) return value.map(String)
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, item]) => item !== null && item !== '')
      .map(([key, item]) => `${key}: ${item}`)
  }

  return []
}

function resolveProductImage(imageUrl) {
  if (!imageUrl) return ''

  try {
    return new URL(imageUrl, apiOrigin).toString()
  } catch {
    return imageUrl
  }
}

export function mapCatalogProduct(product) {
  const stockCount = Number(product.stock) || 0

  return {
    id: product.productId,
    sku: product.sku,
    categoryId: product.categoryId,
    category: product.categoryName,
    brandId: product.brandId,
    brand: product.brandName || 'ไม่ระบุแบรนด์',
    brandLogo: resolveProductImage(product.brandLogoUrl),
    name: product.name,
    description: product.description || '',
    image: resolveProductImage(product.primaryImage),
    price: Number(product.price) || 0,
    stockCount,
    stock: stockCount > 0 ? 'พร้อมจัดส่ง' : 'สินค้าหมด',
    specs: normalizeSpecs(product.specs),
  }
}