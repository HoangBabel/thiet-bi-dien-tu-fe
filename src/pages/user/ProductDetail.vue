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

        <!-- Gallery -->
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

      <!-- Thông tin -->
      <div class="col-md-7">
        <h2 class="fw-bold text-primary mb-2">{{ product.name }}</h2>

        <p class="text-muted mb-1 small">
          Danh mục:
          <template v-if="product.categoryId">
            <router-link
              :to="`/category/${product.categoryId}`"
              class="fw-semibold text-decoration-none text-primary"
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
          <button v-if="!product.isRental" class="btn btn-success" @click="addToCart">
            <i class="bi bi-cart-plus me-1"></i> Thêm vào giỏ hàng
          </button>

          <button v-if="product.isRental" class="btn btn-primary" @click="createRental">
            <i class="bi bi-calendar2-week me-1"></i> Thuê thiết bị
          </button>

          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left-circle me-1"></i> Quay lại danh sách
          </button>
        </div>

      </div>
    </div>

    <!-- Tabs -->
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
            <li>✔ Hỗ trợ kỹ thuật miễn phí.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Reviews -->
    <ProductReviews
  v-if="product"
  :productId="product.idProduct"
  @zoom="openZoom"
/>
    <!-- Sản phẩm tương tự -->
    <div class="mt-5">
      <h4 class="fw-semibold mb-3 text-primary">🔁 Sản phẩm tương tự</h4>
      <div class="row g-4">
        <div class="col-lg-3 col-md-4 col-sm-6" v-for="p in relatedProducts" :key="p.idProduct">
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
                    class="btn btn-outline-primary btn-sm"
                  >
                    Xem chi tiết
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
                    <i class="bi bi-box-seam me-1"></i> Thuê thiết bị
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

  <!-- Zoom ảnh -->
  <div v-if="zoomImage" class="zoom-modal" @click="zoomImage = null">
    <img :src="zoomImage" alt="Zoom" class="zoomed-image" />
  </div>

  <!-- Loading -->
  <div v-else-if="isLoading" class="text-center mt-5">
    <div class="spinner-border text-primary"></div>
    <p class="mt-2">Đang tải...</p>
  </div>




  <!-- Toast Popup góc phải -->
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 3000;">
    <div
      v-for="(t, index) in toasts"
      :key="index"
      class="toast align-items-center text-white border-0 show mb-2"
      :class="t.type === 'success' ? 'bg-success' : 'bg-danger'"
      role="alert"
    >
      <div class="d-flex">
        <div class="toast-body">{{ t.message }}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="removeToast(index)"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import cartApi from "@/services/cartService";
import rentalService from "@/services/dailyRentalService";
import reviewService from "@/services/reviewService";
import defaultImage from "@/assets/no-image.png";
import ProductReviews from "@/components/ProductReviews.vue";

const backendUrl = "http://localhost:5126";
const route = useRoute();
const router = useRouter();

const product = ref(null);
const relatedProducts = ref([]);
const galleryImages = ref([]);
const currentImageUrl = ref(defaultImage);
const zoomImage = ref(null);

const isLoading = ref(true);
const categories = ref([]);

const isLoggedIn = !!localStorage.getItem("token");

const reviews = ref({
  success: false,
  data: [],
  total: 0,
  averageRating: 0,
});

/* TOAST */
const toasts = ref([]);

function showToast(message, type = "success") {
  toasts.value.push({ message, type });
  setTimeout(() => {
    toasts.value.shift();
  }, 3000);
}

function removeToast(i) {
  toasts.value.splice(i, 1);
}

/* IMAGE */
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

/* REVIEW */
const showReviewModal = ref(false);
const reviewAlert = ref("");

const newReview = ref({
  rating: 0,
  comment: "",
  imageUrls: [],
});

function normalizeReviewsPayload(payload) {
  if (!payload)
    return { success: false, data: [], total: 0, averageRating: 0 };

  const mapped = (payload.data || []).map((r) => {
    const imgs = Array.isArray(r.imageUrls)
      ? r.imageUrls
      : r.imageUrls
      ? String(r.imageUrls).split(",")
      : [];

    return {
      ...r,
      imageUrls: imgs.map((img) => getImageUrl(img)),
    };
  });

  return {
    success: payload.success ?? true,
    data: mapped,
    total: payload.total ?? mapped.length,
    averageRating:
      payload.averageRating ??
      (mapped.length
        ? mapped.reduce((s, v) => s + v.rating, 0) / mapped.length
        : 0),
  };
}

