import http from './http'
import { resolveApiAsset } from './catalog'

// ลำดับสถานะพัสดุที่ต้องเลื่อนทีละขั้น: (ยังไม่มีพัสดุ) -> preparing -> shipped -> in_transit -> out_for_delivery -> delivered
export const shipmentFlow = ['preparing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered']

// คืนค่าขั้นถัดไป หรือ null ถ้าเลื่อนไม่ได้
export function getNextShipmentStatus(orderStatus, shipmentStatus) {
  if (orderStatus === 'cancelled' || orderStatus === 'pending' || orderStatus === 'cart' || orderStatus === 'completed') return null
  if (!shipmentStatus) return orderStatus === 'paid' ? shipmentFlow[0] : null
  const index = shipmentFlow.indexOf(shipmentStatus)
  return index >= 0 && index < shipmentFlow.length - 1 ? shipmentFlow[index + 1] : null
}

// swagger ไม่ระบุ shape ของ response ฝั่ง admin จึงรองรับทั้งแบบ customer/user ซ้อน และแบบ field แบนราบ
function normalizeCustomer(order) {
  const nested = order.customer ?? order.user ?? {}
  const firstName = nested.firstName ?? order.firstName ?? ''
  const lastName = nested.lastName ?? order.lastName ?? ''
  const name = [firstName, lastName].filter(Boolean).join(' ') || nested.name || order.customerName || order.userName || ''
  return {
    userId: nested.userId ?? order.userId ?? null,
    name,
    email: nested.email ?? order.email ?? order.customerEmail ?? '',
    phone: nested.phone ?? order.phone ?? '',
  }
}

export function normalizeAdminOrder(order) {
  const shipment = order.shipment ?? null
  return {
    ...order,
    orderId: order.orderId,
    orderNo: order.orderNo,
    status: order.status,
    shipmentStatus: shipment?.status ?? order.shipmentStatus ?? null,
    courier: shipment?.courier ?? order.courier ?? '',
    trackingNo: shipment?.trackingNo ?? order.trackingNo ?? '',
    totalAmount: Number(order.totalAmount) || 0,
    placedAt: order.confirmedAt ?? order.createdAt,
    customer: normalizeCustomer(order),
    items: (order.items || []).map((item) => ({ ...item, imageUrl: resolveApiAsset(item.imageUrl) })),
    events: shipment?.events ?? order.timeline ?? order.events ?? [],
  }
}

function normalizeList(body) {
  const items = Array.isArray(body) ? body : body?.data ?? body?.orders ?? body?.items ?? []
  const meta = body?.pagination ?? body ?? {}
  const page = Number(meta.page ?? meta.currentPage) || 1
  const limit = Number(meta.limit) || items.length || 1
  const total = Number(meta.total ?? meta.totalItems ?? items.length) || 0
  const totalPages = Number(meta.totalPages) || Math.max(1, Math.ceil(total / limit))
  return { items: items.map(normalizeAdminOrder), pagination: { page, limit, total, totalPages } }
}

export async function getAdminOrders(params = {}) {
  const response = await http.get('/api/orders/admin', { params })
  return normalizeList(response.data)
}

export async function getAdminOrderById(orderId) {
  const response = await http.get(`/api/orders/admin/${orderId}`)
  return normalizeAdminOrder(response.data.order ?? response.data)
}

export async function advanceShipment(orderId, payload) {
  const response = await http.patch(`/api/orders/admin/${orderId}/shipment`, payload)
  return response.data
}

// swagger ไม่มี endpoint กรองตามผู้ใช้ จึงดึงทุกหน้า (limit สูงสุด 100) แล้วกรองฝั่งหน้าเว็บ
export async function getOrdersOfCustomer(customer, { maxPages = 20 } = {}) {
  const matched = []
  let page = 1
  let totalPages = 1
  do {
    const result = await getAdminOrders({ page, limit: 100 })
    totalPages = result.pagination.totalPages
    result.items.forEach((order) => {
      const sameId = customer.userId != null && order.customer.userId === customer.userId
      const sameEmail = !customer.userId && customer.email && order.customer.email === customer.email
      if (sameId || sameEmail) matched.push(order)
    })
    page += 1
  } while (page <= totalPages && page <= maxPages)
  return { orders: matched, truncated: totalPages > maxPages }
}
