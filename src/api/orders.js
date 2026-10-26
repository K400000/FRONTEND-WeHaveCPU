import http from './http'
import { resolveApiAsset } from './catalog'

export async function getMyOrders() {
  const response = await http.get('/api/orders')
  return response.data.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      imageUrl: resolveApiAsset(item.imageUrl),
    })),
  }))
}

export async function getMyOrderById(orderId) {
  const response = await http.get(`/api/orders/${orderId}`)
  const order = response.data
  return {
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      imageUrl: resolveApiAsset(item.imageUrl),
    })),
    shipment: order.shipment
      ? {
          ...order.shipment,
          events: order.shipment.events || [],
        }
      : null,
  }
}

export async function getMyOrderTracking(orderId) {
  const response = await http.get(`/api/orders/${orderId}/tracking`)
  return response.data
}

export async function checkoutOrder(shippingDetails) {
  const response = await http.post('/api/orders/checkout', shippingDetails)
  return response.data
}

export async function payOrder(orderId) {
  const response = await http.post(`/api/orders/${orderId}/pay`)
  return response.data
}

export async function cancelOrder(orderId) {
  const response = await http.post(`/api/orders/${orderId}/cancel`, {})
  return response.data
}