import http from './http'

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// label จาก API: day = YYYY-MM-DD, month = YYYY-MM, year = YYYY (ถ้ารูปแบบไม่ตรงจะแสดงตามที่ได้)
function formatChartLabel(label, period) {
  const text = String(label ?? '')
  const parts = text.split('-').map(Number)
  if (period === 'day' && parts.length === 3 && parts.every(Number.isFinite)) return `${parts[2]} ${thaiMonths[parts[1] - 1]}`
  if (period === 'month' && parts.length === 2 && parts.every(Number.isFinite)) return `${thaiMonths[parts[1] - 1]} ${String(parts[0] + 543).slice(-2)}`
  if (period === 'year' && parts.length === 1 && Number.isFinite(parts[0])) return String(parts[0] + 543)
  return text
}

function toTotals(block) {
  return { orderCount: Number(block?.orders) || 0, revenue: Number(block?.sales) || 0 }
}

// รูปแบบที่หน้าจอใช้: { today|month|year|allTime: { orderCount, revenue } }
function normalizeSummary(summary = {}) {
  return {
    today: toTotals(summary.today),
    month: toTotals(summary.thisMonth),
    year: toTotals(summary.thisYear),
    allTime: toTotals(summary.allTime),
  }
}

function normalizeOverview(overview = {}) {
  return {
    totalUsers: Number(overview.totalUsers) || 0,
    activeUsers: Number(overview.activeUsers) || 0,
    totalProducts: Number(overview.totalProducts) || 0,
    outOfStockProducts: Number(overview.outOfStockProducts) || 0,
    ordersByStatus: overview.ordersByStatus || {},
  }
}

// รูปแบบที่หน้าจอใช้: [{ label, rawLabel, revenue, orderCount }]
function normalizeCharts(body, period) {
  return (body?.data || []).map((point) => ({
    label: formatChartLabel(point.label, period),
    rawLabel: point.label,
    revenue: Number(point.sales) || 0,
    orderCount: Number(point.orders) || 0,
  }))
}

export async function getDashboardSummary() {
  const response = await http.get('/api/dashboard/summary')
  return {
    summary: normalizeSummary(response.data.summary),
    overview: normalizeOverview(response.data.overview),
  }
}

export async function getDashboardCharts(period = 'day') {
  const response = await http.get('/api/dashboard/charts', { params: { period } })
  return normalizeCharts(response.data, period)
}
