<template>
  <div class="product-page container mt-5">

    <!-- GLOBAL TOAST -->
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999">
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
    <!-- END TOAST -->

    <!-- Tiêu đề -->
    <section class="text-center mb-5">
      <h2 class="fw-bold text-primary mb-3">🛒 Danh sách sản phẩm</h2>
      <p class="text-muted lead">
        Khám phá bộ sưu tập sản phẩm chất lượng cao – dễ dàng tìm kiếm, mua hoặc thuê với giá ưu đãi.
      </p>
    </section>

    <!-- Bộ lọc -->
    <section class="filter-bar shadow-sm bg-white rounded p-3 mb-4">
      <div class="row g-3 justify-content-center align-items-center">
        <div class="col-md-4 col-sm-6">
          <input
            type="text"
            v-model="search"
            class="form-control"
            placeholder="🔍 Tìm sản phẩm..."
            @keyup.enter="applyFilters"
          />
        </div>

        <div class="col-md-3 col-sm-6">
          <select v-model="selectedCategory" class="form-select" @change="applyFilters">
            <option value="">-- Tất cả danh mục --</option>
            <option v-for="c in categories" :key="c.categoryId" :value="c.categoryId">
              {{ c.name }}
            </option>
          </select>
        </div>

        <div class="col-md-3 col-sm-6">
          <select v-model="selectedType" class="form-select" @change="applyFilters">
            <option value="">-- Mua & Thuê --</option>
            <option value="buy">Sản phẩm bán</option>
            <option value="rent">Sản phẩm cho thuê</option>
          </select>
        </div>

        <div class="col-md-2 d-flex gap-2 justify-content-center">
          <button class="btn btn-primary flex-grow-1" @click="applyFilters">
            <i class="bi bi-funnel"></i> Lọc
          </button>
          <button class="btn btn-outline-secondary" @click="resetFilters">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- Danh sách sản phẩm -->
    <section class="row g-4">

      <template v-if="loading">
        <div
          class="col-xl-3 col-lg-4 col-md-6 col-sm-6"
          v-for="n in pageSize"
          :key="'skeleton-' + n"
        >
          <div class="skeleton-card"></div>
        </div>
      </template>

      <template v-else>
        <div
          class="col-xl-3 col-lg-4 col-md-6 col-sm-6"
          v-for="p in products"
          :key="p.idProduct"
        >
          <div class="product-card card h-100 shadow-sm">
            <div class="image-wrapper">
              <img
                :src="getImageUrl(p.image)"
                class="card-img-top"
                :alt="p.name"
                @error="fallbackImage"
              />
            </div>

            <div class="card-body d-flex flex-column justify-content-between">
              <div>
                <h6 class="product-name">{{ p.name }}</h6>
                <p class="text-muted small mb-2">{{ getCategoryName(p.categoryId) }}</p>
              </div>

              <div>
                <p class="fw-bold text-primary mb-3">{{ formatPrice(p.price) }}</p>

                <div class="d-grid gap-2">

                  <router-link
                    :to="`/products/${p.idProduct}`"
                    class="btn btn-outline-primary btn-sm"
                  >
                    Xem chi tiết
                  </router-link>

                  <button
                    v-if="!p.isRental"
                    class="btn btn-success btn-sm"
                    @click="addToCart(p.idProduct, p.name)"
                    :disabled="adding[p.idProduct]"
                  >
                    <span v-if="adding[p.idProduct]" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-cart-plus"></i>
                    <span v-if="!adding[p.idProduct]"> Thêm vào giỏ hàng </span>
                  </button>

                  <button
                    v-if="p.isRental"
                    class="btn btn-primary btn-sm"
                    @click="createRental(p)"
                    :disabled="creating[p.idProduct]"
                  >
                    <span v-if="creating[p.idProduct]" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-box-seam"></i>
                    <span v-if="!creating[p.idProduct]"> Thuê thiết bị </span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-if="!loading && products.length === 0" class="text-center text-muted mt-5">
        <i class="bi bi-search fs-3 d-block mb-2"></i>
        Không tìm thấy sản phẩm phù hợp.
      </div>
    </section>

    <!-- Phân trang -->
    <nav v-if="totalPages > 1" class="mt-4 d-flex justify-content-center">
      <ul class="pagination shadow-sm">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="changePage(currentPage - 1)">Trước</button>
        </li>

        <li
          class="page-item"
          v-for="page in totalPages"
          :key="page"
          :class="{ active: currentPage === page }"
        >
          <button class="page-link" @click="changePage(page)">
            {{ page }}
          </button>
        </li>

        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">Sau</button>
        </li>
      </ul>
    </nav>

  </div>
</template>

