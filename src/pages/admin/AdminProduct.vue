<template>
  <div class="product-admin-container">
    <h2 class="mb-3 fw-bold text-dark">🛍️ Quản lý sản phẩm</h2>

    <!-- Bộ lọc và tìm kiếm -->
    <div class="d-flex flex-wrap align-items-center mb-4 gap-2">

      <!-- Search -->
      <div class="input-group" style="max-width: 400px;">
        <input
          type="text"
          v-model="search"
          class="form-control"
          placeholder="Tìm theo tên sản phẩm..."
          @keyup.enter="applyFilters"
        />
        <button class="btn btn-gradient" @click="applyFilters">Tìm</button>
      </div>

      <!-- Lọc danh mục -->
      <div class="ms-auto">
        <select v-model="categoryFilter" class="form-select shadow-sm" style="width: 200px;" @change="applyFilters">
          <option value="">Tất cả danh mục</option>
          <option v-for="c in categories" :key="c.categoryId" :value="c.categoryId">
            {{ c.name }}
          </option>
        </select>
      </div>

      <!-- 🔥 Lọc loại sản phẩm (Mua / Thuê) -->
      <div>
        <select v-model="typeFilter" class="form-select shadow-sm" style="width: 200px;" @change="applyFilters">
          <option value="">Mua & Thuê</option>
          <option value="buy">Sản phẩm bán</option>
          <option value="rent">Sản phẩm cho thuê</option>
        </select>
      </div>

      <button class="btn btn-success ms-2" @click="openForm()">+ Thêm sản phẩm</button>
    </div>

    <!-- Bảng sản phẩm -->
    <div class="table-responsive shadow-sm rounded-3">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>#</th>
            <th>Ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Loại</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Trạng thái</th>
            <th>Danh mục</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in pagedProducts" :key="p.idProduct">
            <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>
              <img :src="getImageUrl(p.image)" @error="onImageError" class="rounded" width="60" height="60" />
            </td>
            <td>{{ p.name }}</td>

            <!-- 🔥 Loại sản phẩm -->
            <td>
              <span class="badge" :class="p.isRental ? 'bg-info' : 'bg-primary'">
                {{ p.isRental ? "Cho thuê" : "Bán" }}
              </span>
            </td>

            <td>{{ formatPrice(p.price) }}</td>
            <td>{{ p.quantity }}</td>

            <td>
              <span :class="statusClass(p.status)">
                {{ statusLabel(p.status) }}
              </span>
            </td>

            <td>{{ getCategoryName(p.categoryId) }}</td>

            <td>
              <button class="btn btn-sm btn-warning me-2" @click="openForm(p)"> Chỉnh Sửa</button>
              <!-- <button class="btn btn-sm btn-danger" @click="deleteProduct(p.idProduct)">Xóa</button> -->
            </td>
          </tr>

          <tr v-if="pagedProducts.length === 0">
            <td colspan="9" class="text-center text-muted py-3">Không tìm thấy sản phẩm phù hợp.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Phân trang -->
    <nav v-if="totalPages > 1" class="mt-3 d-flex justify-content-center">
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
          <button class="page-link" @click="changePage(page)">{{ page }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">Sau</button>
        </li>
      </ul>
    </nav>

    <!-- Modal thêm/sửa -->
    <div class="modal fade" id="productModal" tabindex="-1" ref="modalRef">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">{{ form.idProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm" }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="saveProduct">
            <div class="modal-body">
              <div class="row">

                <!-- Image -->
                <div class="col-md-4 text-center">
                  <img
                    :src="previewUrl || (form.image && getImageUrl(form.image)) || defaultImage"
                    class="img-thumbnail mb-3"
                    width="180"
                    height="160"
                  />
                  <input type="file" class="form-control" @change="onFileChange" accept=".jpg,.jpeg,.png,.webp" />
                </div>

                <div class="col-md-8">

                  <div class="mb-3">
                    <label class="form-label">Tên sản phẩm</label>
                    <input v-model="form.name" class="form-control" required />
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Giá</label>
                      <input v-model.number="form.price" type="number" class="form-control" required />
                    </div>

                    <div class="col-md-6 mb-3">
                      <label class="form-label">Số lượng</label>
                      <input v-model.number="form.quantity" type="number" class="form-control" required />
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Danh mục</label>
                    <select v-model="form.categoryId" class="form-select" required>
                      <option value="">-- Chọn danh mục --</option>
                      <option v-for="c in categories" :key="c.categoryId" :value="c.categoryId">
                        {{ c.name }}
                      </option>
                    </select>
                  </div>

                  <!-- 🔥 Loại sản phẩm -->
                  <div class="mb-3">
                    <label class="form-label">Loại sản phẩm</label>
                    <select v-model="form.isRental" class="form-select" required>
                      <option :value="false">Sản phẩm bán</option>
                      <option :value="true">Sản phẩm cho thuê</option>
                    </select>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Mô tả</label>
                    <textarea v-model="form.description" class="form-control" rows="3"></textarea>
                  </div>

                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Hủy</button>
              <button class="btn btn-success" type="submit">Lưu</button>
            </div>

          </form>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { Modal } from "bootstrap";
