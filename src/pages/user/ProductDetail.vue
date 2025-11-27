<template>
  <div class="product-detail container py-5" v-if="!isLoading && product">
    <div class="row g-5 align-items-start flex-column flex-md-row">
      <!-- Ảnh sản phẩm -->
      <div class="col-md-5 text-center">
        <div class="image-container position-relative rounded-4 shadow-sm overflow-hidden bg-white">
          <img
            :src="currentImageUrl"
            class="img-fluid main-image"
            :alt="product.name"
            @click="openZoom(currentImageUrl)"
          />
          <span
            v-if="product.quantity && product.quantity < 5"
            class="badge bg-danger position-absolute top-0 start-0 m-2 shadow-sm"
          >
            Còn lại {{ product.quantity }}
          </span>
        </div>

        <!-- Gallery ảnh nhỏ -->
        <div
          v-if="galleryImages.length > 1"
          class="thumb-gallery mt-3 d-flex justify-content-center gap-2 flex-wrap"
        >
          <img
            v-for="(img, index) in galleryImages"
            :key="index"
            :src="getImageUrl(img)"
            class="thumb border rounded"
            :class="{ active: currentImageUrl === getImageUrl(img) }"
            @click="currentImageUrl = getImageUrl(img)"
          />
        </div>
      </div>

      <!-- Thông tin cơ bản -->
      <div class="col-md-7">
        <h2 class="fw-bold text-primary mb-2">{{ product.name }}</h2>

        <p class="text-muted mb-1 small">
          Danh mục:
          <template v-if="product.categoryId">
            <router-link
              :to="`/category/${product.categoryId}`"
              class="fw-semibold text-decoration-none text-primary hover-underline"
            >
              {{ getCategoryName(product.categoryId) }}
            </router-link>
          </template>
          <template v-else>
            <span class="fst-italic text-secondary">Không có</span>
          </template>
        </p>

        <h3 class="text-primary fw-bold mb-3">{{ formatPrice(product.price) }}</h3>

        <p class="text-dark lh-base fs-6 mb-4">
          {{ product.description || "Hiện chưa có mô tả cho sản phẩm này." }}
        </p>

        <!-- Nút hành động -->
        <div class="d-grid gap-2">
          <button
            v-if="!product.isRental"
            class="btn btn-success"
            @click="addToCart"
          >
            <i class="bi bi-cart-plus me-1"></i> Thêm vào giỏ hàng
          </button>

          <button
            v-if="product.isRental"
            class="btn btn-primary"
            @click="createRental"
          >
            <i class="bi bi-calendar2-week me-1"></i> Thuê thiết bị
          </button>

          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left-circle me-1"></i> Quay lại danh sách
          </button>
        </div>

        <!-- Thông báo -->
        <transition name="fade">
          <div
            v-if="alertMessage"
            class="alert mt-3 py-2 text-center"
            :class="alertType === 'success' ? 'alert-success' : 'alert-danger'"
          >
            {{ alertMessage }}
          </div>
        </transition>
      </div>
    </div>

    <!-- Tabs thông tin -->
    <div class="mt-5">
      <ul class="nav nav-tabs border-0">
        <li class="nav-item">
          <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#desc">
            <i class="bi bi-info-circle me-1"></i> Mô tả chi tiết
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#policy">
            <i class="bi bi-shield-check me-1"></i> Chính sách bảo hành
          </button>
        </li>
      </ul>

      <div class="tab-content p-4 bg-white shadow-sm rounded-bottom">
        <div class="tab-pane fade show active" id="desc">
          <p>{{ product.longDescription || "Không có thêm thông tin chi tiết." }}</p>
        </div>
        <div class="tab-pane fade" id="policy">
          <ul class="mb-0 small">
            <li>✔ Bảo hành chính hãng 12 tháng.</li>
            <li>✔ Đổi trả trong 7 ngày nếu lỗi kỹ thuật.</li>
            <li>✔ Hỗ trợ kỹ thuật miễn phí suốt thời gian sử dụng.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Sản phẩm tương tự -->
    <div class="mt-5">
      <h4 class="fw-semibold mb-3 text-primary">🔁 Sản phẩm tương tự</h4>
      <div class="row g-4">
        <div
          class="col-lg-3 col-md-4 col-sm-6"
          v-for="p in relatedProducts"
          :key="p.idProduct"
        >
          <div class="product-card card h-100 shadow-sm">
            <div class="image-wrapper">
              <img
                :src="getImageUrl(p.image)"
                class="card-img-top"
                :alt="p.name"
                @click="$router.push(`/products/${p.idProduct}`)"
              />
            </div>
            <div class="card-body d-flex flex-column justify-content-between">
              <div>
                <h6 class="card-title product-name text-truncate">{{ p.name }}</h6>
                <p class="text-muted small mb-1">{{ getCategoryName(p.categoryId) }}</p>
              </div>
              <div>
                <p class="fw-bold text-primary mb-2">{{ formatPrice(p.price) }}</p>
                <div class="d-grid gap-2">
                  <router-link
                    :to="`/products/${p.idProduct}`"
                    class="btn btn-outline-primary btn-sm w-100"
                  >
                    Chi tiết
                  </router-link>
                  <button
                    v-if="!p.isRental"
                    class="btn btn-success btn-sm w-100"
                    @click="addToCartSimilar(p.idProduct)"
                  >
                    <i class="bi bi-cart-plus me-1"></i> Thêm vào giỏ
                  </button>
                  <button
                    v-if="p.isRental"
                    class="btn btn-primary btn-sm w-100"
                    @click="createRentalSimilar(p)"
                  >
                    <i class="bi bi-box-seam me-1"></i> Thuê
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="relatedProducts.length === 0" class="text-center text-muted mt-3">
          Không có sản phẩm tương tự.
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Zoom ảnh -->
  <div v-if="zoomImage" class="zoom-modal" @click="zoomImage = null">
    <img :src="zoomImage" alt="Zoom" class="zoomed-image" />
  </div>

  <!-- Loading -->
  <div v-else-if="isLoading" class="text-center mt-5">
    <div class="spinner-border text-primary" role="status"></div>
    <p class="mt-2">Đang tải sản phẩm...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import cartApi from "@/services/cartService";