<script setup>
/* ————— IMPORT ————— */
import { ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import cartApi from "@/services/cartService";
import rentalService from "@/services/rentalService";
import defaultImage from "@/assets/no-image.png";
import { useRentalCartStore } from "@/stores/rentalCart";

const rentalCartStore = useRentalCartStore();
const backendUrl = "https://localhost:44303";

const route = useRoute();
const router = useRouter();

/* ————— STATE ————— */
const allProducts = ref([]);
const products = ref([]);
const categories = ref([]);
const search = ref(route.query.search || "");
const selectedCategory = ref(route.query.category || "");
const selectedType = ref(route.query.type || "");
const currentPage = ref(parseInt(route.query.page) || 1);
const pageSize = 12;
const totalPages = ref(1);
const adding = ref({});
const creating = ref({});
const loading = ref(false);

/* 🍞 Toast list */
const toasts = ref([]);

/* ————— TOAST FUNCTIONS ————— */
function showToast(message, type = "success") {
  toasts.value.push({ message, type });
  setTimeout(() => {
    toasts.value.shift();
  }, 2500);
}
function removeToast(index) {
  toasts.value.splice(index, 1);
}

/* ————— HELPERS ————— */
function getImageUrl(path) {
  if (!path) return defaultImage;
  return path.startsWith("http")
    ? path
    : `${backendUrl}/${path.replace(/^\/+/, "")}`;
}
function fallbackImage(e) {
  e.target.src = defaultImage;
}
function formatPrice(value) {
  return value ? value.toLocaleString("vi-VN") + " ₫" : "0 ₫";
}
function getCategoryName(id) {
  const c = categories.value.find((x) => x.categoryId === id);
  return c ? c.name : "Không có danh mục";
}

/* ————— LOAD DATA ————— */
async function loadCategories() {
  const res = await api.get("/Category");
  categories.value = res.data;
}

async function loadAllProducts() {
  loading.value = true;
  try {
    const res = await api.get("/Product", {
      params: {
        search: search.value,
        categoryId: selectedCategory.value || undefined
      }
    });

    let items = res.data.items || res.data;

    if (selectedType.value === "buy") items = items.filter(x => !x.isRental);
    if (selectedType.value === "rent") items = items.filter(x => x.isRental);

    items = items.sort(() => Math.random() - 0.5);

    allProducts.value = items;
    totalPages.value = Math.ceil(items.length / pageSize);

    updateProductsByPage();
  } finally {
    loading.value = false;
  }
}

function updateProductsByPage() {
  const start = (currentPage.value - 1) * pageSize;
  products.value = allProducts.value.slice(start, start + pageSize);
}

/* ————— FILTER & PAGINATION ————— */
function applyFilters() {
  currentPage.value = 1;
  router.push({
    path: "/products",
    query: {
      search: search.value || undefined,
      category: selectedCategory.value || undefined,
      type: selectedType.value || undefined,
      page: 1
    }
  });
  loadAllProducts();
}

function resetFilters() {
  search.value = "";
  selectedCategory.value = "";
  selectedType.value = "";
  currentPage.value = 1;

  router.push({ path: "/products" });
  loadAllProducts();
}

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;

  currentPage.value = page;
  router.push({
    path: "/products",
    query: {
      search: search.value || undefined,
      category: selectedCategory.value || undefined,
      type: selectedType.value || undefined,
      page
    }
  });

  updateProductsByPage();
}

/* ————— CART ————— */
async function addToCart(productId, name) {
  if (!localStorage.getItem("token")) {
    showToast("Vui lòng đăng nhập để thêm sản phẩm", "danger");
    router.push("/login");
    return;
  }
  try {
    adding.value[productId] = true;
    await cartApi.addItem(productId, 1);
    showToast(`Đã thêm "${name}" vào giỏ hàng!`, "success");
  } catch (e) {
    showToast("Không thể thêm sản phẩm!", "danger");
  } finally {
    adding.value[productId] = false;
  }
}

/* ————— RENTAL ————— */
async function createRental(p) {
  if (!localStorage.getItem("token")) {
    showToast("Vui lòng đăng nhập để thuê sản phẩm", "danger");
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
    showToast(`Tạo đơn thuê thiết bị "${p.name}" thành công!`, "success");
  } catch {
    showToast("Không thể tạo đơn thuê!", "danger");
  } finally {
    creating.value[p.idProduct] = false;
  }
}

/* ————— WATCH ROUTE ————— */
watch(
  () => route.query,
  () => {
    search.value = route.query.search || "";
    selectedCategory.value = route.query.category || "";
    selectedType.value = route.query.type || "";
    currentPage.value = parseInt(route.query.page) || 1;
    updateProductsByPage();
  },
  { immediate: true }
);

onMounted(() => {
  loadCategories();
  loadAllProducts();
});
</script>

<style scoped>
/* Toast size */
.toast {
  min-width: 260px;
}

/* PAGE */
.product-page {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
}

/* FILTER BAR */
.filter-bar {
  border: 1px solid #e5e7eb;
}
.form-control,
.form-select {
  border-radius: 10px;
}
.form-control:focus,
.form-select:focus {
  border-color: #003366;
  box-shadow: 0 0 0 0.15rem rgba(0, 51, 102, 0.25);
}

/* PRODUCT CARD */
.product-card {
  border-radius: 16px;
  overflow: hidden;
  transition: 0.25s;
}
.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
.image-wrapper {
  height: 220px;
  background-color: #f1f3f5;
  display: flex;
  justify-content: center;
  align-items: center;
}
.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.product-name {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* SKELETON */
.skeleton-card {
  height: 350px;
  border-radius: 16px;
  background: linear-gradient(-90deg, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%);
  background-size: 400% 400%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* PAGINATION */
.pagination .page-link {
  color: #003366;
  border-radius: 8px;
}
.pagination .page-item.active .page-link {
  background-color: #003366;
  color: #fff;
}
</style>
