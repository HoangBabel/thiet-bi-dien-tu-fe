<template>
  <div class="cart-page container py-5">
    <h2 class="text-center mb-5 fw-bold text-dark">
      🛒 Giỏ hàng của bạn
    </h2>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="text-muted mt-3">Đang tải giỏ hàng...</p>
    </div>

    <!-- Giỏ hàng trống -->
    <div
      v-else-if="!cart.items?.length"
      class="empty-cart text-center p-5 rounded-4 shadow-sm bg-gradient"
    >
      <i class="bi bi-cart-x display-4 text-secondary"></i>
      <p class="mt-3 fs-5 text-muted">
        Giỏ hàng trống. Hãy thêm sản phẩm để tiếp tục mua sắm!
      </p>
      <router-link to="/products" class="btn btn-primary mt-3 shadow-sm">
        <i class="bi bi-shop me-1"></i> Quay lại cửa hàng
      </router-link>
    </div>

    <!-- Danh sách sản phẩm -->
    <div v-else class="cart-card card border-0 shadow-sm rounded-4 p-4">
      <div class="table-responsive">
        <table class="table align-middle text-center mb-0">
          <thead class="table-header text-secondary">
            <tr>
              <th class="text-start ps-3">Sản phẩm</th>
              <th>Giá</th>
              <th style="width: 140px;">Số lượng</th>
              <th>Tổng</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <CartItem
              v-for="it in cart.items"
              :key="it.id"
              :item="it"
              @update="updateQuantity"
              @remove="removeItem"
            />
          </tbody>
        </table>
      </div>

      <!-- Tổng cộng -->
      <div
        class="cart-summary d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 px-3"
      >
        <button
          class="btn btn-outline-danger mb-3 mb-md-0 px-4"
          @click="clearCart"
        >
          <i class="bi bi-trash3 me-1"></i> Xóa toàn bộ
        </button>

        <div class="text-md-end">
          <h5 class="mb-2 fw-semibold">
            Tổng cộng:
            <span class="text-primary fs-4">{{ formatPrice(cart.subtotal) }}</span>
          </h5>

          <div class="d-flex flex-wrap gap-2 justify-content-md-end mt-2">
            <button class="btn btn-success px-4 shadow-sm" @click="goToCheckout">
              <i class="bi bi-cash-stack me-1"></i> Thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import CartItem from "@/components/CartItem.vue"
import cartApi from "@/services/cartService"

const cart = ref({ items: [], subtotal: 0 })
const loading = ref(false)
const router = useRouter()

function formatPrice(v) {
  return v ? v.toLocaleString("vi-VN") + " ₫" : "0 ₫"
}

async function loadCart() {
  loading.value = true
  try {
    cart.value = await cartApi.getCart()
  } catch (err) {
    console.error("Lỗi tải giỏ hàng:", err)
  } finally {
    loading.value = false
  }
}

async function updateQuantity({ productId, quantity }) {
  await cartApi.updateQuantity(productId, quantity)
  await loadCart()
}

async function removeItem(productId) {
  await cartApi.removeItem(productId)
  await loadCart()
}

async function clearCart() {
  if (confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng không?")) {
    await cartApi.clearCart()
    await loadCart()
  }
}

function goToCheckout() {
  const token = localStorage.getItem("token")
  if (!token) {
    alert("Vui lòng đăng nhập để tiếp tục thanh toán.")
    router.push("/login")
    return
  }
  router.push("/checkout")
}

function goToRentalCreate() {
  const token = localStorage.getItem("token")
  if (!token) {
    alert("Vui lòng đăng nhập để tiếp tục thuê thiết bị.")
    router.push("/login")
    return
  }
  router.push("/rentalCreate")
}

onMounted(loadCart)
</script>

<style scoped>
/* ===================== Tổng thể ===================== */
.cart-page {
  max-width: 1100px;
}
h2 {
  color: #212529;
  letter-spacing: 0.3px;
}
.card {
  border-radius: 1rem;
}

/* ===================== Bảng ===================== */
.table {
  border-collapse: separate;
  border-spacing: 0 8px;
}
.table-header {
  background-color: #f8f9fb;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.table tbody tr {
  background: #fff;
  transition: all 0.25s ease;
  border-radius: 12px;
}
.table tbody tr:hover {
  background-color: #f2f7ff;
  transform: translateY(-2px);
}

/* ===================== Giỏ hàng trống ===================== */
.empty-cart {
  background: linear-gradient(145deg, #ffffff, #f4f6f8);
  border: 1px solid #e6e9ee;
}
.empty-cart i {
  opacity: 0.8;
}

/* ===================== Khu vực tổng cộng ===================== */
.cart-summary {
  border-top: 1px solid #dee2e6;
  padding-top: 1.2rem;
}
.cart-summary h5 {
  color: #333;
}
.cart-summary .text-primary {
  font-weight: 700;
}

/* ===================== Nút & Hiệu ứng ===================== */
.btn {
  border-radius: 0.6rem;
  transition: all 0.2s ease;
}
.btn:hover {
  transform: translateY(-1px);
}
.btn-success {
  background-color: #198754;
  border-color: #198754;
}
.btn-success:hover {
  background-color: #157347;
}
.btn-outline-primary:hover {
  background-color: #0d6efd;
  color: #fff;
}

/* ===================== Responsive ===================== */
@media (max-width: 768px) {
  .cart-summary {
    flex-direction: column;
    text-align: center;
  }
  .cart-summary h5 {
    font-size: 1.1rem;
  }
}
</style>
