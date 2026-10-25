export function formatPrice(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return '-'

  return amount.toLocaleString('th-TH', {
    maximumFractionDigits: 2,
  })
}

export function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(date)
}