<template>
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-sm-9 col-md-6 col-lg-4">
        <section class="border rounded p-4">
          <p class="text-secondary mb-1">We Have CPU</p>
          <h1 class="h3 mb-4">เข้าสู่ระบบ</h1>
          <form>
            <div class="mb-3">
              <label class="form-label" for="mock-email">อีเมล</label>
              <input id="mock-email" class="form-control" type="email" placeholder="name@example.com" />
            </div>
            <div class="mb-3">
              <label class="form-label" for="mock-password">รหัสผ่าน</label>
              <input id="mock-password" class="form-control" type="password" placeholder="รหัสผ่าน" />
            </div>
            <button class="btn btn-dark w-100" type="button">เข้าสู่ระบบ (ตัวอย่าง)</button>
          </form>
          <div class="d-flex justify-content-between mt-3">
            <a href="#register">สมัครสมาชิก</a>
            <a href="#forgot-password">ลืมรหัสผ่าน</a>
          </div>
          <p class="small text-secondary mt-3 mb-0">หน้าจำลอง ยังไม่ส่งข้อมูลหรือเชื่อมต่อระบบ</p>
        </section>
      </div>
    </div>
  </main>
</template>