async function loadReviews() {
  try {
    if (!product.value) return;
    const res = await reviewService.getProductReviews(product.value.idProduct);
    reviews.value = normalizeReviewsPayload(res);
  } catch {
    console.error("Load reviews failed");
  }
}

function openReviewModal() {
  reviewAlert.value = "";
  newReview.value = { rating: 0, comment: "", imageUrls: [] };
  showReviewModal.value = true;
}

function closeReviewModal() {
  showReviewModal.value = false;
  reviewAlert.value = "";
}

async function submitReview() {
  reviewAlert.value = "";

  if (!product.value) {
    reviewAlert.value = "Sản phẩm chưa sẵn sàng!";
    return;
  }

  const rating = Number(newReview.value.rating);
  const comment = newReview.value.comment?.trim();

  if (rating < 1 || rating > 5) {
    reviewAlert.value = "Bạn phải chọn số sao từ 1 đến 5!";
    return;
  }

  if (!comment || comment.length < 10) {
    reviewAlert.value = "Nội dung đánh giá phải từ 10 ký tự!";
    return;
  }

  const dto = {
    productId: product.value.idProduct,
    rating,
    comment,
    imageUrls: newReview.value.imageUrls || [],
  };

  try {
    const res = await reviewService.createReview(dto);
    const created = res?.data ?? res;

    const imgs = Array.isArray(created.imageUrls)
      ? created.imageUrls
      : created.imageUrls
      ? String(created.imageUrls).split(",")
      : [];

    const newItem = {
      ...created,
      imageUrls: imgs.map((i) => getImageUrl(i)),
    };

    reviews.value.data.unshift(newItem);
    reviews.value.total++;
    reviews.value.averageRating =
      (reviews.value.averageRating * (reviews.value.total - 1) + rating) /
      reviews.value.total;

    showToast("Gửi đánh giá thành công!");
    closeReviewModal();
  } catch (err) {
    reviewAlert.value =
      err?.errors?.Comment?.[0] ||
      err?.title ||
      "Gửi đánh giá thất bại!";
  }
}

/* CART + RENTAL */
async function addToCart() {
  if (!isLoggedIn) return router.push("/login");
  await cartApi.addItem(product.value.idProduct, 1);
  showToast("Đã thêm vào giỏ hàng!");
}

async function createRental() {
  if (!isLoggedIn) return router.push("/login");
  await rentalService.createRental({
    productId: product.value.idProduct,
    quantity: 1,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  showToast("Tạo đơn thuê thành công!");
}

async function addToCartSimilar(id) {
  if (!isLoggedIn) return router.push("/login");
  await cartApi.addItem(id, 1);
  showToast("Đã thêm vào giỏ!");
}

async function createRentalSimilar(p) {
  if (!isLoggedIn) return router.push("/login");
  await rentalService.createRental({
    productId: p.idProduct,
    quantity: 1,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  showToast("Đã tạo đơn thuê!");
}

/* LOAD DATA */
async function loadProductDetails(id) {
  isLoading.value = true;
  product.value = null;

  try {
    const res = await api.get(`/Product/${id}`);
    product.value = res.data;

    galleryImages.value =
      product.value.images?.length > 0
        ? product.value.images
        : [product.value.image];

    currentImageUrl.value = getImageUrl(galleryImages.value[0]);

    const catRes = await api.get("/Category");
    categories.value = catRes.data;

    const related = await api.get("/Product", {
      params: { categoryId: product.value.categoryId },
    });

    relatedProducts.value = related.data
      .filter((p) => p.idProduct !== Number(id))
      .slice(0, 4);

    await loadReviews();
  } catch {
    console.error("Failed to load product");
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await loadProductDetails(route.params.id);
});

/* KEY FIX: Reload khi ID thay đổi */
watch(
  () => route.params.id,
  async (newId) => {
    await loadProductDetails(newId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
);
</script>

<style scoped>
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

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2000;
}

.modal-content-custom {
  width: 400px;
  max-width: 90%;
}
</style>
