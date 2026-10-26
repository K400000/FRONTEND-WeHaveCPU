<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getDashboardCharts, getDashboardSummary } from '../../api/dashboard'
import { formatPrice } from '../../utils/formatters'
import { orderStatusLabels } from '../../utils/statusLabels'

const periods = [
  { value: 'day', label: 'รายวัน', hint: '30 วันล่าสุด' },
  { value: 'month', label: 'รายเดือน', hint: '12 เดือนล่าสุด' },
  { value: 'year', label: 'รายปี', hint: '5 ปีล่าสุด' },
]
const cards = [
  { key: 'today', label: 'วันนี้', icon: 'bi-calendar-day' },
  { key: 'month', label: 'เดือนนี้', icon: 'bi-calendar-month' },
  { key: 'year', label: 'ปีนี้', icon: 'bi-calendar3' },
  { key: 'allTime', label: 'ทั้งหมด', icon: 'bi-bar-chart-line' },
]

const summary = ref(null)
const overview = ref(null)
const statusOrder = ['pending', 'paid', 'shipped', 'completed', 'cancelled']
const summaryLoading = ref(true)
const summaryError = ref('')
const period = ref('day')
const points = ref([])
const chartLoading = ref(true)
const chartError = ref('')
const hovered = ref(null)

const periodHint = computed(() => periods.find((item) => item.value === period.value)?.hint)

async function loadSummary() {
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const data = await getDashboardSummary()
    summary.value = data.summary
    overview.value = data.overview
  } catch (error) {
    summaryError.value = error.response?.data?.message || 'โหลดข้อมูลสรุปไม่สำเร็จ'
  } finally {
    summaryLoading.value = false
  }
}

async function loadChart() {
  chartLoading.value = true
  chartError.value = ''
  hovered.value = null
  try {
    points.value = await getDashboardCharts(period.value)
  } catch (error) {
    chartError.value = error.response?.data?.message || 'โหลดข้อมูลกราฟไม่สำเร็จ'
    points.value = []
  } finally {
    chartLoading.value = false
  }
}

// พื้นที่วาดกราฟ SVG
const W = 800
const H = 280
const pad = { top: 20, right: 20, bottom: 32, left: 64 }

const maxRevenue = computed(() => {
  const max = Math.max(0, ...points.value.map((point) => Number(point.revenue) || 0))
  return max || 1
})

const coords = computed(() => {
  const count = points.value.length
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  return points.value.map((point, index) => ({
    ...point,
    x: pad.left + (count > 1 ? (innerW * index) / (count - 1) : innerW / 2),
    y: pad.top + innerH - ((Number(point.revenue) || 0) / maxRevenue.value) * innerH,
  }))
})

const linePath = computed(() => coords.value.map((c, i) => `${i ? 'L' : 'M'}${c.x},${c.y}`).join(' '))
const areaPath = computed(() => {
  if (!coords.value.length) return ''
  const base = H - pad.bottom
  return `${linePath.value} L${coords.value.at(-1).x},${base} L${coords.value[0].x},${base} Z`
})
const gridLines = computed(() => {
  const innerH = H - pad.top - pad.bottom
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: pad.top + innerH - ratio * innerH,
    label: formatPrice(Math.round(maxRevenue.value * ratio)),
  }))
})
const labelStep = computed(() => Math.max(1, Math.ceil(coords.value.length / 8)))

watch(period, loadChart)
onMounted(() => {
  loadSummary()
  loadChart()
})
</script>

