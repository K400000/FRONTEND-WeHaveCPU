<template>
  <main class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <p class="text-secondary mb-1">We Have CPU / ผู้ดูแลระบบ</p>
        <h1 class="h3 mb-0">ภาพรวมร้านค้า</h1>
      </div>
      <button class="btn btn-outline-secondary" type="button">จัดการสินค้า</button>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3"><section class="border rounded p-3 h-100"><p class="text-secondary mb-2">คำสั่งซื้อวันนี้</p><p class="fs-4 fw-semibold mb-0">12 รายการ</p></section></div>
      <div class="col-sm-6 col-xl-3"><section class="border rounded p-3 h-100"><p class="text-secondary mb-2">ยอดขายวันนี้</p><p class="fs-4 fw-semibold mb-0">฿84,500</p></section></div>
      <div class="col-sm-6 col-xl-3"><section class="border rounded p-3 h-100"><p class="text-secondary mb-2">สินค้าในร้าน</p><p class="fs-4 fw-semibold mb-0">128 รายการ</p></section></div>
      <div class="col-sm-6 col-xl-3"><section class="border rounded p-3 h-100"><p class="text-secondary mb-2">สมาชิก</p><p class="fs-4 fw-semibold mb-0">560 คน</p></section></div>
    </div>

    <section class="border rounded p-3">
      <h2 class="h5">คำสั่งซื้อล่าสุด</h2>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead><tr><th>เลขที่บิล</th><th>ผู้สั่งซื้อ</th><th>ยอดรวม</th><th>สถานะ</th></tr></thead>
          <tbody>
            <tr><td>ORD-DEMO-001</td><td>ลูกค้าตัวอย่าง</td><td>฿24,900</td><td><span class="badge text-bg-warning">รอชำระเงิน</span></td></tr>
            <tr><td>ORD-DEMO-002</td><td>ลูกค้าตัวอย่าง</td><td>฿8,490</td><td><span class="badge text-bg-info">ชำระเงินแล้ว</span></td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <p class="small text-secondary mt-3 mb-0">ข้อมูลทั้งหมดเป็นตัวอย่าง ยังไม่เชื่อมต่อระบบจริง</p>
  </main>
</template>
