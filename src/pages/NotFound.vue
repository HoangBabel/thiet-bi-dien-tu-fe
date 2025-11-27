<template>
  <div class="container text-center mt-5">
    <h1 class="display-3 text-danger fw-bold">404</h1>
    <h4 class="mb-3">Trang bạn tìm không tồn tại</h4>
    <p class="text-muted mb-4">
      Có thể liên kết đã sai hoặc trang này đã bị xóa.
    </p>
    <router-link to="/" class="btn btn-primary">
      <i class="bi bi-house-door me-2"></i> Quay lại Trang chủ
    </router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.container {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