<template>
  <main class="container py-4">
    <nav class="d-flex align-items-center gap-2 small text-secondary mb-3" aria-label="เส้นทางนำทาง">
      <span>หลังร้าน</span>
      <span aria-hidden="true">›</span>
      <span class="text-danger" aria-current="page">แดชบอร์ดภาพรวม</span>
    </nav>

    <header class="mb-4">
      <h1 class="h3 fw-bold mb-1">แดชบอร์ดภาพรวมและสถิติร้านค้า</h1>
      <p class="small text-secondary mb-0">สรุปจำนวนคำสั่งซื้อและยอดขายของร้าน We Have CPU</p>
    </header>

    <div v-if="summaryError" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{{ summaryError }}</span>
      <button class="btn btn-sm btn-outline-danger" type="button" @click="loadSummary">ลองอีกครั้ง</button>
    </div>

    <section class="row g-3 mb-4" aria-label="สรุปยอดขาย">
      <div v-for="card in cards" :key="card.key" class="col-6 col-lg-3">
        <div class="border rounded bg-white p-3 h-100">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="small text-secondary">ยอดขาย{{ card.label }}</span>
            <i class="bi text-danger" :class="card.icon" aria-hidden="true"></i>
          </div>
          <div v-if="summaryLoading" class="placeholder-glow" role="status">
            <span class="placeholder col-8 mb-2 d-block"></span>
            <span class="placeholder col-5 d-block"></span>
            <span class="visually-hidden">กำลังโหลด</span>
          </div>
          <template v-else-if="summary?.[card.key]">
            <div class="fs-4 fw-bold">฿{{ formatPrice(summary[card.key].revenue) }}</div>
            <div class="small text-secondary">{{ formatPrice(summary[card.key].orderCount) }} รายการสั่งซื้อ</div>
          </template>
          <div v-else-if="!summaryError" class="small text-secondary">ไม่พบข้อมูล</div>
          <div v-else class="small text-secondary">-</div>
        </div>
      </div>
    </section>

    <section class="row g-3 mb-4" aria-label="ภาพรวมร้านค้า">
      <div class="col-12 col-lg-7">
        <div class="border rounded bg-white p-3 h-100">
          <h2 class="h6 fw-bold mb-3">คำสั่งซื้อตามสถานะ</h2>
          <div v-if="summaryLoading" class="placeholder-glow"><span class="placeholder col-12 d-block"></span></div>
          <div v-else-if="overview" class="d-flex flex-wrap gap-2">
            <div v-for="status in statusOrder" :key="status" class="border rounded px-3 py-2 flex-fill text-center">
              <span class="badge mb-1" :class="`text-bg-${orderStatusLabels[status].variant}`">{{ orderStatusLabels[status].label }}</span>
              <div class="fs-5 fw-bold">{{ formatPrice(overview.ordersByStatus[status] ?? 0) }}</div>
            </div>
          </div>
          <div v-else class="small text-secondary">ไม่พบข้อมูล</div>
        </div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="border rounded bg-white p-3 h-100">
          <h2 class="h6 fw-bold mb-3">สมาชิกและสินค้า</h2>
          <div v-if="summaryLoading" class="placeholder-glow"><span class="placeholder col-12 d-block"></span></div>
          <dl v-else-if="overview" class="row mb-0 small">
            <dt class="col-8 fw-normal text-secondary">สมาชิกทั้งหมด</dt><dd class="col-4 text-end fw-semibold">{{ formatPrice(overview.totalUsers) }}</dd>
            <dt class="col-8 fw-normal text-secondary">สมาชิกที่ใช้งานอยู่</dt><dd class="col-4 text-end fw-semibold">{{ formatPrice(overview.activeUsers) }}</dd>
            <dt class="col-8 fw-normal text-secondary">สินค้าทั้งหมด</dt><dd class="col-4 text-end fw-semibold">{{ formatPrice(overview.totalProducts) }}</dd>
            <dt class="col-8 fw-normal text-secondary">สินค้าหมดสต็อก</dt><dd class="col-4 text-end fw-semibold" :class="{ 'text-danger': overview.outOfStockProducts > 0 }">{{ formatPrice(overview.outOfStockProducts) }}</dd>
          </dl>
          <div v-else class="small text-secondary">ไม่พบข้อมูล</div>
        </div>
      </div>
    </section>

    <section class="border rounded bg-white p-3 p-md-4 mb-4" aria-labelledby="chart-title">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 id="chart-title" class="h5 fw-bold mb-1"><span class="d-inline-block bg-danger me-2 title-mark"></span>กราฟสถิติยอดขาย</h2>
          <p class="small text-secondary mb-0">ยอดขายย้อนหลัง {{ periodHint }}</p>
        </div>
        <div class="btn-group btn-group-sm" role="group" aria-label="เลือกช่วงเวลา">
          <button v-for="item in periods" :key="item.value" type="button" class="btn" :class="period === item.value ? 'btn-danger' : 'btn-outline-secondary'" :aria-pressed="period === item.value" @click="period = item.value">{{ item.label }}</button>
        </div>
      </div>

      <div v-if="chartLoading" class="d-flex justify-content-center py-5" role="status">
        <span class="spinner-border text-danger" aria-hidden="true"></span>
        <span class="visually-hidden">กำลังโหลดกราฟ</span>
      </div>
      <div v-else-if="chartError" class="alert alert-danger d-flex justify-content-between align-items-center mb-0" role="alert">
        <span>{{ chartError }}</span>
        <button class="btn btn-sm btn-outline-danger" type="button" @click="loadChart">ลองอีกครั้ง</button>
      </div>
      <div v-else-if="!points.length" class="text-center text-secondary py-5">ไม่พบข้อมูล</div>

      <template v-else>
        <div class="position-relative">
          <svg :viewBox="`0 0 ${W} ${H}`" class="w-100 chart-svg" role="img" :aria-label="`กราฟยอดขาย ${periodHint}`" @mouseleave="hovered = null">
            <g v-for="line in gridLines" :key="line.y">
              <line :x1="pad.left" :x2="W - pad.right" :y1="line.y" :y2="line.y" stroke="#E5E7EB" stroke-dasharray="3 3" />
              <text :x="pad.left - 8" :y="line.y + 4" text-anchor="end" font-size="11" fill="#6B7280">{{ line.label }}</text>
            </g>
            <path :d="areaPath" fill="#DC2626" fill-opacity="0.08" />
            <path :d="linePath" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linejoin="round" />
            <g v-for="(c, i) in coords" :key="i">
              <text v-if="i % labelStep === 0 || i === coords.length - 1" :x="c.x" :y="H - 10" text-anchor="middle" font-size="11" fill="#6B7280">{{ c.label }}</text>
              <circle :cx="c.x" :cy="c.y" :r="hovered === i ? 6 : 4" fill="#fff" stroke="#DC2626" stroke-width="2" />
              <circle :cx="c.x" :cy="c.y" r="14" fill="transparent" tabindex="0" :aria-label="`${c.label} ยอดขาย ${formatPrice(c.revenue)} บาท`" @mouseenter="hovered = i" @focus="hovered = i" @blur="hovered = null" />
            </g>
          </svg>
          <div v-if="hovered !== null" class="chart-tip bg-dark text-white rounded small px-2 py-1" :style="{ left: `${(coords[hovered].x / W) * 100}%`, top: `${(coords[hovered].y / H) * 100}%` }">
            <div>{{ coords[hovered].label }}</div>
            <div class="fw-bold">฿{{ formatPrice(coords[hovered].revenue) }}</div>
            <div>{{ formatPrice(coords[hovered].orderCount) }} รายการ</div>
          </div>
        </div>

        <div class="table-responsive mt-3">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light">
              <tr><th scope="col">ช่วงเวลา</th><th scope="col" class="text-end">จำนวนคำสั่งซื้อ</th><th scope="col" class="text-end">ยอดขาย (บาท)</th></tr>
            </thead>
            <tbody>
              <tr v-for="point in [...points].reverse()" :key="point.rawLabel">
                <td>{{ point.label }}</td>
                <td class="text-end">{{ formatPrice(point.orderCount) }}</td>
                <td class="text-end fw-semibold">{{ formatPrice(point.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.title-mark {
  width: 10px;
  height: 10px;
}

.chart-svg {
  max-height: 320px;
}

.chart-tip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 12px));
  pointer-events: none;
  white-space: nowrap;
}
</style>
