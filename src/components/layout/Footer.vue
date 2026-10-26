<template>
  <footer class="border-top bg-light">
    <div class="container py-4">
      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
        <section class="col">
          <h2 class="h6 fw-bold">We Have CPU</h2>
          <p class="small text-secondary mb-0">ร้านจำหน่ายอุปกรณ์คอมพิวเตอร์และสินค้าไอที</p>
        </section>
        <section class="col">
          <h2 class="h6 fw-bold">บริการลูกค้า</h2>
          <RouterLink class="d-block small link-secondary text-decoration-none mb-2" to="/user/orders">Order ของฉัน</RouterLink>
          <RouterLink class="d-block small link-secondary text-decoration-none" to="/user/profile">บัญชีของฉัน</RouterLink>
        </section>
        <section class="col">
          <h2 class="h6 fw-bold">เลือกซื้อสินค้า</h2>
          <RouterLink class="d-block small link-secondary text-decoration-none mb-2" to="/user/goods">สินค้าทั้งหมด</RouterLink>
          <RouterLink class="d-block small link-secondary text-decoration-none" to="/user/goods/recommended">สินค้าแนะนำ</RouterLink>
        </section>
        <section class="col">
          <h2 class="h6 fw-bold">การชำระเงิน</h2>
          <RouterLink class="d-block small link-secondary text-decoration-none" to="/user/payment">ดูขั้นตอนชำระเงิน</RouterLink>
        </section>
      </div>
      <div class="d-flex flex-wrap justify-content-between gap-2 border-top mt-4 pt-3 small text-secondary">
        <span>© 2026 We Have CPU</span>
        <span>สงวนลิขสิทธิ์</span>
      </div>
    </div>
  </footer>
</template>