import api from "@/services/api";

const backendUrl = "https://localhost:44303";
const defaultImage = "https://via.placeholder.com/60";

const products = ref([]);
const categories = ref([]);

const search = ref("");
const categoryFilter = ref("");
const typeFilter = ref("");   // 🔥 lọc mới: buy / rent / all

const currentPage = ref(1);
const pageSize = 10;
const totalPages = ref(1);

const modalRef = ref(null);
let modalInstance = null;

const previewUrl = ref(null);
let selectedFile = null;

const form = reactive({
  idProduct: null,
  name: "",
  price: 0,
  quantity: 0,
  categoryId: "",
  description: "",
  status: "ConHang",
  isRental: false,        // 🔥 thêm trường
  image: ""
});

// ===== LOAD DATA =====
async function loadProducts() {
  const res = await api.get("/Product");
  products.value = res.data;
  applyFilters();
}

async function loadCategories() {
  const res = await api.get("/Category");
  categories.value = res.data;
}

// ===== FILTER =====
const filteredProducts = computed(() => {
  let list = products.value;

  if (search.value)
    list = list.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()));

  if (categoryFilter.value)
    list = list.filter(p => p.categoryId === categoryFilter.value);

  if (typeFilter.value === "buy")
    list = list.filter(p => !p.isRental);
  else if (typeFilter.value === "rent")
    list = list.filter(p => p.isRental);

  return list;
});

const pagedProducts = computed(() => {
  totalPages.value = Math.ceil(filteredProducts.value.length / pageSize);
  const start = (currentPage.value - 1) * pageSize;
  return filteredProducts.value.slice(start, start + pageSize);
});

function applyFilters() {
  currentPage.value = 1;
}

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

// ===== Helpers =====
function formatPrice(v) {
  return v ? v.toLocaleString("vi-VN") + " ₫" : "0 ₫";
}

function getCategoryName(id) {
  const c = categories.value.find(x => x.categoryId === id);
  return c ? c.name : "Không có";
}

function getImageUrl(path) {
  if (!path) return defaultImage;
  return path.startsWith("http") ? path : `${backendUrl}/${path}`;
}

function onImageError(e) {
  e.target.src = defaultImage;
}

function statusLabel(s) {
  if (s === "ConHang" || s === 1) return "Đang bán";
  if (s === "HetHang" || s === 2) return "Hết hàng";
  return "Ngưng bán";
}

function statusClass(s) {
  if (s === "ConHang" || s === 1) return "badge bg-success";
  if (s === "HetHang" || s === 2) return "badge bg-warning text-dark";
  return "badge bg-secondary";
}

// ===== Modal =====
function openForm(p = null) {
  if (p) {
    Object.assign(form, {
      idProduct: p.idProduct,
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      categoryId: p.categoryId,
      description: p.description,
      status: p.status,
      isRental: p.isRental,   // 🔥 load vào form
      image: p.image
    });
  } else {
    Object.assign(form, {
      idProduct: null,
      name: "",
      price: 0,
      quantity: 0,
      categoryId: "",
      description: "",
      status: "ConHang",
      isRental: false,
      image: ""
    });
  }

  previewUrl.value = null;
  selectedFile = null;

  if (!modalInstance) modalInstance = new Modal(modalRef.value);
  modalInstance.show();
}

// ===== Upload File =====
function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  previewUrl.value = URL.createObjectURL(file);
}

// ===== SAVE =====
async function saveProduct() {
  try {
    const formData = new FormData();
    formData.append("Name", form.name);
    formData.append("CategoryId", form.categoryId);
    formData.append("Price", form.price);
    formData.append("Quantity", form.quantity);
    formData.append("Description", form.description || "");
    formData.append("Status", form.status);
    formData.append("IsRental", form.isRental);  // 🔥 gửi lên API

    if (selectedFile)
      formData.append("ImageFile", selectedFile);

    if (form.idProduct) {
      await api.put(`/Product/${form.idProduct}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } else {
      await api.post("/Product/post", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }

    await loadProducts();
    modalInstance.hide();
  } catch (err) {
    console.error("Lỗi lưu sản phẩm:", err);
    alert("Không thể lưu sản phẩm!");
  }
}

// ===== DELETE =====
async function deleteProduct(id) {
  if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
  await api.delete(`/Product/${id}`);
  await loadProducts();
}

// ===== LIFECYCLE =====
onMounted(() => {
  loadCategories();
  loadProducts();
});
</script>

<style scoped>
.product-admin-container {
  padding: 2rem;
  background: #f8fafc;
  border-radius: 1rem;
  color: #1f2937;
}

/* Nút gradient */
.btn-gradient {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: white;
  border: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.btn-gradient:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

/* Badge trạng thái */
.badge {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}

/* Table */
.table {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
}
.table-hover tbody tr:hover {
  background-color: rgba(37, 99, 235, 0.05);
}

/* Modal */
.modal-content {
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(0,0,0,0.25);
}
.img-thumbnail {
  object-fit: cover;
}
</style>