import rentalService from "@/services/rentalService";
import defaultImage from "@/assets/no-image.png";

const backendUrl = "https://localhost:44303";
const route = useRoute();
const router = useRouter();

const product = ref(null);
const relatedProducts = ref([]);
const galleryImages = ref([]);
const currentImageUrl = ref(defaultImage);
const zoomImage = ref(null);
const alertMessage = ref("");
const alertType = ref("success");
const isLoading = ref(true);
const adding = ref({});
const creating = ref({});
const categories = ref([]);

function showAlert(message, type = "success") {
  alertMessage.value = message;
  alertType.value = type;
  setTimeout(() => (alertMessage.value = ""), 3000);
}

function getImageUrl(path) {
  if (!path) return defaultImage;
  return path.startsWith("http")
    ? path
    : `${backendUrl}/${path.replace(/^\/+/, "")}`;
}

function formatPrice(value) {
  return value ? value.toLocaleString("vi-VN") + " ₫" : "0 ₫";
}

function getCategoryName(id) {
  const c = categories.value.find((x) => x.categoryId === id);
  return c ? c.name : "Không có danh mục";
}

function goBack() {
  router.push("/products");
}

function openZoom(url) {
  zoomImage.value = url;
}

// Thêm vào giỏ hàng cho sản phẩm chi tiết
async function addToCart() {
  if (!localStorage.getItem("token")) {
    showAlert("Vui lòng đăng nhập để thêm sản phẩm!", "danger");
    router.push("/login");
    return;
  }
  try {
    await cartApi.addItem(product.value.idProduct, 1);
    showAlert("✅ Đã thêm sản phẩm vào giỏ!", "success");
  } catch (err) {
    console.error(err);
    showAlert("❌ Không thể thêm sản phẩm!", "danger");
  }
}

// Tạo đơn thuê cho sản phẩm chi tiết
async function createRental() {
  if (!localStorage.getItem("token")) {
    showAlert("Vui lòng đăng nhập để tạo đơn thuê!", "danger");
    router.push("/login");
    return;
  }
  creating.value[product.value.idProduct] = true;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 7);
  const payload = {
    productId: product.value.idProduct,
    quantity: 1,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
  try {
    const res = await rentalService.createRental(payload);
    showAlert(`✅ Tạo đơn thuê thành công! Mã đơn: ${res.rentalId}`, "success");
  } catch (err) {
    console.error(err);
    showAlert(err.response?.data || err.message || "❌ Không thể tạo đơn thuê!", "danger");
  } finally {
    creating.value[product.value.idProduct] = false;
  }
}

// Thêm vào giỏ cho sản phẩm tương tự
async function addToCartSimilar(id) {
  if (!localStorage.getItem("token")) {
    showAlert("Vui lòng đăng nhập để thêm sản phẩm!", "danger");
    router.push("/login");
    return;
  }
  try {
    adding.value[id] = true;
    await cartApi.addItem(id, 1);
    showAlert("✅ Đã thêm sản phẩm vào giỏ!", "success");
  } catch (err) {
    console.error(err);
    showAlert("❌ Không thể thêm sản phẩm!", "danger");
  } finally {
    adding.value[id] = false;
  }
}

// Thuê thiết bị cho sản phẩm tương tự
async function createRentalSimilar(p) {
  if (!localStorage.getItem("token")) {
    showAlert("Vui lòng đăng nhập để tạo đơn thuê!", "danger");
    router.push("/login");
    return;
  }
  creating.value[p.idProduct] = true;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 7);
  const payload = {
    productId: p.idProduct,
    quantity: 1,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
  try {
    await rentalService.createRental(payload);
    showAlert(`✅ Tạo đơn thuê thành công!`, "success");
  } catch (err) {
    console.error(err);
    showAlert(err.response?.data || err.message || "❌ Không thể tạo đơn thuê!", "danger");
  } finally {
    creating.value[p.idProduct] = false;
  }
}

// Load product và related products
onMounted(async () => {
  const id = route.params.id;
  try {
    // Load product
    const res = await api.get(`/Product/${id}`);
    product.value = res.data;
    galleryImages.value = product.value.images?.length
      ? product.value.images
      : [product.value.image];
    currentImageUrl.value = getImageUrl(galleryImages.value[0]);

    // Load categories
    const catRes = await api.get("/Category");
    categories.value = catRes.data;

    // Load related products
    if (product.value.categoryId) {
      const r = await api.get("/Product", { params: { categoryId: product.value.categoryId } });
      relatedProducts.value = r.data
        .filter((p) => p.idProduct !== Number(id))
        .slice(0, 4);
    }

    isLoading.value = false;
  } catch (err) {
    console.error(err);
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* Sử dụng lại style từ ProductCard cho sản phẩm tương tự */
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
</style>
