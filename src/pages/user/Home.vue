<template>
  <div class="container mt-4">
    <!-- Toast góc phải -->
    <div class="toast-container position-fixed top-0 end-0 p-3">
      <transition-group name="toast-fade">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast align-items-center text-white border-0 show mb-2"
          :class="t.type === 'success' ? 'bg-success' : 'bg-danger'"
          role="alert"
        >
          <div class="d-flex">
            <div class="toast-body">{{ t.message }}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="removeToast(t.id)"></button>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Hero Section -->
    <section class="hero-section text-center p-5 rounded-4 shadow-sm mb-5">
      <h1 class="display-5 fw-bold mb-3 text-primary">
        Mua & Thuê Thiết Bị Điện Gia Dụng
      </h1>
      <p class="lead text-muted mb-4">
        Khám phá hàng trăm sản phẩm điện chất lượng cao – từ tivi, tủ lạnh, máy giặt đến thiết bị gia dụng.<br />
        Thuê hoặc mua dễ dàng, giá tốt, dịch vụ nhanh chóng.
      </p>
      <router-link to="/products" class="btn btn-primary btn-lg">
        <i class="bi bi-bag"></i> Khám phá ngay
      </router-link>
    </section>

    <!-- Sản phẩm nổi bật mua -->
    <section>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="fw-bold text-dark mb-0">🌟 Sản phẩm nổi bật (Mua)</h3>
        <router-link to="/products" class="btn btn-outline-primary btn-sm">
          Xem tất cả
        </router-link>
      </div>

      <div class="row g-4">
        <div
          class="col-md-3 col-sm-6"
          v-for="p in shuffledBuyProducts"
          :key="'buy-' + p.idProduct"
        >
          <div class="product-card card h-100 shadow-sm">
            <div class="image-wrapper">
              <img
                :src="getImageUrl(p.image)"
                class="card-img-top"
                :alt="p.name"
                @error="handleImageError"
              />
            </div>
            <div class="card-body d-flex flex-column justify-content-between">
              <div>
                <h6 class="card-title product-name">{{ p.name }}</h6>
                <p class="text-muted small mb-1">{{ getCategoryName(p.categoryId) }}</p>
              </div>
              <div>
                <p class="fw-bold text-primary mb-2">{{ formatPrice(p.price) }}</p>
                <div class="d-grid gap-2">
                  <router-link :to="`/products/${p.idProduct}`" class="btn btn-outline-primary btn-sm">
                    Xem chi tiết
                  </router-link>
                  <button
                    class="btn btn-success btn-sm"
                    @click="addToCart(p.idProduct)"
                    :disabled="adding[p.idProduct]"
                  >
                    <span v-if="adding[p.idProduct]" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-cart-plus"></i>
                    <span v-if="!adding[p.idProduct]"> Thêm vào giỏ</span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="shuffledBuyProducts.length === 0" class="text-center text-muted mt-5">
        <i class="bi bi-info-circle fs-3 d-block mb-2"></i>
        Chưa có sản phẩm mua nổi bật nào để hiển thị.
      </div>
    </section>

    <!-- Sản phẩm nổi bật thuê -->
    <section class="mt-5">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="fw-bold text-dark mb-0">🌟 Sản phẩm nổi bật (Thuê)</h3>
        <router-link to="/products" class="btn btn-outline-primary btn-sm">
          Xem tất cả
        </router-link>
      </div>

      <div class="row g-4">
        <div
          class="col-md-3 col-sm-6"
          v-for="p in shuffledRentalProducts"
          :key="'rental-' + p.idProduct"
        >
          <div class="product-card card h-100 shadow-sm">
            <div class="image-wrapper">
              <img
                :src="getImageUrl(p.image)"
                class="card-img-top"
                :alt="p.name"
                @error="handleImageError"
              />
            </div>
            <div class="card-body d-flex flex-column justify-content-between">
              <div>
                <h6 class="card-title product-name">{{ p.name }}</h6>
                <p class="text-muted small mb-1">{{ getCategoryName(p.categoryId) }}</p>
              </div>
              <div>
                <p class="fw-bold text-primary mb-2">{{ formatPrice(p.price) }}</p>
                <div class="d-grid gap-2">
                  <router-link :to="`/products/${p.idProduct}`" class="btn btn-outline-primary btn-sm">
                    Xem chi tiết
                  </router-link>
                  <button
                    class="btn btn-primary btn-sm"
                    @click="createRental(p)"
                    :disabled="creating[p.idProduct]"
                  >
                    <span v-if="creating[p.idProduct]" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-box-seam"></i>
                    <span v-if="!creating[p.idProduct]"> Thuê Thiết Bị</span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="shuffledRentalProducts.length === 0" class="text-center text-muted mt-5">
        <i class="bi bi-info-circle fs-3 d-block mb-2"></i>
        Chưa có sản phẩm thuê nổi bật nào để hiển thị.
      </div>
    </section>

    <!-- 🎁 Mã giảm giá -->
    <section class="mt-5">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="fw-bold text-dark mb-0">🎁 Mã Giảm Giá Hiện Có</h3>
        <!-- <router-link to="/vouchers" class="btn btn-outline-primary btn-sm">
          Xem tất cả
        </router-link> -->
      </div>

      <div class="row g-4">
        <div class="col-md-3 col-sm-6" v-for="v in randomVouchers" :key="v.voucherId">
          <div class="card shadow-sm h-100 voucher-card p-3">
            <h5 class="fw-bold text-primary">{{ v.code }}</h5>
            <p class="text-muted small mb-1">{{ v.description }}</p>

            <p class="fw-bold text-success">
              Giảm:
              <span v-if="v.discountType === 'percent'">
                {{ v.discountValue }}%
              </span>
              <span v-else>{{ formatPrice(v.discountValue) }}</span>
            </p>

            <button class="btn btn-info btn-sm mt-auto" @click="copyVoucher(v.code)">
              <i class="bi bi-clipboard"></i> Copy mã
            </button>
          </div>
        </div>
      </div>

      <div v-if="randomVouchers.length === 0" class="text-center text-muted mt-4">
        <i class="bi bi-ticket fs-3 d-block mb-2"></i>
        Hiện chưa có mã giảm giá nào.
      </div>
    </section>

    <!-- Ưu điểm -->
    <section class="benefit-section mt-5 py-4 rounded-4 shadow-sm">
      <div class="row text-center">
        <div class="col-md-4">
          <i class="bi bi-truck fs-1 text-primary"></i>
          <h5 class="fw-bold mt-2">Giao hàng toàn quốc</h5>
          <p class="text-muted small">Nhanh chóng – An toàn – Tiện lợi</p>
        </div>
        <div class="col-md-4">
          <i class="bi bi-credit-card fs-1 text-primary"></i>
          <h5 class="fw-bold mt-2">Thanh toán linh hoạt</h5>
          <p class="text-muted small">Chuyển khoản, thẻ hoặc trả góp</p>
        </div>
        <div class="col-md-4">
          <i class="bi bi-headset fs-1 text-primary"></i>
          <h5 class="fw-bold mt-2">Hỗ trợ 24/7</h5>
          <p class="text-muted small">Tư vấn kỹ thuật & chăm sóc khách hàng</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import cartApi from "@/services/cartService";
