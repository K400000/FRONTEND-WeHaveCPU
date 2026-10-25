<template>
  <main class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <p class="text-secondary mb-1">We Have CPU / อุปกรณ์คอมพิวเตอร์</p>
        <h1 class="h3 mb-0">สินค้าแนะนำ</h1>
      </div>
      <div class="d-flex gap-2">
        <input class="form-control" type="search" placeholder="ค้นหาสินค้า" aria-label="ค้นหาสินค้า" />
        <button class="btn btn-dark text-nowrap" type="button">ค้นหา</button>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-sm-6 col-lg-4">
        <article class="border rounded p-3 h-100 d-flex flex-column">
          <div class="bg-body-secondary rounded d-flex align-items-center justify-content-center mb-3" style="height: 150px"><span class="text-secondary">รูปสินค้า</span></div>
          <p class="small text-secondary mb-1">CPU / Intel</p><h2 class="h6">Intel Core i5 รุ่นตัวอย่าง</h2>
          <p class="fw-semibold mt-auto mb-3">฿6,490</p><button class="btn btn-outline-dark" type="button">ดูรายละเอียด</button>
        </article>
      </div>
      <div class="col-sm-6 col-lg-4">
        <article class="border rounded p-3 h-100 d-flex flex-column">
          <div class="bg-body-secondary rounded d-flex align-items-center justify-content-center mb-3" style="height: 150px"><span class="text-secondary">รูปสินค้า</span></div>
          <p class="small text-secondary mb-1">การ์ดจอ / NVIDIA</p><h2 class="h6">GeForce RTX รุ่นตัวอย่าง</h2>
          <p class="fw-semibold mt-auto mb-3">฿18,900</p><button class="btn btn-outline-dark" type="button">ดูรายละเอียด</button>
        </article>
      </div>
      <div class="col-sm-6 col-lg-4">
        <article class="border rounded p-3 h-100 d-flex flex-column">
          <div class="bg-body-secondary rounded d-flex align-items-center justify-content-center mb-3" style="height: 150px"><span class="text-secondary">รูปสินค้า</span></div>
          <p class="small text-secondary mb-1">หน่วยความจำ / Kingston</p><h2 class="h6">DDR5 32GB รุ่นตัวอย่าง</h2>
          <p class="fw-semibold mt-auto mb-3">฿3,290</p><button class="btn btn-outline-dark" type="button">ดูรายละเอียด</button>
        </article>
      </div>
    </div>
    <p class="small text-secondary mt-3 mb-0">รายการและราคาเป็นข้อมูลตัวอย่าง ไม่ได้โหลดจากระบบจริง</p>
  </main>
</template>
