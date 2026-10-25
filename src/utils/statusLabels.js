export const orderStatusLabels = {
  cart: { label: 'ในตะกร้า', variant: 'secondary' },
  pending: { label: 'รอชำระเงิน', variant: 'warning' },
  paid: { label: 'ชำระเงินแล้ว (รอจัดส่ง)', variant: 'info' },
  shipped: { label: 'กำลังจัดส่ง', variant: 'primary' },
  completed: { label: 'สำเร็จ', variant: 'success' },
  cancelled: { label: 'ยกเลิก', variant: 'danger' },
}

export const cancelReasonLabels = {
  payment_timeout: 'หมดเวลาชำระเงิน',
  admin: 'ร้านยกเลิก',
}

export const shipmentStatusLabels = {
  preparing: { label: 'ร้านกำลังจัดเตรียมพัสดุ', variant: 'warning' },
  shipped: { label: 'ส่งมอบขนส่งแล้ว', variant: 'primary' },
  in_transit: { label: 'กำลังขนส่ง', variant: 'info' },
  out_for_delivery: { label: 'กำลังนำจ่าย', variant: 'info' },
  delivered: { label: 'จัดส่งสำเร็จ', variant: 'success' },
}

export const userStatusLabels = {
  active: { label: 'ใช้งานปกติ', variant: 'success' },
  suspended: { label: 'ระงับชั่วคราว', variant: 'warning' },
  banned: { label: 'ถูกแบน', variant: 'danger' },
}

export const roleLabels = {
  member: { label: 'ลูกค้า', variant: 'secondary' },
  admin: { label: 'ผู้ดูแล', variant: 'dark' },
}

export function getStatusDisplay(status) {
  return (
    orderStatusLabels[status] ??
    shipmentStatusLabels[status] ??
    userStatusLabels[status] ??
    roleLabels[status] ?? { label: status || 'ไม่ระบุ', variant: 'secondary' }
  )
}