import rentalService from "@/services/dailyRentalService";
import voucherService from "@/services/voucherService";
import { useRouter } from "vue-router";
import defaultImage from "@/assets/no-image.png";

const backendUrl = "http://localhost:5126";

const router = useRouter();

// === TOAST SYSTEM ===
const toasts = ref([]);

function showToast(message, type = "success") {
  const id = Date.now();
  toasts.value.push({ id, message, type });

  setTimeout(() => removeToast(id), 3000);
}

function removeToast(id) {
  toasts.value = toasts.value.filter(t => t.id !== id);
}

// === DATA ===
const featured = ref([]);
const categories = ref([]);
const vouchers = ref([]);

const adding = ref({});
const creating = ref({});

// Shuffle helper
function shuffleArray(arr) {
  return arr.map(v => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(x => x.v);
}

// Voucher section
async function loadVouchers() {
  try {
    const res = await voucherService.getAll();
    vouchers.value = res || [];
  } catch (e) {
    console.error("Lỗi tải voucher:", e);
  }
}

const randomVouchers = computed(() => shuffleArray(vouchers.value).slice(0, 4));

// Products
async function loadFeatured() {
  try {
    const res = await api.get("/Product");
    featured.value = res.data;
  } catch (err) {
    console.error("Lỗi tải sản phẩm nổi bật:", err);
  }
}

async function loadCategories() {
  try {
    const res = await api.get("/Category");
    categories.value = res.data;
  } catch (err) {
    console.error("Lỗi tải danh mục:", err);
  }
}

const shuffledBuyProducts = computed(() =>
  shuffleArray(featured.value.filter(p => !p.isRental)).slice(0, 4)
);

const shuffledRentalProducts = computed(() =>
  shuffleArray(featured.value.filter(p => p.isRental)).slice(0, 4)
);

// Helpers
function formatPrice(value) {
  return value ? value.toLocaleString("vi-VN") + " ₫" : "0 ₫";
}

function getImageUrl(path) {
  if (!path) return defaultImage;
  return path.startsWith("http")
    ? path
    : `${backendUrl}/${path.replace(/^\/+/, "")}`;
}

function handleImageError(e) {
  e.target.src = defaultImage;
}

function getCategoryName(id) {
  const c = categories.value.find(x => x.categoryId === id);
  return c ? c.name : "Không có danh mục";
}

// === CART ===
async function addToCart(productId) {
  if (!localStorage.getItem("token")) {
    showToast("Vui lòng đăng nhập để thêm sản phẩm!", "danger");
    router.push("/login");
    return;
  }

  try {
    adding.value[productId] = true;
    await cartApi.addItem(productId, 1);
    showToast("✔ Đã thêm vào giỏ hàng!", "success");
  } catch (_) {
    showToast("❌ Không thể thêm vào giỏ!", "danger");
  } finally {
    adding.value[productId] = false;
  }
}

// === RENTAL ===
async function createRental(p) {
  if (!localStorage.getItem("token")) {
    showToast("Vui lòng đăng nhập để thuê thiết bị!", "danger");
    router.push("/login");
    return;
  }

  creating.value[p.idProduct] = true;

  const payload = {
    productId: p.idProduct,
    quantity: 1,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString()
  };

  try {
    await rentalService.createRental(payload);
    showToast("✔ Tạo đơn thuê thành công!", "success");
  } catch (err) {
    showToast("❌ Không thể tạo đơn thuê!", "danger");
  } finally {
    creating.value[p.idProduct] = false;
  }
}

// === COPY VOUCHER ===
function copyVoucher(code) {
  navigator.clipboard.writeText(code);
  showToast("📋 Đã copy mã: " + code, "success");
}

// Load on mount
onMounted(() => {
  loadFeatured();
  loadCategories();
  loadVouchers();
});
</script>

<style scoped>
/* ===== TOAST ===== */
.toast-container {
  z-index: 9999;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.4s ease;
}
.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ===== HERO ===== */
.hero-section {
  background: linear-gradient(180deg, #ffffff 0%, #f4f5f7 100%);
  color: #212529;
  border: 1px solid #dee2e6;
}

/* ===== CARD ===== */
.product-card {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.image-wrapper {
  height: 200px;
  background: linear-gradient(180deg, #f8f9fa 0%, #f1f3f5 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
  border-radius: 14px 14px 0 0;
  overflow: hidden;
}
.image-wrapper img {
  object-fit: contain;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}
.image-wrapper:hover img {
  transform: scale(1.05);
}

.product-name {
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
}

/* Buttons */
.btn-primary {
  background-color: #003366;
  border-color: #003366;
}
.btn-primary:hover {
  background-color: #00264d;
}
.btn-outline-primary {
  color: #003366;
  border-color: #003366;
}
.btn-outline-primary:hover {
  background-color: #003366;
  color: white;
}

/* Benefit */
.benefit-section {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
}

/* Voucher */
.voucher-card {
  border: 1px dashed #003366;
  background: #f8fbff;
  border-radius: 14px;
  transition: 0.2s;
}
.voucher-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}
</style>
